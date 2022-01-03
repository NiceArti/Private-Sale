// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniswap
{
    function addLiquidity(uint112 am1, uint112 am2) external;
    function getPriceA() external view returns(uint);
    function getPriceB() external view returns(uint);
}