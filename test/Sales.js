const truffleAssert = require('truffle-assertions');
const Sales = artifacts.require("Sales");

contract("Sales", function(accounts)
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


    describe("test roles", async () =>
    {
        it("addOperator(): check if admin can add operator", async () => 
        {
            await sales.addOperator(accounts[1])
            let role = await sales.checkRole(roles.OPERATOR, accounts[1])
            assert.equal(role, true, `${role} != ${true}`)
        })

        it("addOperator(): check if only admin can add operator (from operator)", async () => 
        {
            await truffleAssert.reverts(sales.addOperator(accounts[2], {from: accounts[1]}));
        })

        it("addOperator(): check if only admin can add operator (from default)", async () => 
        {
            await truffleAssert.reverts(sales.addOperator(accounts[2], {from: accounts[5]}));
        })
        

        // add/remove whitelist investor
        it("addWlInvestor(): check if admin can add whitelist investor", async () => 
        {
            await sales.addWLInvestor(accounts[2], {from: accounts[1]});
            let role = await sales.checkRole(roles.WL_INVESTOR, accounts[2])
            assert.equal(role, true, `${role} != ${true}`)
        })

        it("removeWLInvestor(): check if admin can add whitelist investor", async () => 
        {
            await sales.removeWLInvestor(accounts[2], {from: accounts[1]});
            let role = await sales.checkRole(roles.WL_INVESTOR, accounts[2])
            assert.equal(role, false, `${role} != ${true}`)
        })

        it("addedByOperator(): check if whitelist added by operator works well", async () => 
        {
            //whole count is 6, but added by this operator just 3
            await sales.addWLInvestor(accounts[5]);
            await sales.addWLInvestor(accounts[6]);
            await sales.addWLInvestor(accounts[7]);

            await sales.addWLInvestor(accounts[2], {from: accounts[1]});
            await sales.addWLInvestor(accounts[3], {from: accounts[1]});
            await sales.addWLInvestor(accounts[4], {from: accounts[1]});

            let countOp = await sales.addedByOperator(accounts[1])
            
            let wholeCount = await sales.getRoleCount(roles.WL_INVESTOR);
            console.log(`\tWhole count is: ${wholeCount.toNumber()}`)
            console.log(`\tOperator count is: ${countOp.toNumber()}`)

            assert.equal(countOp, 3, `${countOp} != ${3}`)
        })

        it("removeOperator(): check if after removing operator all whitelist users also not in whitelist too", async () => 
        {
            let wholeCountBefore = await sales.getRoleCount(roles.WL_INVESTOR);
            let rolesBefore = await sales.addedByOperator(accounts[1])
            
            console.log(`\tWhole count before is: ${wholeCountBefore.toNumber()}`)
            console.log(`\tCount before is: ${rolesBefore.toNumber()}`)
            
            await sales.removeOperator(accounts[1])

            let wholeCountAfter = await sales.getRoleCount(roles.WL_INVESTOR)
            console.log(`\tWhole count after is: ${wholeCountAfter.toNumber()}`)

            
            assert.equal(wholeCountAfter, 3, `Before: ${wholeCountBefore}, After: ${wholeCountAfter}`)
        })
    })
})