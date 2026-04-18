// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title MarketFactory
/// @notice Registry/factory layer for prediction markets.
/// @dev Keep metadata public here. Confidential logic belongs in the market contracts.
contract MarketFactory {
    enum MarketStatus {
        ACTIVE,
        CLOSED,
        RESOLVED,
        CANCELLED
    }

    struct MarketDetails {
        uint256 marketId;
        address creator;
        address marketAddress;
        string question;
        string metadataURI;
        uint64 deadline;
        uint64 createdAt;
        MarketStatus status;
        bool outcome;
        bool outcomeSet;
    }

    error QuestionRequired();
    error DeadlineInPast();
    error MarketNotFound();
    error OnlyCreator();
    error InvalidMarketAddress();
    error MarketAddressAlreadyLinked();
    error InvalidStatusTransition();
    error MarketStillActive();

    uint256 private _nextMarketId = 1;
    mapping(uint256 => MarketDetails) private _marketsById;
    mapping(address => uint256[]) private _creatorMarketIds;
    uint256[] private _allMarketIds;

    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        uint64 deadline,
        string metadataURI
    );
    event MarketAddressLinked(uint256 indexed marketId, address indexed marketAddress);
    event MarketStatusUpdated(uint256 indexed marketId, MarketStatus previousStatus, MarketStatus newStatus);
    event MarketResolved(uint256 indexed marketId, bool outcome);

    function createMarket(
        string calldata question,
        uint64 deadline,
        string calldata metadataURI
    ) external returns (uint256 marketId) {
        if (bytes(question).length == 0) revert QuestionRequired();
        if (deadline <= block.timestamp) revert DeadlineInPast();

        marketId = _nextMarketId++;
        _marketsById[marketId] = MarketDetails({
            marketId: marketId,
            creator: msg.sender,
            marketAddress: address(0),
            question: question,
            metadataURI: metadataURI,
            deadline: deadline,
            createdAt: uint64(block.timestamp),
            status: MarketStatus.ACTIVE,
            outcome: false,
            outcomeSet: false
        });

        _creatorMarketIds[msg.sender].push(marketId);
        _allMarketIds.push(marketId);

        emit MarketCreated(marketId, msg.sender, question, deadline, metadataURI);
    }

    function linkMarketAddress(uint256 marketId, address marketAddress) external {
        MarketDetails storage market = _marketOrRevert(marketId);
        if (msg.sender != market.creator) revert OnlyCreator();
        if (marketAddress == address(0)) revert InvalidMarketAddress();
        if (market.marketAddress != address(0)) revert MarketAddressAlreadyLinked();

        market.marketAddress = marketAddress;
        emit MarketAddressLinked(marketId, marketAddress);
    }

    function closeMarket(uint256 marketId) external {
        MarketDetails storage market = _marketOrRevert(marketId);
        if (msg.sender != market.creator) revert OnlyCreator();
        if (market.status != MarketStatus.ACTIVE) revert InvalidStatusTransition();
        if (block.timestamp < market.deadline) revert MarketStillActive();

        MarketStatus previousStatus = market.status;
        market.status = MarketStatus.CLOSED;
        emit MarketStatusUpdated(marketId, previousStatus, MarketStatus.CLOSED);
    }

    function cancelMarket(uint256 marketId) external {
        MarketDetails storage market = _marketOrRevert(marketId);
        if (msg.sender != market.creator) revert OnlyCreator();
        if (market.status != MarketStatus.ACTIVE) revert InvalidStatusTransition();

        MarketStatus previousStatus = market.status;
        market.status = MarketStatus.CANCELLED;
        emit MarketStatusUpdated(marketId, previousStatus, MarketStatus.CANCELLED);
    }

    /// @notice Resolve a market outcome once it is closed (or naturally expired).
    function resolveMarket(uint256 marketId, bool outcome) external {
        MarketDetails storage market = _marketOrRevert(marketId);
        if (msg.sender != market.creator) revert OnlyCreator();
        if (market.status == MarketStatus.RESOLVED || market.status == MarketStatus.CANCELLED) {
            revert InvalidStatusTransition();
        }
        if (market.status == MarketStatus.ACTIVE && block.timestamp < market.deadline) {
            revert MarketStillActive();
        }

        MarketStatus previousStatus = market.status;
        market.status = MarketStatus.RESOLVED;
        market.outcome = outcome;
        market.outcomeSet = true;

        emit MarketStatusUpdated(marketId, previousStatus, MarketStatus.RESOLVED);
        emit MarketResolved(marketId, outcome);
    }

    function getMarket(uint256 marketId) external view returns (MarketDetails memory) {
        return _marketOrRevert(marketId);
    }

    function getMarketsByCreator(address creator) external view returns (uint256[] memory) {
        return _creatorMarketIds[creator];
    }

    function totalMarkets() external view returns (uint256) {
        return _allMarketIds.length;
    }

    function nextMarketId() external view returns (uint256) {
        return _nextMarketId;
    }

    /// @notice Paginated market id listing for dashboard/indexer use.
    function listMarketIds(uint256 offset, uint256 limit) external view returns (uint256[] memory ids) {
        uint256 total = _allMarketIds.length;
        if (offset >= total) return new uint256[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        ids = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            ids[i - offset] = _allMarketIds[i];
        }
    }

    function _marketOrRevert(uint256 marketId) internal view returns (MarketDetails storage market) {
        market = _marketsById[marketId];
        if (market.creator == address(0)) revert MarketNotFound();
    }
}
