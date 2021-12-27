// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISales
{
    event RoleAdded(address indexed from, address indexed to, bytes32);
    event RoleRemoved(address indexed from, address indexed to, bytes32);
}