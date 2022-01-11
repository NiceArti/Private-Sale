// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./oracle/interface/IMTOracle.sol";
import "./access/Access.sol";
import "./utils/UQ112x112.sol";

contract Sales is Access
{
  uint256 private _price;
  uint256 private _discount = 1;

  uint256 private _start;
  uint256 private _end;

  uint256 private _amountTaken = 0;

  uint256 private _min;
  uint256 private _max;
  uint256 private _balance;

  uint256 private _startAmount;
  uint256 private _amount;
  uint256 private _spentAmount;

  mapping(address => uint256) internal _userAmount;

  uint256[] internal _snapshotOfTime;
  uint256[] internal _snapshotOfAmount;
  mapping(uint256 => uint256) internal _priceBuffer;
  mapping(uint256 => uint256) internal _priceBufferByAmount;


  IERC20 private _tokenContract;
  IMTOracle private _oracle;

  constructor(address token, uint256 price_, uint256 amount, uint256 min, uint256 max, uint256 start, uint256 end, address oracle)
  {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _tokenContract = IERC20(token);
    _oracle = IMTOracle(oracle);

    _amount = amount;
    _startAmount = amount;

    _min = min;
    _max = max;

    //set start price
    _price = price_;

    // setup time
    _start = start;
    _end = end;

    _spentAmount = 0;
  }


  /// This function allows admin to start sale whe time is started
  function startSale(uint112 amount) onlyRole(DEFAULT_ADMIN_ROLE) public
  {
    require(_start < _end, "Sale: set the correct time");
    require(_start <= block.timestamp, "Sale: wait untill time starts");
    require(_end > block.timestamp, "Sale: you cannot start this sale again");

    _tokenContract.transferFrom(_msgSender(), address(this), amount);
    _amount = _tokenContract.balanceOf(address(this));
    _takeSnapshot(_start, _amount, _price);
  }


  /// This function allow to buy tokens
  function buy(address token, uint112 amount) public
  {
    require(
      super.hasRole(OPERATOR, super._msgSender()) ||
      super.hasRole(DEFAULT_ADMIN_ROLE, super._msgSender())    ||
      super.hasRole(WL_INVESTOR, super._msgSender()),
      "Sales: user has no access rights to participate here"
    );
    require(_amount > 0, "Sales: sale is ended");
    require(block.timestamp <= _end, "Sales: sale is ended");
    require(block.timestamp >= _start, "Sales: sale is not started yet");

    // amount of tokens that user will get by other ERC20 token's price
    uint amount_ = expected(amount);
    _amountTaken += amount_;

    require(amount_ >= _min && amount_ <= _max, "Sales: amount is not in diapason");
  
    if((_userAmount[_msgSender()] + amount_) > _max && !hasRole(DEFAULT_ADMIN_ROLE, _msgSender()))
      revert("Sales: your amount is overflow");

    _userAmount[_msgSender()] += amount_;
    _spentAmount += amount_;



    IERC20 tokenContractClient = IERC20(token);
    tokenContractClient.transferFrom(_msgSender(), address(this), amount_);
    _tokenContract.transfer(_msgSender(), amount_);

    _updatePrice();
    _takeSnapshot(block.timestamp, _tokenContract.balanceOf(address(this)), price());
  }


  /// This function allow to buy tokens using ETH
  function buyETH() public payable
  {
    require(
      super.hasRole(OPERATOR, super._msgSender()) ||
      super.hasRole(DEFAULT_ADMIN_ROLE, super._msgSender())    ||
      super.hasRole(WL_INVESTOR, super._msgSender()),
      "Sales: user has no access rights to participate here"
    );
    require(_amount > 0, "Sales: sale is ended");
    require(block.timestamp <= _end, "Sales: sale is ended");
    require(block.timestamp >= _start, "Sales: sale is not started yet");

    //get amount of tokens that can be getted by ETH amount
    uint256 amount_ = _oracle.getETHPrice() * msg.value / price();
    _amountTaken += amount_;

    require(amount_ >= _min, "Sales: amount is too low");
    require(amount_ <= _max, "Sales: amount is too high");

    if((_userAmount[_msgSender()] + amount_) > _max && !hasRole(DEFAULT_ADMIN_ROLE,_msgSender()))
      revert("Sales: your amount is overflow");

    _userAmount[_msgSender()] += amount_;
    
    _updatePrice();
    _takeSnapshot(block.timestamp, _tokenContract.balanceOf(address(this)), price());


    _tokenContract.transfer(_msgSender(), amount_);
  }



  /// This function shows to user price by every time
  function priceTiersByTime(uint256 timestamp) public view returns(uint)
  {
    require(timestamp >= _start, "Sales: your current time is less then needed");

    // check if not first or last
    if(timestamp == _start)
      return _priceBuffer[timestamp];
    else if (timestamp >= _snapshotOfTime[_snapshotOfTime.length - 1])
      return _priceBuffer[_snapshotOfTime[_snapshotOfTime.length - 1]];

    // find on array of dates
    // do not touch first and last element
    for(uint256 i = 0; i < _snapshotOfTime.length; i++)
    {
      if(timestamp >= _snapshotOfTime[i] && timestamp <= _snapshotOfTime[i + 1])
        return _priceBuffer[_snapshotOfTime[i]];
    }

    return 0;
  }


  /// This function shows to user price by amount spent
  /// every time
  function priceTiersByAmount(uint256 amount) public view returns(uint)
  {
    require(amount <= _startAmount, "Sales: your current amount is bigger then needed");

    // check if not first or last
    if(amount == _startAmount)
      return _priceBufferByAmount[_snapshotOfAmount[0]];
    else if (_snapshotOfAmount[_snapshotOfAmount.length - 1] >= amount)
      return _priceBufferByAmount[_snapshotOfAmount[_snapshotOfAmount.length - 1]];

    // find on array of dates
    // do not touch first and last element
    for(uint256 i = 0; i < _snapshotOfAmount.length; i++)
    {
      if(_snapshotOfAmount[i] >= amount && _snapshotOfAmount[i + 1] <= amount)
        return _priceBufferByAmount[_snapshotOfAmount[i]];
    }

    return 0;
  }

  /// This function updates price depends on how much token where bought
  function _updatePrice() private
  {
    /// discount calculates by formula:
    /// d = 1 - (a * 100% / b)
    /// returns percentage of the price
    /// e.g. returns if user has 0 master tokens
    /// he/she must pay 100% of price
    /// if he has 25% of tokens, he/she will pay just 75% of price etc.
    _discount = 1 - (IERC20(_oracle.masterTokenAddress()).balanceOf(_msgSender()) * 100 / IERC20(_oracle.masterTokenAddress()).balanceOf(address(this)));
    
    /// price will be updated using this formula:
    //
    /// price = (currentPrice + (amountTaken / currentAmount)) * discount;
    /// where discount is in percents
    _price = (_price + (_amountTaken / _tokenContract.balanceOf(address(this)))) * _discount;
  }



  /// This function shows current price of invested token
  function price() public view returns(uint256)
  {
    return _price;
  }


  /// show expected tokens that user can buy
  /// enter amount of token u want to sell
  /// and function will return u expected count of token u will get
  function expected(uint112 amount) public view returns(uint)
  {
    // get current price and return expected amount
    return amount / (_price * _discount);
  }


  /// This function let's non whitelisted user to return tokens
  /// selling master tokens
  function returnTokens(address to) 
  onlyRole(OPERATOR) public
  {
    // amount of master token multiplied by it's price
    uint256 amount = IERC20(_oracle.masterTokenAddress()).balanceOf(to) * _oracle.getMTPrice();
    IERC20(_oracle.masterTokenAddress()).transferFrom(to, address(this), IERC20(_oracle.masterTokenAddress()).balanceOf(to));
    _tokenContract.transfer(to, amount);
  }
 

  /// just getters
  /// they are needed not everyone to change min and max parameters
  function getMin() public view returns(uint256)
  {
    return _min;
  }


  function getMax() public view returns(uint256)
  {
    return _max;
  }


  // only admin role can modify min and max parameter
  function setMin(uint112 new_min) onlyRole(DEFAULT_ADMIN_ROLE) external
  {
    require(new_min <= _max, "Sales: MIN_AMOUNT is too high");
    _min = new_min;
  }


  function setMax(uint112 new_max) onlyRole(DEFAULT_ADMIN_ROLE) external
  {
    require(new_max >= _min, "Sales: MAX_AMOUNT is too low");
    _max = new_max;
  }


  /// This function let's operators to invest on account
  /// who decides to buy tokens via card nor ERC20 tokens
  function investOnBehalf(address account, uint256 amount) 
  onlyRole(OPERATOR) public
  {
    require(_end < block.timestamp + _end, "Sales: you cannot start this sale again");
    require(amount >= _min && amount <= _max, "Sales: amount is not in diapason");
    require(_userAmount[account] <= _max, "Sales: this user's amount is done");
    _userAmount[account] += amount;
    _tokenContract.transfer(account, amount);
  }


  /// This function let's admin to end sale in every moment
  /// when he/she would like
  function endSale() onlyRole(DEFAULT_ADMIN_ROLE) public 
  {
    /// check if balance is not null and then
    /// return tokens to admin who started sale
    _amount = _tokenContract.balanceOf(address(this));
    require(_amount > 0, "Sales: sale is ended");
    _tokenContract.transfer(_msgSender(), _amount);

    /// send eth to admin if balance is not null
    if(address(this).balance > 0)
      payable(address(msg.sender)).transfer(address(this).balance);
    
  }



  /// this function make snapshoot each transaction
  /// saves needed data in contract and the is used 
  /// when user wants to get data by amaount or time
  function _takeSnapshot(uint256 time, uint256 amount, uint256 price_) private
  {
    _snapshotOfTime.push(time);
    _snapshotOfAmount.push(amount);
    _priceBuffer[time] = price_;
    _priceBufferByAmount[amount] = price_;
  }



  // helpers remove after testing
  function setEndDate(uint256 end) public 
  {
    _end = end;
  }

  function setStartDate(uint256 start) public 
  {
    _start = start;
  }

  function getEndDate() public view returns(uint256)
  {
    return _end;
  }

  function getStartDate() public view returns(uint256)
  {
    return _start;
  }



}