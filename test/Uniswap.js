const truffleAssert = require('truffle-assertions');
const Uniswap = artifacts.require("Uniswap");
const Token = artifacts.require("Token");

contract("Uniswap emullator", async accounts =>
{
    let uniswap;
    let usdt;
    let masterToken;

    // decode encoded values of uniswap
    // it's needed to return number with 
    // fixed point value
    let decode = num =>
    {
        return num / 2**112;
    }


    // adds accurency to number givven by user
    let accurancy = (num, ac, fixed = 2) =>
    {
        return num.toFixed(fixed) * 10**ac;
    }

    before(async() => 
    {
        // deployin tokens
        usdt = await Token.new("Tether USD", "USDT")
        masterToken = await Token.new("Master Token", "MT")
           
        uniswap = await Uniswap.new(usdt.address, masterToken.address)

        await uniswap.addLiquidity(accurancy(100.245, 2), accurancy(25, 2))
    })
    

    it("Master token price in usdt", async () => 
    {   
        let encodedPrice = await uniswap.getPriceA()
        let decodedPrice = decode(encodedPrice).toFixed(2)
        assert.equal(decodedPrice, 4.01, `${decodedPrice} != ${4.01}`)
    })

    it("USDT price in master token", async () => 
    {   
        let encodedPrice = await uniswap.getPriceB()
        let decodedPrice = decode(encodedPrice).toFixed(2)
        assert.equal(decodedPrice, 0.25, `${decodedPrice} != ${0.25}`)
    })
})