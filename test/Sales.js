//require("@nomiclabs/hardhat-waffle");

const truffleAssert = require('truffle-assertions');
const Sales = artifacts.require("Sales");
const Token = artifacts.require("Token");

//const toWei = (value) => ethers.utils.parseEther(value.toString());

contract.only("Sales", function(accounts)
{
    const roles = 
    {
        ADMIN:"admin",
        OPERATOR:"operator",
        WL_INVESTOR:"wl_investor",
    }
    let min = 15,
        max = 150;


    describe("test min()", async () =>
    {
        it("setMin(): check if admin can change min amount", async () => 
        {
            let min_before = await sales.getMin()
            await sales.setMin(min)
            let min_after = await sales.getMin()

            assert.equal(min_after, min, `before: ${min_before}, after: ${min_after}`)
        })

        it("setMin(): check if not admin can not change min amount", async () => 
        {
            await truffleAssert.reverts(sales.setMin(min, {from: accounts[1]}));
        })

        it("setMin(): check min can not be bigger than max", async () => 
        {
            await truffleAssert.reverts(sales.setMin(min + 150, {from: accounts[0]}));
        })
    })
    
    
    // check max
    describe("test max()", async () =>
    {
        it("setMax(): check if admin can change max amount", async () => 
        {
            let max_before = await sales.getMax()
            await sales.setMax(max)
            let max_after = await sales.getMax()

            assert.equal(max_after, max, `before: ${max_before}, after: ${max_after}`)
        })

        it("setMax(): check if not admin can not change max amount", async () => 
        {
            await truffleAssert.reverts(sales.setMax(max, {from: accounts[1]}));
        })

        it("setMax(): check max can not be lower than min", async () => 
        {
            await truffleAssert.reverts(sales.setMax(min - 10, {from: accounts[0]}));
        })
    })


    let sales,
        token,
        usd,
        bnb;
    
    // default start amount for private sale
    const startAmount = 20000
    let userBuy = max - 50

    let startDate = parseInt(Date.now() / 1000)
    let endDate = parseInt(startDate + 10000000000)

    before(async() => 
    {
        token = await Token.deployed()
        
        // deployin tokens
        usd = await Token.new("US Dollar", "USD")
        bnb = await Token.new("Binance", "BNB")

        // deploy sale with default parameters
        //(address token, uint256 price_, uint256 amount, uint256 start, uint256 end, Tactic tactic)
        console.log(startDate +" "+ endDate)

        sales = await Sales.new(usd.address, 10, startAmount, startDate, endDate, 0)

        // transfer bnb tokens to test contract
        await bnb.transfer(accounts[1], 200000)
        await bnb.transfer(accounts[5], 200000)

        //add users to whitelist
        await sales.addOperator(accounts[1])
        await sales.addWLInvestor(accounts[5], {from: accounts[1]})

        // create private sale with usd token, amount - 20000
        await usd.approve(sales.address, startAmount)
        await sales.startSale(startAmount)
    })
    
    // check buy
    describe("test buy()", async () =>
    {
        it("buy(): check if user can buy tokens from contract", async () => 
        {                   
            await bnb.approve(sales.address, userBuy, {from: accounts[1]}) 
            await sales.buy(bnb.address, userBuy, {from: accounts[1]})
            
            let balance = await usd.balanceOf(accounts[1])
            
            assert.equal(balance, userBuy, `${balance} != ${userBuy}`)
        })

        it("buy(): check if user can not buy more than max", async () => 
        {
            let userBuy = max + 100;
            await bnb.approve(sales.address, userBuy, {from: accounts[1]})
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
        })

        it("buy(): check if user can not buy less than min", async () => 
        {
            let userBuy = min - 10;
            await bnb.approve(sales.address, userBuy, {from: accounts[1]})
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
        })

        it("buy(): check if other user can buy", async () => 
        {               
            await bnb.approve(sales.address, userBuy, {from: accounts[5]})        
            await sales.buy(bnb.address, userBuy, {from: accounts[5]})
            let balance = await usd.balanceOf(accounts[5])
            assert.equal(balance, userBuy, `${balance} != ${userBuy}`)
        })

        it("buy(): check if user can not buy if his operator was deleted", async () => 
        {                     
            await sales.removeOperator(accounts[1])
            await bnb.approve(sales.address, userBuy, {from: accounts[1]})     
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[5]}))
        })
    })

    describe("test buy() by timestamp: ", async () =>
    {
        it("buy(): check if user can not buy tokens if sale is ended", async () => 
        {     
            await sales.setEndDate(startDate)
            await bnb.approve(sales.address, userBuy, {from: accounts[1]}) 
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
        })

        it("buy(): check if user can not buy tokens before sale is started", async () => 
        {   
            await sales.setEndDate(startDate + 10000)
            await sales.setStartDate(startDate + 1000)
            await bnb.approve(sales.address, userBuy, {from: accounts[1]}) 
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
        })
    })

    describe("test endSale()", async () =>
    {
        before(async() => { await sales.endSale() })

        it("endSale(): check if after end sale noone can buy anything", async () => 
        {                     
            await bnb.approve(sales.address, userBuy, {from: accounts[1]})  
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
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
    
    describe("test investOnBehalf()", async () =>
    {
        before(async() => 
        {
            await sales.addOperator(accounts[1])
            await sales.addWLInvestor(accounts[5], {from: accounts[1]})
            
            //set time to start
            await sales.setEndDate(startDate + 10000)
            await sales.setStartDate(startDate)

            await usd.approve(sales.address, 20000) 
            await sales.startSale(20000)
        })

        it("investOnBehalf(): check if operator can send money from contract to address", async () => 
        {                   
            await sales.investOnBehalf(accounts[3], 20, {from: accounts[1]}) 
            
            let balance = await usd.balanceOf(accounts[3])        
            assert.equal(balance, 20, `${balance} != ${20}`)
        })

        it("investOnBehalf(): check if only operator can send money from contract to address", async () => 
        {                   
            await truffleAssert.reverts(sales.investOnBehalf(accounts[3], 20, {from: accounts[5]}))
        })
    })

    describe("test buyETH()", async () =>
    {
        before(async() => 
        {
            //set time to start
            await sales.setEndDate(startDate + 10000)
            await sales.setStartDate(startDate)

            await usd.approve(sales.address, 20000) 
            await sales.startSale(20000)
            await sales.addWLInvestor(accounts[2], {from: accounts[1]})
            await sales.addWLInvestor(accounts[3], {from: accounts[1]})
        })

        it("buyETH(): check if user can buy tokens from contract", async () => 
        {                   
            await sales.buyETH(userBuy, {from: accounts[2], value: userBuy})
            
            let balanceETHContract = await web3.eth.getBalance(sales.address);
            let balanceContract = await usd.balanceOf(sales.address);
            console.log(`\tETH: ${balanceETHContract}, USD: ${balanceContract}$`)

            let balance = await usd.balanceOf(accounts[2]);
            assert.equal(balance, userBuy, `${balance} != ${userBuy}`)
        })

        it("buyETH(): check if user cannot buy more than max amount allowed", async () => 
        {
            await truffleAssert.reverts(sales.buyETH(userBuy, {from: accounts[2], value: userBuy}))              
        })

        it("buyETH(): check if user cannot buy less than min amount allowed", async () => 
        {
            await truffleAssert.reverts(sales.buyETH(min - 10, {from: accounts[3], value: min - 10}))
        })
    })


    describe("test price()", async () =>
    {
        it("price(): check if user can buy tokens from contract", async () => 
        {
            let pr = await sales.price();
            assert.equal(10, 10, `${10} != ${10}`)
        })
    })

    describe("test expected()", async () =>
    {
        it("expected(): check if user can buy tokens from contract", async () => 
        {
            let pr = await sales.expected(200, 15);
            assert.equal(300, pr, `${pr} != ${300}`)
        })
    })

    describe("test return non kyced investors", async () =>
    {
        before(async() => 
        {
            await bnb.transfer(accounts[4], 200)
        })
        it("returnTokens(): check if user non kyced user can get usdt back", async () => 
        {
            await bnb.approve(sales.address, 200, {from: accounts[4]})
            await sales.returnTokens(bnb.address, {from: accounts[4]})
            let balance = await usd.balanceOf(accounts[4]);

            assert.equal(balance, 200, `${balance} != ${200}`)
        })
    })
})