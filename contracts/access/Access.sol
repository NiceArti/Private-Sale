// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract Access is Context, AccessControlEnumerable, Pausable
{
  using EnumerableSet for EnumerableSet.AddressSet;

  // users added to whitelist by operator
  mapping(address => EnumerableSet.AddressSet) private _addedByRef;


  // roles
  bytes32 public constant OPERATOR = keccak256('operator');
  bytes32 public constant WL_INVESTOR = keccak256('wl_investor');


  // add role operator that only admin can add or remove
  function addOperator(address operator) public onlyRole(DEFAULT_ADMIN_ROLE)
  {
    super._setupRole(OPERATOR, operator);
  }

  function removeOperator(address account) public onlyRole(DEFAULT_ADMIN_ROLE)
  {
    // delete whitelisted users added by this operator
    for(uint256 i = 0; i < addedByOperator(account); ++i)
    {
      removeWLInvestor(_addedByRef[account].at(i));
    }

    super._revokeRole(OPERATOR, account);
  }


  function addedByOperator(address operator) public view returns(uint256)
  {
    require(super.hasRole(OPERATOR, operator), "Sales: this user is not an operator");
    return _addedByRef[operator].length();
  }


  // add whitelist investor
  function addWLInvestor(address account) public
  {
    require(
      super.hasRole(OPERATOR, super._msgSender()) ||
      super.hasRole(DEFAULT_ADMIN_ROLE, super._msgSender()),
      "Sales: user has no access rights"
    );

    if(super.hasRole(OPERATOR,_msgSender()))
    {
      _addedByRef[_msgSender()].add(account);
    }

    super._grantRole(WL_INVESTOR, account);
  }


  function removeWLInvestor(address account) public
  {
    require(
      super.hasRole(DEFAULT_ADMIN_ROLE, super._msgSender()) || 
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
  function _pause() internal override onlyRole(DEFAULT_ADMIN_ROLE)
  {
    super._pause();
  }

  function _unpause() internal override onlyRole(DEFAULT_ADMIN_ROLE)
  {
    super._unpause();
  }
}