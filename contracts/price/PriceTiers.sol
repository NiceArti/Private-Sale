// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../access/Access.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract PriceTiers is Access
{
    address internal _A;
    IERC20 _MT;
    uint256 internal _amountA;
    uint256 internal _discount;

    function price(address A, uint256 amountA) external virtual returns(uint256);
}