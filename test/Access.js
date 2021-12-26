const truffleAssert = require('truffle-assertions');
const Access = artifacts.require("Access");

contract("Access", function(accounts)
{
    const roles = 
    {
        ADMIN:"admin",
        OPERATOR:"operator",
        WL_INVESTOR:"wl_investor",
        NON_WL_INVESTOR:"not_wl_investor"
    }

    let access;
    before(async() => access = await Access.deployed())

    it("checkRole(): must return true to admin role to deployer", async () =>
    {
        let role = await access.checkRole(roles.ADMIN, accounts[0])
        assert.equal(role, true, `${role} != ${true}`)
    });

    it("checkRole(): must return false if asks role admin, operator...", async () =>
    {
        let role = await access.checkRole(roles.ADMIN, accounts[1])
        assert.equal(role, false, `${role} != ${false}`)
    });



    describe("test roles", async () =>
    {
        it("addOperator(): check if admin can add operator", async () => 
        {
            await access.addOperator(accounts[1])
            let role = await access.checkRole(roles.OPERATOR, accounts[1])
            assert.equal(role, true, `${role} != ${true}`)
        })

        it("addOperator(): check if only admin can add operator (from operator)", async () => 
        {
            await truffleAssert.reverts(access.addOperator(accounts[2], {from: accounts[1]}));
        })

        it("addOperator(): check if only admin can add operator (from default)", async () => 
        {
            await truffleAssert.reverts(access.addOperator(accounts[2], {from: accounts[5]}));
        })
        

        // add/remove whitelist investor
        it("addWlInvestor(): check if admin can add whitelist investor", async () => 
        {
            await access.addWLInvestor(accounts[2], {from: accounts[1]});
            let role = await access.checkRole(roles.WL_INVESTOR, accounts[2])
            assert.equal(role, true, `${role} != ${true}`)
        })

        it("removeWLInvestor(): check if admin can add whitelist investor", async () => 
        {
            await access.removeWLInvestor(accounts[2], {from: accounts[1]});
            let role = await access.checkRole(roles.WL_INVESTOR, accounts[2])
            assert.equal(role, false, `${role} != ${true}`)
        })

        it("addedByOperator(): check if whitelist added by operator works well", async () => 
        {
            //whole count is 6, but added by this operator just 3
            await access.addWLInvestor(accounts[5]);
            await access.addWLInvestor(accounts[6]);
            await access.addWLInvestor(accounts[7]);

            await access.addWLInvestor(accounts[2], {from: accounts[1]});
            await access.addWLInvestor(accounts[3], {from: accounts[1]});
            await access.addWLInvestor(accounts[4], {from: accounts[1]});

            let countOp = await access.addedByOperator(accounts[1])
            
            let wholeCount = await access.getRoleCount(roles.WL_INVESTOR);
            console.log(`\tWhole count is: ${wholeCount.toNumber()}`)
            console.log(`\tOperator count is: ${countOp.toNumber()}`)

            assert.equal(countOp, 3, `${countOp} != ${3}`)
        })

        it("removeOperator(): check if after removing operator all whitelist users also not in whitelist too", async () => 
        {
            let wholeCountBefore = await access.getRoleCount(roles.WL_INVESTOR);
            let rolesBefore = await access.addedByOperator(accounts[1])
            
            console.log(`\tWhole count before is: ${wholeCountBefore.toNumber()}`)
            console.log(`\tCount before is: ${rolesBefore.toNumber()}`)
            
            await access.removeOperator(accounts[1])

            let wholeCountAfter = await access.getRoleCount(roles.WL_INVESTOR)
            console.log(`\tWhole count after is: ${wholeCountAfter.toNumber()}`)

            
            assert.equal(wholeCountAfter, 3, `Before: ${wholeCountBefore}, After: ${wholeCountAfter}`)
        })
    })
})