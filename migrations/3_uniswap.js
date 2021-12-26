const Uniswap = artifacts.require("Uniswap");
const Token = artifacts.require("Token");


module.exports = function (deployer) 
{
    deployer.deploy(Uniswap);

    // Tokens
    deployer.deploy(Token, "Ethereum", "ETH");

};