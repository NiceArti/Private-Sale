// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../access/Access.sol";

abstract contract PriceTiers is Access
{
    address internal _A;
    address internal _B;

    uint256 internal _amountA;
    uint256 internal _amountB;
    uint256 internal _discount = 1;

    function price(address A, address B, uint256 amountA, uint256 amountB) external view virtual returns(uint256);
}