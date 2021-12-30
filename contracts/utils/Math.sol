// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


library Math
{
    // helper function
    function mul(uint256 a, uint256 b)
    internal pure returns (uint256 result) 
    {
        assembly 
        {
            result := mload(mul(a, b))
        }
    }
}