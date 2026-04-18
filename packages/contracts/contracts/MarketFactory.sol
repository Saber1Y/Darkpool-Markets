// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {PredictionMarket} from "./PredictionMarket.sol";

/// @title MarketFactory
/// @notice Deploys and indexes prediction markets for frontend/indexer discovery.
/// @dev No encrypted math is performed here.
contract MarketFactory {
    struct MarketDetails {
        uint256 marketId;
        address creator;
        address marketAddress;
        string question;
        string metadataURI;
        uint64 deadline;
        uint64 createdAt;
    }

    error QuestionRequired();
    error DeadlineInPast();
    error MarketNotFound();
    error InvalidResolver();
    error InvalidVault();
    error InvalidPaginationLimit();

    address public immutable resolver;
    address public immutable vault;

    uint256 private _nextMarketId = 1;
    mapping(uint256 => MarketDetails) private _marketsById;
    mapping(address => uint256[]) private _creatorMarketIds;
    uint256[] private _allMarketIds;

    event MarketCreated(
        uint256 indexed marketId,
        address indexed marketAddress,
        address indexed creator,
        string question,
        uint64 deadline,
        string metadataURI
    );

    constructor(address _resolver, address _vault) {
        if (_resolver == address(0)) revert InvalidResolver();
        if (_vault == address(0)) revert InvalidVault();
        resolver = _resolver;
        vault = _vault;
    }

    function createMarket(
        string calldata question,
        uint64 deadline,
        string calldata metadataURI
    ) external returns (uint256 marketId, address marketAddress) {
        if (bytes(question).length == 0) revert QuestionRequired();
        if (deadline <= block.timestamp) revert DeadlineInPast();

        marketId = _nextMarketId++;
        PredictionMarket market = new PredictionMarket(
            question,
            metadataURI,
            deadline,
            msg.sender,
            resolver,
            vault,
            marketId
        );
        marketAddress = address(market);

        _marketsById[marketId] = MarketDetails({
            marketId: marketId,
            creator: msg.sender,
            marketAddress: marketAddress,
            question: question,
            metadataURI: metadataURI,
            deadline: deadline,
            createdAt: uint64(block.timestamp)
        });

        _creatorMarketIds[msg.sender].push(marketId);
        _allMarketIds.push(marketId);

        emit MarketCreated(marketId, marketAddress, msg.sender, question, deadline, metadataURI);
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

    function listMarketIds(uint256 offset, uint256 limit) external view returns (uint256[] memory ids) {
        if (limit == 0) revert InvalidPaginationLimit();

        uint256 total = _allMarketIds.length;
        if (offset >= total) return new uint256[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        ids = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            ids[i - offset] = _allMarketIds[i];
        }
    }

    /// @notice Query-friendly paginator returning full market metadata.
    function listMarkets(uint256 offset, uint256 limit) external view returns (MarketDetails[] memory markets) {
        if (limit == 0) revert InvalidPaginationLimit();

        uint256 total = _allMarketIds.length;
        if (offset >= total) return new MarketDetails[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        markets = new MarketDetails[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            markets[i - offset] = _marketsById[_allMarketIds[i]];
        }
    }

    function _marketOrRevert(uint256 marketId) internal view returns (MarketDetails memory market) {
        market = _marketsById[marketId];
        if (market.creator == address(0)) revert MarketNotFound();
    }
}
