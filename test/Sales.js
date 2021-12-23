const truffleAssert = require('truffle-assertions');
const Sales = artifacts.require("Sales");

contract("Ixswap Nft", function(accounts)
{
    const roles = 
    {
        ADMIN:"admin",
        OPERATOR:"operator",
        WL_INVESTOR:"wl_investor",
        NON_WL_INVESTOR:"not_wl_investor"
    }

    let sales;
    before(async() => sales = await Sales.deployed())

    it("hasRole(): must return role", async () =>
    {
        let role = await sales.hasRole()
        assert.equal(role, roles.ADMIN, `${role} != ${roles.ADMIN}`)
    });

    it("hasRole(): must return role", async () =>
    {
        let role = await sales.hasRole({from: accounts[1]})
        assert.equal(role, roles.NON_WL_INVESTOR, `${role} != ${roles.NON_WL_INVESTOR}`)
    });
})