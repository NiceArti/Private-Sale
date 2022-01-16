// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "../Sales.sol";
import "../utils/UQ112x112.sol";
import "prb-math/contracts/PRBMathSD59x18Typed.sol";

contract SalesTest is Sales
{
    using UQ112x112 for uint224;
    using PRBMathSD59x18Typed for int256;

    constructor(address token, uint256 price_, uint256 amount, uint256 min, uint256 max, uint256 start, uint256 end, address oracle, uint112 mtAmount) 
    Sales(token, price_, amount, min, max, start, end, oracle, mtAmount){}

    function percentage(uint112 amount) public view returns (uint)
    {
        return uint(UQ112x112.encode(1).uqdiv(uint112(discount(amount)))) / amount;
    }

    function percentage2(uint112 amount) public view returns (uint)
    {
        uint256 balance = IERC20(_oracle.masterTokenAddress()).balanceOf(address(this));
        return discount(amount) * balance;
    }

    function percentage3(uint amount) public view returns (uint)
    {
        uint256 balance = IERC20(_oracle.masterTokenAddress()).balanceOf(address(this));
        //return  * balance;
    }


    function discount(uint112 mtAmount) public view returns(uint)
    {
        /// discount calculates by formula:
        /// d = 1 - (a * 100% / b)
        /// returns percentage of the price
        /// e.g. returns if user has 0 master tokens
        /// he/she must pay 100% of price
        /// if he/she has 25% of tokens, he/she will pay just 75% of price etc.
        uint256 balance = IERC20(_oracle.masterTokenAddress()).balanceOf(address(this));
        uint percent = uint(UQ112x112.encode(mtAmount).uqdiv(uint112(balance)));

        return percent;
    }

    


    // helpers
    function setEndDate(uint256 end) public
    {
        _end = end;
    }

    function setStartDate(uint256 start) public
    {
        _start = start;
    }

    function getEndDate() public view returns(uint256)
    {
        return _end;
    }

    function getStartDate() public view returns(uint256)
    {
        return _start;
    }
}