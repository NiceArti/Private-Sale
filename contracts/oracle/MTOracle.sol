// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../tests/IUniswap.sol";
import "./interface/IMTOracle.sol";

/**
    This Oracle is needed to get current info of Master Token
    e.g: current price, current total supply, etc.
*/
contract MTOracle is IMTOracle
{
    address private _masterToken;

    constructor(address masterToken)
    {
        _masterToken = masterToken;
    }


    // current ETH price getted from the outside
    // now it's hardcoded
    function getETHPrice() public override view returns(uint256)
    {
        return 4000;
    }


    // current price of MasterToken
    // now it's hardcoded
    function getMTPrice() public override view returns(uint256)
    {
        return 10;
    }

    // address of masterToken
    // now it's hardcoded
    function masterTokenAddress() public override view returns(address)
    {
        return _masterToken;
    }
}