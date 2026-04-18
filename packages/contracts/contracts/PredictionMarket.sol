// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, ebool, euint32, externalEbool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PredictionMarket
/// @notice fhEVM-powered market where side/amount are stored as encrypted values.
contract PredictionMarket is ZamaEthereumConfig {
    enum MarketStatus {
        ACTIVE,
        CLOSED,
        RESOLVED,
        CANCELLED
    }

    enum SignalStrength {
        LOW,
        MEDIUM,
        HIGH
    }

    struct Position {
        ebool sideYes;
        euint32 amount;
        bool exists;
        bool claimed;
    }

    error QuestionRequired();
    error DeadlineInPast();
    error NotCreator();
    error NotResolverOrCreator();
    error InvalidStatus();
    error MarketStillActive();
    error PositionAlreadyExists();
    error PositionNotFound();
    error AlreadyClaimed();
    error InvalidConfidenceBps();

    string public question;
    string public metadataURI;
    uint64 public deadline;
    address public creator;
    address public resolver;
    MarketStatus public status;
    uint64 public participantCount;

    bool public outcomeSet;
    bool public resolvedOutcome;

    // Public, coarse market summary for UI/indexers.
    uint16 public confidenceYesBps;
    int16 public confidenceDeltaBps24h;
    SignalStrength public signalStrength;

    // Encrypted aggregates.
    euint32 private _yesPool;
    euint32 private _noPool;

    mapping(address => Position) private _positions;

    event BetPlaced(address indexed user);
    event BetIncreased(address indexed user);
    event MarketClosed();
    event MarketCancelled();
    event MarketResolved(bool outcomeYes);
    event SnapshotPublished(uint16 confidenceYesBps, int16 confidenceDeltaBps24h, SignalStrength signalStrength);
    event PoolAccessGranted(address indexed account);
    event Claimed(address indexed user);

    modifier onlyCreator() {
        if (msg.sender != creator) revert NotCreator();
        _;
    }

    modifier onlyResolverOrCreator() {
        if (msg.sender != resolver && msg.sender != creator) revert NotResolverOrCreator();
        _;
    }

    modifier onlyActive() {
        if (status != MarketStatus.ACTIVE) revert InvalidStatus();
        _;
    }

    constructor(
        string memory _question,
        string memory _metadataURI,
        uint64 _deadline,
        address _creator,
        address _resolver
    ) {
        if (bytes(_question).length == 0) revert QuestionRequired();
        if (_deadline <= block.timestamp) revert DeadlineInPast();

        question = _question;
        metadataURI = _metadataURI;
        deadline = _deadline;
        creator = _creator;
        resolver = _resolver;
        status = MarketStatus.ACTIVE;
        signalStrength = SignalStrength.LOW;
    }

    /// @notice Place first encrypted bet position.
    function placeBet(
        externalEbool inputSideYes,
        externalEuint32 inputAmount,
        bytes calldata inputProof
    ) external onlyActive {
        if (block.timestamp >= deadline) revert MarketStillActive();

        Position storage position = _positions[msg.sender];
        if (position.exists) revert PositionAlreadyExists();

        ebool sideYes = FHE.fromExternal(inputSideYes, inputProof);
        euint32 amount = FHE.fromExternal(inputAmount, inputProof);
        euint32 zero = FHE.asEuint32(0);

        position.sideYes = sideYes;
        position.amount = amount;
        position.exists = true;
        position.claimed = false;

        participantCount += 1;
        _yesPool = FHE.add(_yesPool, FHE.select(sideYes, amount, zero));
        _noPool = FHE.add(_noPool, FHE.select(sideYes, zero, amount));

        // Contract ACL for state reuse.
        FHE.allowThis(position.sideYes);
        FHE.allowThis(position.amount);
        FHE.allowThis(_yesPool);
        FHE.allowThis(_noPool);

        // User ACL for client-side decryption.
        FHE.allow(position.sideYes, msg.sender);
        FHE.allow(position.amount, msg.sender);

        emit BetPlaced(msg.sender);
    }

    /// @notice Top up existing encrypted position amount.
    function increaseBet(externalEuint32 inputAdditionalAmount, bytes calldata inputProof) external onlyActive {
        if (block.timestamp >= deadline) revert MarketStillActive();

        Position storage position = _positions[msg.sender];
        if (!position.exists) revert PositionNotFound();

        euint32 additionalAmount = FHE.fromExternal(inputAdditionalAmount, inputProof);
        euint32 zero = FHE.asEuint32(0);

        position.amount = FHE.add(position.amount, additionalAmount);
        _yesPool = FHE.add(_yesPool, FHE.select(position.sideYes, additionalAmount, zero));
        _noPool = FHE.add(_noPool, FHE.select(position.sideYes, zero, additionalAmount));

        FHE.allowThis(position.amount);
        FHE.allowThis(_yesPool);
        FHE.allowThis(_noPool);
        FHE.allow(position.amount, msg.sender);

        emit BetIncreased(msg.sender);
    }

    function closeMarket() external onlyCreator onlyActive {
        if (block.timestamp < deadline) revert MarketStillActive();

        status = MarketStatus.CLOSED;
        emit MarketClosed();
    }

    function cancelMarket() external onlyCreator onlyActive {
        status = MarketStatus.CANCELLED;
        emit MarketCancelled();
    }

    function resolveMarket(bool outcomeYes) external onlyResolverOrCreator {
        if (status == MarketStatus.RESOLVED || status == MarketStatus.CANCELLED) revert InvalidStatus();
        if (status == MarketStatus.ACTIVE && block.timestamp < deadline) revert MarketStillActive();

        status = MarketStatus.RESOLVED;
        outcomeSet = true;
        resolvedOutcome = outcomeYes;
        emit MarketResolved(outcomeYes);
    }

    /// @notice Emits coarse public values the frontend can show without revealing user positions.
    function publishSnapshot(
        uint16 _confidenceYesBps,
        int16 _confidenceDeltaBps24h,
        SignalStrength _signalStrength
    ) external onlyResolverOrCreator {
        if (_confidenceYesBps > 10_000) revert InvalidConfidenceBps();

        confidenceYesBps = _confidenceYesBps;
        confidenceDeltaBps24h = _confidenceDeltaBps24h;
        signalStrength = _signalStrength;
        emit SnapshotPublished(_confidenceYesBps, _confidenceDeltaBps24h, _signalStrength);
    }

    /// @notice Allow an authorized account to decrypt encrypted pool handles.
    function grantPoolAccess(address account) external onlyResolverOrCreator {
        FHE.allow(_yesPool, account);
        FHE.allow(_noPool, account);
        emit PoolAccessGranted(account);
    }

    /// @notice Returns encrypted pool handles. Decryption still requires ACL grant.
    function getEncryptedPools() external view returns (euint32 yesPool, euint32 noPool) {
        return (_yesPool, _noPool);
    }

    /// @notice Returns caller position handles and clear flags.
    function getMyPosition() external view returns (ebool sideYes, euint32 amount, bool exists, bool claimed) {
        Position storage position = _positions[msg.sender];
        return (position.sideYes, position.amount, position.exists, position.claimed);
    }

    /// @notice For now this only marks claim and returns encrypted winner flag.
    /// @dev Payout transfers are intentionally omitted until vault wiring is added.
    function claim() external returns (ebool isWinner) {
        if (status != MarketStatus.RESOLVED || !outcomeSet) revert InvalidStatus();

        Position storage position = _positions[msg.sender];
        if (!position.exists) revert PositionNotFound();
        if (position.claimed) revert AlreadyClaimed();

        position.claimed = true;
        isWinner = FHE.eq(position.sideYes, FHE.asEbool(resolvedOutcome));

        FHE.allowThis(isWinner);
        FHE.allow(isWinner, msg.sender);

        emit Claimed(msg.sender);
    }
}
