// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract MarketFacotry is ZamaEthereumConfig {
    mapping (address => MarketDetails) markets;

    struct MarketDetails {
        string question;
        euint32 deadline;
        euint32 resolved;
        bool outcome;
        euint32 createdAt;
    }
}