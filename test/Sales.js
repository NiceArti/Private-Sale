const truffleAssert = require('truffle-assertions');
const Sales = artifacts.require("Sales");
const Token = artifacts.require("Token");


contract.only("Sales", function(accounts)
{
    const roles = 
    {
        ADMIN:"admin",
        OPERATOR:"operator",
        WL_INVESTOR:"wl_investor",
    }

    let sales;
    let usd;
    let bnb;

    before(async() => 
    {
        token = await Token.deployed()
        
        //deployin tokens
        usd = await Token.new("US Dollar", "USD")
        bnb = await Token.new("Binance", "BNB")
        sales = await Sales.new(usd.address, 20000)

        await bnb.transfer(accounts[1], 200000)
        await bnb.transfer(accounts[5], 200000)

        //add users to whitelist
        await sales.addOperator(accounts[1])
        await sales.addWLInvestor(accounts[5], {from: accounts[1]})
    })

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

    // check max
    describe("test buy()", async () =>
    {
        it("buy(): check if user can buy tokens from contract", async () => 
        {                   
            await usd.approve(sales.address, 20000) 
            await sales.startSale(20000)
            
            
            await bnb.approve(sales.address, 200, {from: accounts[1]}) 
            await sales.buy(bnb.address, 20, {from: accounts[1]})
            
            let balance = await usd.balanceOf(accounts[1])
            
            assert.equal(balance, 20, `${balance} != ${20}`)
        })

        it("buy(): check if user can not buy more than max", async () => 
        {
            await bnb.approve(sales.address, 181, {from: accounts[1]})
            await truffleAssert.reverts(sales.buy(bnb.address, 181, {from: accounts[1]}))
        })

        it("buy(): check if other user can buy", async () => 
        {               
            await bnb.approve(sales.address, 181, {from: accounts[5]})        
            await sales.buy(bnb.address, 20, {from: accounts[5]})
            let balance = await usd.balanceOf(accounts[5])
            assert.equal(balance, 20, `${balance} != ${20}`)
        })

        it("buy(): check if user can not buy if his operator was deleted", async () => 
        {                     
            await sales.removeOperator(accounts[1])
            await bnb.approve(sales.address, 181, {from: accounts[1]})     
            await truffleAssert.reverts(sales.buy(bnb.address, 20, {from: accounts[5]}))
        })

        it("endSale(): check if after end sale noone can buy anything", async () => 
        {                     
            await sales.endSale()
            await bnb.approve(sales.address, 200, {from: accounts[1]})  
            await truffleAssert.reverts(sales.buy(bnb.address, 200, {from: accounts[1]}))
        })

        it("endSale(): check if sale can be ended once", async () => 
        {                     
            await truffleAssert.reverts(sales.endSale(), "Sales: sale is ended")
        })

        it("endSale(): check if only admin can terminate sale", async () => 
        {                     
            await truffleAssert.reverts(sales.endSale({from: accounts[1]}))
        })


    })
})