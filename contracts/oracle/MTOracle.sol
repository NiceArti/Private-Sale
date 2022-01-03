// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../tests/IUniswap.sol";

/**
    This Oracle is needed to get current info of Master Token
    e.g: current price, current total supply, etc.
*/
contract MTOracle
{
    address private _masterToken;

    constructor(address masterToken)
    {
        _masterToken = masterToken;
    }

    function getPrice() public view returns(uint256)
    {
        return IUniswap(_masterToken).getPriceA();
    }
}