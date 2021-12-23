// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISales
{
    // return uint8 because role will be counted by enum
    // 0 - admin
    // 1 - operator
    // ...
    function hasRole(address account) external view returns(string memory);
}