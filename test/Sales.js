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

    it("checkRole(): must return true to admin role to deployer", async () =>
    {
        let role = await sales.checkRole(roles.ADMIN, accounts[0])
        assert.equal(role, true, `${role} != ${true}`)
    });

    it("checkRole(): must return false if asks role admin, operator...", async () =>
    {
        let role = await sales.checkRole(roles.ADMIN, accounts[1])
        assert.equal(role, false, `${role} != ${false}`)
    });

    describe("test min()", async () =>
    {
        it("setMin(): check if admin can change min amount", async () => 
        {
            let min_before = await sales.getMin()
            await sales.setMin(15)
            let min_after = await sales.getMin()

            assert.equal(min_after, 15, `before: ${min_before}, after: ${min_after}`)
        })

        it("setMin(): check if not admin can not change min amount", async () => 
        {
            await truffleAssert.reverts(sales.setMin(15, {from: accounts[1]}));
        })

        it("setMin(): check min can not be bigger than max", async () => 
        {
            await truffleAssert.reverts(sales.setMin(150, {from: accounts[0]}));
        })
    })
    
    
    // check max
    describe("test max()", async () =>
    {
        it("setMax(): check if admin can change max amount", async () => 
        {
            let max_before = await sales.getMax()
            await sales.setMax(150)
            let max_after = await sales.getMax()

            assert.equal(max_after, 150, `before: ${max_before}, after: ${max_after}`)
        })

        it("setMax(): check if not admin can not change max amount", async () => 
        {
            await truffleAssert.reverts(sales.setMax(150, {from: accounts[1]}));
        })

        it("setMax(): check max can not be lower than min", async () => 
        {
            await truffleAssert.reverts(sales.setMax(5, {from: accounts[0]}));
        })
    })
})