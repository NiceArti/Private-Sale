// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IAccess
{
  function checkRole(string memory _role, address account) external view returns (bool);
  function addOperator(address operator) external;
  function removeOperator(address account) external;
  function addedByOperator(address operator) external view returns(uint256);
  function getRoleCount(string memory role) external view returns (uint256);
  function addWLInvestor(address account) external;
  function removeWLInvestor(address account) external;
}