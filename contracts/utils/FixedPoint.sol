// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library FixedPoint 
{
    // accurancy untill 1000
    function encode(uint y) internal pure returns (uint z) {
        z = uint(y) * 1000; // never overflows
    }
}