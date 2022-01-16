// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMTOracle
{
    function getETHPrice() external view returns(uint256);
    function getMTPrice() external view returns(uint256);
    function masterTokenAddress() external view returns(address);
}