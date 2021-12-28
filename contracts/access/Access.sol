// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../utils/Helpers.sol";
import "./IAccess.sol";

abstract contract Access is Context, AccessControlEnumerable, Pausable, IAccess
{
  using EnumerableSet for EnumerableSet.AddressSet;
  using Helpers for string;

  // users added to whitelist by operator
  mapping(address => EnumerableSet.AddressSet) private _addedByRef;


  // roles
  bytes32 public constant ADMIN = 'admin';
  bytes32 public constant OPERATOR = 'operator';
  bytes32 public constant WL_INVESTOR = 'wl_investor';

  
  function checkRole(string memory _role, address account) public override view returns (bool)
  {
    return super.hasRole(_role.toBytes32(), account);
  }


  // add role operator that only admin can add or remove
  function addOperator(address operator) public override onlyRole(ADMIN)
  {
    super._setupRole(OPERATOR, operator);
  }

  function removeOperator(address account) public override onlyRole(ADMIN)
  {
    // delete whitelisted users added by this operator
    for(uint256 i = 0; i < addedByOperator(account); ++i)
    {
      removeWLInvestor(_addedByRef[account].at(i));
    }

    super._revokeRole(OPERATOR, account);
  }


  function addedByOperator(address operator) public override view returns(uint256)
  {
    require(super.hasRole(OPERATOR, operator), "Sales: this user is not an operator");
    return _addedByRef[operator].length();
  }


  function getRoleCount(string memory role) public override view returns (uint256) 
  {
    return super.getRoleMemberCount(role.toBytes32());
  }



  // add whitelist investor
  function addWLInvestor(address account) public override
  {
    require(
      super.hasRole(OPERATOR, super._msgSender()) ||
      super.hasRole(ADMIN, super._msgSender()),
      "Sales: user has no access rights"
    );

    if(super.hasRole(OPERATOR,_msgSender()))
    {
      _addedByRef[_msgSender()].add(account);
    }

    super._grantRole(WL_INVESTOR, account);
  }


  function removeWLInvestor(address account) public override
  {
    require(
      super.hasRole(ADMIN, super._msgSender()) || 
      super.hasRole(OPERATOR, super._msgSender()),
      "Sales: user has no access rights"
    );

    if(super.hasRole(OPERATOR,_msgSender()))
    {
      _addedByRef[_msgSender()].remove(account);
    }

    super._revokeRole(WL_INVESTOR, account);
  }


  // only role admin can pause and upause master token
  function _pause() internal override onlyRole(ADMIN)
  {
    super._pause();
  }

  function _unpause() internal override onlyRole(ADMIN)
  {
    super._unpause();
  }
}