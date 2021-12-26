const truffleAssert = require('truffle-assertions');
const Uniswap = artifacts.require("Uniswap");
const Token = artifacts.require("Token");

contract.only("Uniswap", function(accounts)
{

    let uniswap;
    let eth;
    let idia;
    let usd;

    let ethPriceUSD = 0;

    before(async() => 
    {
        uniswap = await Uniswap.deployed();
        token = await Token.deployed();

        //deployin tokens
        usd = await Token.new("US Dollar", "USD"),
        eth = await Token.new("Ether", "ETH"),
        idia = await Token.new("Idia", "IDIA"),

        lpRemoved = false;
        
    });

    it("balanceOf(): check if balance is not null", async () => 
    {
        let usdBalance = await usd.balanceOf(accounts[0])
        let ethBalance = await eth.balanceOf(accounts[0])
        assert.equal(usdBalance, 1000000, `${usdBalance} != ${ethBalance}`)
    })

    it("ethPriceUSD: check if eth price in usd is correct", async () => 
    {
        await uniswap.addLiquidity(eth.address, usd.address, 25, 100000)  
        ethPriceUSD = await uniswap.getPrice(usd.address, eth.address);
        assert.equal(ethPriceUSD, 4000, `${ethPriceUSD} != ${4000}`)
    })
})