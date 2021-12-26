// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./UQ112x112.sol";

contract Uniswap
{
    using UQ112x112 for uint224;

    address public factory;

    mapping(address => mapping(address => address)) public getPair;
    mapping(address => mapping(address => uint224)) public getReserves;
    
    constructor() 
    {
        factory = msg.sender;
    }

    function addLiquidity(address A, address B, uint224 am1, uint224 am2) public returns(address)
    {
        require(A != address(0) || B != address(0), "Uniswap: ZERO_ADDRESS");

        address pair = address(uint160(uint256(keccak256(abi.encodePacked(A, B)))));

        getPair[A][B] = pair;
        getPair[B][A] = pair;

        getReserves[A][B] = am1;
        getReserves[B][A] = am2;

        return pair;
    }

    function getReserve(address A, address B) public view returns(uint224)
    {
        require(getPair[A][B] != address(0), "Uniswap: ZERO_ADDRESS");
        return getReserves[A][B];
    }

    function getPrice(address A, address B) public view returns(uint224)
    {
        require(getPair[A][B] != address(0), "Uniswap: ZERO_ADDRESS");
        return getReserves[A][B] / getReserves[B][A];
    }
}