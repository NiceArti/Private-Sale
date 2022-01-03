// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../utils/UQ112x112.sol";
import "./IUniswap.sol";

contract Uniswap is IUniswap
{
    using UQ112x112 for uint224;

    uint112 private _reserveA;
    uint112 private _reserveB;

    address private _tokenA;
    address private _tokenB;

    address public factory;
    
    constructor(address A, address B)
    {
        factory = msg.sender;
        _tokenA = A;
        _tokenB = B;
    }

    function addLiquidity(uint112 am1, uint112 am2) public override
    {
        _reserveA = am1;
        _reserveB = am2;
    }
    
    function getPriceB() public override view returns(uint)
    {
        return uint(UQ112x112.encode(_reserveB).uqdiv(_reserveA));
    }

    function getPriceA() public override view returns(uint)
    {
        return uint(UQ112x112.encode(_reserveA).uqdiv(_reserveB));
    }
}