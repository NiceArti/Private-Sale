// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ISales.sol";

contract Sales is ISales
{
  uint8 private MIN_AMOUNT = 10;
  uint256 private MAX_AMOUNT = 100;

  enum Role{ADMIN, OPERATOR, WL_INVESTOR, NON_WL_INVESTOR}

  Role chose_role = Role.NON_WL_INVESTOR;

  mapping(address => Role) public role;

  constructor()
  {
    role[msg.sender] = Role.NON_WL_INVESTOR;
  }

  function hasRole() external override view returns(string memory)
  {
    if(role[msg.sender] == Role.ADMIN) return 'admin';
    else if(role[msg.sender] == Role.OPERATOR) return 'operator';
    else if(role[msg.sender] == Role.WL_INVESTOR) return 'wl_investor';

    return 'not_wl_investor';
  }


  function min(uint8 new_min) onlyAdmin external
  {
    require(new_min <= MAX_AMOUNT, "Sales: MIN_AMOUNT is too high");
    MIN_AMOUNT = new_min;
  }

  function max(uint8 new_max) onlyAdmin external
  {
    require(new_max >= MIN_AMOUNT, "Sales: MAX_AMOUNT is too low");
    MAX_AMOUNT = new_max;
  }


  modifier onlyAdmin()
  {
    require(msg.sender != address(0), "Sales: current address is not an admin");
    _;
  }
}