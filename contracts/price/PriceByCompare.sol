// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceTiers.sol";

contract PriceByCompare is PriceTiers
{
    
    // @param - A: firts token
    // @param - B: second token 
    constructor(address A, address B, uint256 amountA, uint256 amountB)
    {
        _A = A;
        _B = B;
        _amountA = amountA;
        _amountB = amountB;
    }


    // returns current price of master token
    function price(address A, address B, uint256 amountA, uint256 amountB)
    public view override virtual returns(uint256)
    {
        require(A != B, "PriceByCompare: same address");


    }
}