const truffleAssert = require('truffle-assertions');
const PriceByCompare = artifacts.require("PriceByCompare");

contract("PriceByCompare", function(accounts)
{
    let price;
    before(async() => price = await PriceByCompare.deployed())

    it("getCurrentPrice(): should return current price", async () => 
    {
        let current = await price.getCurrentPrice()
        a
    })
})