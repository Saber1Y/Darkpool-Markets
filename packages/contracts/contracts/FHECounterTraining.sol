// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE counter used to learn the basic fhEVM flow.
/// @notice This contract is intentionally minimal and maps directly to the official docs patterns.
contract FHECounterTraining is ZamaEthereumConfig {
    euint32 private _count;

    /// @notice Returns the encrypted counter handle.
    function getCount() external view returns (euint32) {
        return _count;
    }

    /// @notice Increments the encrypted counter with a user-provided encrypted value.
    /// @param inputValue External encrypted handle created client-side.
    /// @param inputProof ZK proof that validates the encrypted input.
    
    function increment(externalEuint32 inputValue, bytes calldata inputProof) external {
        euint32 value = FHE.fromExternal(inputValue, inputProof);
        _count = FHE.add(_count, value);

        // Keep the new ciphertext reusable by this contract in future txs.
        FHE.allowThis(_count);
        // Let caller decrypt this handle off-chain in tests/frontend.
        FHE.allow(_count, msg.sender);
    }

    /// @notice Decrements the encrypted counter with a user-provided encrypted value.
    function decrement(externalEuint32 inputValue, bytes calldata inputProof) external {
        euint32 value = FHE.fromExternal(inputValue, inputProof);
        _count = FHE.sub(_count, value);

        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }
}
