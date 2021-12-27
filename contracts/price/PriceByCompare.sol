// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceTiers.sol";

contract PriceByCompare is PriceTiers
{
    // @param - A: firts token
    // @param - B: second token
    uint256 private _lastPrice;
    uint256 private _currentPrice;

    constructor(address A, uint256 amountA)
    {
        _A = A;
        _amountA = amountA;
        _currentPrice = amountA;
    }


    // returns current price of master token
    function price(address A, uint256 amountA)
    public override virtual returns(uint256)
    {
        require(A != address(0), "PriceByCompare: zero address");

        _discount = _MT.balanceOf(_msgSender());

        _lastPrice = _currentPrice;
        _currentPrice = amountA * _discount * (amountA - _lastPrice);

        return _currentPrice;
    }

    function getLastPrice() public view returns(uint256)
    {
        return _lastPrice;
    }

    function getCurrentPrice() public view returns(uint256)
    {
        return _currentPrice;
    }
}