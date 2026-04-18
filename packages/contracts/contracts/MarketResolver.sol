// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

interface IPredictionMarket {
    function resolveMarket(bool outcomeYes) external;
    function publishSnapshot(uint16 confidenceYesBps, int16 confidenceDeltaBps24h, uint8 signalStrength) external;
}

/// @title MarketResolver
/// @notice Resolution authority + oracle entrypoint for markets.
contract MarketResolver {
    error OnlyOwner();
    error NotResolver();
    error InvalidResolver();
    error InvalidMarket();
    error InvalidSignalStrength();

    struct ResolutionRecord {
        bool exists;
        bool outcome;
        string evidenceURI;
        uint64 resolvedAt;
        address resolver;
    }

    struct SnapshotRecord {
        bool exists;
        uint16 confidenceYesBps;
        int16 confidenceDeltaBps24h;
        uint8 signalStrength;
        string sourceURI;
        uint64 updatedAt;
        address updater;
    }

    event ResolverUpdated(address indexed resolver, bool allowed);
    event MarketResolved(address indexed market, bool outcome, string evidenceURI, address indexed resolver);
    event SnapshotPublished(
        address indexed market,
        uint16 confidenceYesBps,
        int16 confidenceDeltaBps24h,
        uint8 signalStrength,
        string sourceURI,
        address indexed resolver
    );

    address public owner;
    mapping(address => bool) public resolvers;
    mapping(address => ResolutionRecord) public latestResolutionByMarket;
    mapping(address => SnapshotRecord) public latestSnapshotByMarket;

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyResolver() {
        if (!resolvers[msg.sender]) revert NotResolver();
        _;
    }

    constructor(address _owner) {
        if (_owner == address(0)) revert InvalidResolver();
        owner = _owner;
        resolvers[_owner] = true;
        emit ResolverUpdated(_owner, true);
    }

    function setResolver(address account, bool allowed) external onlyOwner {
        if (account == address(0)) revert InvalidResolver();
        resolvers[account] = allowed;
        emit ResolverUpdated(account, allowed);
    }

    /// @notice Pushes the final outcome into a prediction market contract.
    function resolveMarket(address market, bool outcomeYes, string calldata evidenceURI) external onlyResolver {
        if (market == address(0)) revert InvalidMarket();

        IPredictionMarket(market).resolveMarket(outcomeYes);
        latestResolutionByMarket[market] = ResolutionRecord({
            exists: true,
            outcome: outcomeYes,
            evidenceURI: evidenceURI,
            resolvedAt: uint64(block.timestamp),
            resolver: msg.sender
        });

        emit MarketResolved(market, outcomeYes, evidenceURI, msg.sender);
    }

    /// @notice Publishes coarse, non-sensitive snapshot values for frontend/indexers.
    function publishSnapshot(
        address market,
        uint16 confidenceYesBps,
        int16 confidenceDeltaBps24h,
        uint8 signalStrength,
        string calldata sourceURI
    ) external onlyResolver {
        if (market == address(0)) revert InvalidMarket();
        if (signalStrength > 2) revert InvalidSignalStrength();

        IPredictionMarket(market).publishSnapshot(confidenceYesBps, confidenceDeltaBps24h, signalStrength);
        latestSnapshotByMarket[market] = SnapshotRecord({
            exists: true,
            confidenceYesBps: confidenceYesBps,
            confidenceDeltaBps24h: confidenceDeltaBps24h,
            signalStrength: signalStrength,
            sourceURI: sourceURI,
            updatedAt: uint64(block.timestamp),
            updater: msg.sender
        });

        emit SnapshotPublished(
            market,
            confidenceYesBps,
            confidenceDeltaBps24h,
            signalStrength,
            sourceURI,
            msg.sender
        );
    }
}
