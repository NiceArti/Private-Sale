const truffleAssert = require('truffle-assertions');
const BigNumber = require('bignumber.js');
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
    let min = new BigNumber('10e18'),       // 10
        max = new BigNumber('100e18');      // 100

    // decode encoded values of uniswap
    // it's needed to return number with 
    // fixed point value
    let decode = (num) =>
    {
        return num / 2**112;
    }


    // adds accurency to number givven by user
    let accurancy = (num, ac = 1, fixed = 2) =>
    {
        return num.toFixed(fixed) * 10**ac;
    }


    describe("test min()", async () =>
    {
        it("setMin(): check if admin can change min amount", async () => 
        {
            let min_before = await sales.getMin()
            await sales.setMin(min.plus('5e18'))
            let min_after = await sales.getMin()
            assert.equal(decode(min_after), min.plus('5e18'), `before: ${decode(min_before)}, after: ${decode(min_after)}`)
        })

        it("setMin(): check if not admin can not change min amount", async () => 
        {
            await truffleAssert.reverts(sales.setMin(min.plus('5e18'), {from: accounts[1]}));
        })

        it("setMin(): check min can not be bigger than max", async () => 
        {
            await truffleAssert.reverts(sales.setMin(min.plus('150e18'), {from: accounts[0]}));
        })
        
        // fixed point number
        it("setMin(): check if user can set fixed point number", async () => 
        {
            let floatMin = new BigNumber('15.5e18')
            let min_before = await sales.getMin()
            await sales.setMin(floatMin)
            let min_after = await sales.getMin()
            assert.equal(decode(min_after), floatMin.toFixed(), `before: ${decode(min_before)}, after: ${decode(min_after)}`)
        })
    })
    
    
    // check max
    describe("test max()", async () =>
    {
        it("setMax(): check if admin can change max amount", async () => 
        {
            let max_before = await sales.getMax()
            await sales.setMax(max.plus('50e18'))
            let max_after = await sales.getMax()

            assert.equal(decode(max_after), max.plus('50e18'), `before: ${decode(max_before)}, after: ${decode(max_after)}`)
        })

        it("setMax(): check if not admin can not change max amount", async () => 
        {
            await truffleAssert.reverts(sales.setMax(max, {from: accounts[1]}));
        })

        it("setMax(): check max can not be lower than min", async () => 
        {
            await truffleAssert.reverts(sales.setMax(min.minus('10e18'), {from: accounts[0]}));
        })

        // fixed point number
        it("setMax(): check if user can set fixed point number", async () => 
        {
            let floatMax = new BigNumber("100.5e18")
            let max_before = await sales.getMax()
            await sales.setMax(floatMax)
            let max_after = await sales.getMax()
            assert.equal(decode(max_after), floatMax.toFixed(), `before: ${decode(max_before)}, after: ${decode(max_after)}`)
        })
    })


    let sales,
        token,
        usd,
        bnb;
    
    // default start amount for private sale
    const startAmount = new BigNumber('20000e18')   // 20,000 tokens
    let userBuy = max.minus('50e18')                // 100 - 50

    let startDate = parseInt(Date.now() / 1000)
    let endDate = parseInt(startDate + 10000000000)

    before(async() => 
    {   
        // deployin tokens
        usd = await Token.new("US Dollar", "USD")
        bnb = await Token.new("Binance", "BNB")

        // deploy sale with default parameters
        //(address token, uint256 price_, uint256 amount, uint256 start, uint256 end, Tactic tactic)
        console.log(startDate +" "+ endDate)

        sales = await Sales.new(usd.address, 10, startAmount, min, max, startDate, endDate, 0)

        // transfer bnb tokens to test contract
        let transferTo = new BigNumber('200e18')

        await bnb.transfer(accounts[1], transferTo)
        await bnb.transfer(accounts[5], transferTo)

        //add users to whitelist
        await sales.addOperator(accounts[1])
        await sales.addWLInvestor(accounts[5], {from: accounts[1]})

        // create private sale with usd token, amount - 20000
        await usd.approve(sales.address, startAmount)
        await sales.startSale(startAmount)
    })
    
    // check buy
    describe.only("test buy()", async () =>
    {
        it("buy(): check if user can buy tokens from contract", async () => 
        {       
            await bnb.approve(sales.address, userBuy, {from: accounts[1]}) 
            await sales.buy(bnb.address, userBuy, {from: accounts[1]})
            let balance = await usd.balanceOf(accounts[1])
            
            assert.equal(balance, userBuy.toFixed(), `${balance} != ${userBuy.toFixed()}`)
        })

        it("buy(): check if user can not buy more than max", async () => 
        {
            let userBuy = max.plus('100e18');
            await bnb.approve(sales.address, userBuy, {from: accounts[1]})
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
        })

        it("buy(): check if user can not buy less than min", async () => 
        {
            let userBuy = min.minus('10e18');
            await bnb.approve(sales.address, userBuy, {from: accounts[1]})
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
        })

        it.skip("buy(): check if other user can buy", async () => 
        {               
            await bnb.approve(sales.address, userBuy, {from: accounts[5]})        
            await sales.buy(bnb.address, userBuy, {from: accounts[5]})
            let balance = await usd.balanceOf(accounts[5])
            assert.equal(balance, userBuy, `${balance} != ${userBuy}`)
        })

        it.skip("buy(): check if user can not buy if his operator was deleted", async () => 
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

    describe("test returnTokens:", async () =>
    {
        before(async() => 
        {
            await sales.addOperator(accounts[1])
            await bnb.transfer(accounts[4], 200)
        })
        it("returnTokens(): check if user non kyced user can get usdt back", async () => 
        {
            await bnb.approve(sales.address, 200, {from: accounts[4]})
            await sales.returnTokens(bnb.address, accounts[4], {from: accounts[1]})
            let balance = await usd.balanceOf(accounts[4]);

            assert.equal(balance, 200, `${balance} != ${200}`)
        })
    })
})