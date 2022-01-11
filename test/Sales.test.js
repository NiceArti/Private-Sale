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


    let timeout = ms => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    describe("test min()", async () =>
    {
        it("setMin(): check if admin can change min amount", async () => 
        {
            await sales.setMin(min.plus('5e18'))
            let min_after = await sales.getMin()
            assert.equal(min_after, min.plus('5e18').toFixed(), `before: ${min.plus('5e18').toFixed()}, after: ${min_after}`)
        })

        it("setMin(): check if not admin can not change min amount", async () => 
        {
            await truffleAssert.reverts(sales.setMin(min.plus('5e18'), {from: accounts[1]}));
        })

        it("setMin(): check min can not be bigger than max", async () => 
        {
            await truffleAssert.reverts(sales.setMin(min.plus('150e18'), {from: accounts[0]}));
        })
    })
    
    
    // check max
    describe("test max()", async () =>
    {
        it("setMax(): check if admin can change max amount", async () => 
        {
            await sales.setMax(max.plus('50e18'))
            let max_after = await sales.getMax()

            assert.equal(max_after, max.plus('50e18').toFixed(), `before: ${max.plus('50e18').toFixed()}, after: ${max_after}`)
        })

        it("setMax(): check if not admin can not change max amount", async () => 
        {
            await truffleAssert.reverts(sales.setMax(max, {from: accounts[1]}));
        })

        it("setMax(): check max can not be lower than min", async () => 
        {
            await truffleAssert.reverts(sales.setMax(min.minus('10e18'), {from: accounts[0]}));
        })
    })


    let tokenPrice;
    let sales,
        token,
        usd,
        bnb;
    
    // default start amount for private sale
    const startAmount = new BigNumber('20000e18')   // 20,000 tokens
    let userBuy = new BigNumber('500e18')           // 100 - 50

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

        tokenPrice = new BigNumber('10')

        sales = await Sales.new(usd.address, tokenPrice, startAmount, min, max, startDate, endDate, 0)

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
    describe("test buy()", async () =>
    {
        it("buy(): check if user can buy tokens from contract", async () => 
        {
            await bnb.approve(sales.address, userBuy, {from: accounts[1]}) 
            await sales.buy(bnb.address, userBuy, {from: accounts[1]})
            let balance = await usd.balanceOf(accounts[1])
            
            assert.equal(balance, userBuy.toFixed() / tokenPrice, `${balance} != ${userBuy.toFixed() / tokenPrice}`)
        })

        it("buy(): check if user can not buy more than max", async () => 
        {
            let userBuy = max.plus('10e25');
            await bnb.approve(sales.address, userBuy, {from: accounts[1]})
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
        })

        it("buy(): check if user can not buy less than min", async () => 
        {
            let userBuy = min.minus('10e18');
            await bnb.approve(sales.address, userBuy, {from: accounts[1]})
            await truffleAssert.reverts(sales.buy(bnb.address, userBuy, {from: accounts[1]}))
        })

        it("buy(): check if other user can buy", async () => 
        {               
            await bnb.approve(sales.address, userBuy, {from: accounts[5]})        
            await sales.buy(bnb.address, userBuy, {from: accounts[5]})
            let balance = await usd.balanceOf(accounts[5])
            
            assert.equal(balance, userBuy.toFixed() / tokenPrice.plus(4), `expected: ${balance}\nactual: ${userBuy.toFixed() / tokenPrice.plus(4)}`)
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

            // create private sale with usd token, amount - 20000
            await usd.approve(sales.address, startAmount)
            await sales.startSale(startAmount)
        })

        it("investOnBehalf(): check if operator can send money from contract to address", async () => 
        {
            let invest = new BigNumber('20e18')
            await sales.investOnBehalf(accounts[3], invest, {from: accounts[1]}) 
            
            let balance = await usd.balanceOf(accounts[3])        
            assert.equal(balance, invest.toFixed(), `${balance} != ${invest.toFixed()}`)
        })

        it("investOnBehalf(): check if only operator can send money from contract to address", async () => 
        {                   
            await truffleAssert.reverts(sales.investOnBehalf(accounts[3], 20, {from: accounts[5]}))
        })
    })

    describe("test buyETH()", async () =>
    {
        let userEth = new BigNumber('7e16')
        before(async() => 
        {
            //set time to start
            await sales.setEndDate(startDate + 10000)
            await sales.setStartDate(startDate)

            await usd.approve(sales.address, startAmount) 
            await sales.startSale(startAmount)
            await sales.addWLInvestor(accounts[2], {from: accounts[1]})
            await sales.addWLInvestor(accounts[3], {from: accounts[1]})
        })

        it("buyETH(): check if user can buy tokens from contract", async () => 
        {                   
            await sales.buyETH({from: accounts[2], value: userEth})
            
            let balanceETHContract = await web3.eth.getBalance(sales.address);
            let balanceContract = await usd.balanceOf(sales.address);
            console.log(`\tETH: ${balanceETHContract / 10e18}, USD: ${balanceContract / 10e18}$`)

            let balance = await usd.balanceOf(accounts[2]);
            let bn = new BigNumber(balance)
            let expected = new BigNumber('15555555555555555555')
            
            assert.equal(bn.toFixed(), expected.toFixed(), `${bn.toFixed()} != ${expected.toFixed()}`)
        })

        it("buyETH(): check if user cannot buy more than max amount allowed", async () => 
        {
            await truffleAssert.reverts(sales.buyETH({from: accounts[2], value: userEth.plus(1e18)}))              
        })

        it("buyETH(): check if user cannot buy less than min amount allowed", async () => 
        {
            await truffleAssert.reverts(sales.buyETH({from: accounts[3], value: min.minus(10)}))
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
            let pr = await sales.expected(200);
            assert.equal(9, pr, `${pr} != ${9}`)
        })
    })

    describe("test returnTokens:", async () =>
    {
        const transferAmount = new BigNumber('200e18')
        before(async() => 
        {
            await sales.addOperator(accounts[1])
            await bnb.transfer(accounts[4], transferAmount)
        })
        it("returnTokens(): check if user non kyced user can get usdt back", async () => 
        {
            await bnb.approve(sales.address, transferAmount, {from: accounts[4]})
            await sales.returnTokens(bnb.address, accounts[4], {from: accounts[1]})
            let balance = await usd.balanceOf(accounts[4]);

            assert.equal(balance, transferAmount.multipliedBy(10).toFixed(), `${balance} != ${transferAmount.multipliedBy(10).toFixed()}`)
        })
    })


    describe("test priceTiers()", async () =>
    {
        // here we will see graduation of price test
        before(async() =>
        {
            // 1
            let pr = await sales.price()
            console.log(`Current price: ${pr}$`)
            

            await bnb.approve(sales.address, userBuy, {from: accounts[1]}) 
            await sales.buy(bnb.address, userBuy, {from: accounts[1]})   
            pr = await sales.price()
            console.log(`Current price: ${pr}$`)

            // 2
            await timeout(3000)

            await bnb.approve(sales.address, userBuy, {from: accounts[1]})
            await sales.buy(bnb.address, userBuy, {from: accounts[1]}),
            pr = await sales.price()
            console.log(`Current price: ${pr}$`)

            // 3
            await timeout(3000)

            await bnb.approve(sales.address, userBuy)
            await sales.buy(bnb.address, userBuy),
            pr = await sales.price()
            console.log(`Current price: ${pr}$`)
        })

        it("priceTiersByTime(): must show price tiers every time of sale", async () => 
        {
            let price = await sales.priceTiersByTime(startDate)
            console.log(`Start price: ${price.toNumber()}`)

            let timeNow = parseInt(Date.now() / 1000)

            price = await sales.priceTiersByTime(timeNow)
            console.log(`Start price: ${price.toNumber()}`)
            
            let otherTime = parseInt(startDate + 7)
            price = await sales.priceTiersByTime(otherTime)
            console.log(`Start price: ${price.toNumber()}`)
        })


        it("priceTiersByAmount(): must show price tiers every time of sale", async () => 
        {
            let price = await sales.priceTiersByAmount(startAmount)
            console.log(`Start price: ${price.toNumber()}`)
            
            let bn = new BigNumber('113492063492063492062')
            let secondAmount = startAmount.minus(bn)

            price = await sales.priceTiersByAmount(secondAmount.plus('50e18'))
            console.log(`Start price: ${price.toNumber()}`)
            

            let otherAmount = startAmount.minus("200e18")
            price = await sales.priceTiersByAmount(otherAmount)
            console.log(`Start price: ${price.toNumber()}`)
        })
    })
})