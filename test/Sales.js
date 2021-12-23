const truffleAssert = require('truffle-assertions');
const Sales = artifacts.require("Sales");

contract("Ixswap Nft", function(accounts)
{
    let sales;
    before(async() => sales = await Sales.deployed())

    it("hasRole(): must return role", async () =>
    {
        let role = await sales.hasRole()
        assert.equal(role, "not_wl_investor")
    });
})