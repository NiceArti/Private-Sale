// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../access/Access.sol";

contract AccessTest is Access
{
    constructor()
    {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }
}