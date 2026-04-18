// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title MarketVault
/// @notice Escrow and payout settlement layer for prediction markets.
contract MarketVault {
    error OnlyOwner();
    error InvalidRecipient();
    error InvalidFeeRecipient();
    error InvalidFeeBps();
    error InvalidAmount();
    error InsufficientEscrow();
    error TransferFailed();

    event Deposited(uint256 indexed marketId, address indexed from, uint256 amount);
    event PayoutSent(
        uint256 indexed marketId,
        address indexed recipient,
        uint256 grossAmount,
        uint256 feeAmount,
        uint256 netAmount
    );
    event FeeRecipientUpdated(address indexed previousRecipient, address indexed newRecipient);
    event FeeBpsUpdated(uint16 previousFeeBps, uint16 newFeeBps);

    uint16 public constant MAX_BPS = 10_000;

    address public owner;
    address public feeRecipient;
    uint16 public platformFeeBps;

    mapping(uint256 => uint256) public escrowByMarket;

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address _owner, address _feeRecipient, uint16 _platformFeeBps) {
        if (_owner == address(0)) revert InvalidRecipient();
        if (_feeRecipient == address(0)) revert InvalidFeeRecipient();
        if (_platformFeeBps > MAX_BPS) revert InvalidFeeBps();

        owner = _owner;
        feeRecipient = _feeRecipient;
        platformFeeBps = _platformFeeBps;
    }

    function deposit(uint256 marketId) external payable {
        if (msg.value == 0) revert InvalidAmount();

        escrowByMarket[marketId] += msg.value;
        emit Deposited(marketId, msg.sender, msg.value);
    }

    /// @notice Pays winner(s) from market escrow and takes platform fee.
    function disbursePayout(
        uint256 marketId,
        address payable recipient,
        uint256 grossAmount
    ) external onlyOwner {
        if (recipient == address(0)) revert InvalidRecipient();
        if (grossAmount == 0) revert InvalidAmount();

        uint256 escrow = escrowByMarket[marketId];
        if (escrow < grossAmount) revert InsufficientEscrow();

        uint256 feeAmount = (grossAmount * platformFeeBps) / MAX_BPS;
        uint256 netAmount = grossAmount - feeAmount;
        escrowByMarket[marketId] = escrow - grossAmount;

        (bool sentNet, ) = recipient.call{value: netAmount}("");
        if (!sentNet) revert TransferFailed();

        if (feeAmount > 0) {
            (bool sentFee, ) = payable(feeRecipient).call{value: feeAmount}("");
            if (!sentFee) revert TransferFailed();
        }

        emit PayoutSent(marketId, recipient, grossAmount, feeAmount, netAmount);
    }

    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        if (newFeeRecipient == address(0)) revert InvalidFeeRecipient();
        address previous = feeRecipient;
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(previous, newFeeRecipient);
    }

    function setPlatformFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_BPS) revert InvalidFeeBps();
        uint16 previous = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit FeeBpsUpdated(previous, newFeeBps);
    }
}
