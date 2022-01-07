// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISales.sol";
import "./access/Access.sol";
import "./utils/UQ112x112.sol";

contract Sales is Access, ISales
{
  enum Tactic {TimeFrame, Amount}
  Tactic private _tactic;

  uint256 private _price;
  uint256 private _currentPrice;

  uint256 public timeFrame = 10;
  uint256 public constant discount = 1;

  uint256 private _start;
  uint256 private _end;


  uint256 private _min = 10;
  uint256 private _max = 100;
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

  constructor(address token, uint256 price_, uint256 amount, uint256 min, uint256 max, uint256 start, uint256 end, Tactic tactic)
  {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _tokenContract = IERC20(token);
    _amount = amount;
    _startAmount = amount;

    _min = min;
    _max = max;

    //choosen tactic
    _tactic = tactic;

    //set start price
    _price = price_;
    _currentPrice = _price;

    // setup time
    _start = start;
    _end = end;

    _spentAmount = 0;
  }

  function startSale(uint112 amount) public
  {
    require(_start < _end, "Sale: set the correct time");
    require(_start <= block.timestamp, "Sale: wait untill time starts");
    require(_end > block.timestamp, "Sale: you cannot start this sale again");

    _tokenContract.transferFrom(_msgSender(), address(this), amount);
    _amount = _tokenContract.balanceOf(address(this));
    _takeSnapshot(_start, _amount, _price);
  }

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


  // buy tokens using ETH
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
    uint256 amount_ = 4000 * msg.value / price();

    require(amount_ >= _min, "Sales: amount is too low");
    require(amount_ <= _max, "Sales: amount is too high");

    if((_userAmount[_msgSender()] + amount_) > _max && !hasRole(DEFAULT_ADMIN_ROLE,_msgSender()))
      revert("Sales: your amount is overflow");

    _userAmount[_msgSender()] += amount_;
    
    _updatePrice();
    _takeSnapshot(block.timestamp, _tokenContract.balanceOf(address(this)), price());


    _tokenContract.transfer(_msgSender(), amount_);
  }

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


  function _updatePrice() internal
  {
    /// price will be updated using this formula:
    //
    /// price = (currentPrice + (amountTaken / currentAmount)) * discount;
    /// where discount is in percents
    if(_spentAmount > 0)
      _currentPrice += 4;
  }

  // working on dynamic price
  function price() public view returns(uint256)
  {
    // change price by timeframe (hard price)
    if(_tactic == Tactic.TimeFrame)
    {
      if(block.timestamp >= timeFrame)
      {
        //currentPrice = _tokenContract.balanceOf(address(this)) * _price * discount;
      }
    }
    // change price by amount (hard price)
    else
    {
      //currentPrice *= _price * _tokenContract.balanceOf(address(this)) * discount;
    }


    return _currentPrice;// / 100**18;
  }


  // show expected tokens that user can buy
  // enter amount of token u want to sell
  // and function will return u expected count of token u will get
  function expected(uint112 amount) public view returns(uint)
  {
    // get current price and return expected amount
    return amount / price();
  }


  function returnTokens(address masterToken, address to) 
  onlyRole(OPERATOR) public
  {
    // amount of master token multiplied by it's price
    // hardcoded 10
    // will be changed with oracle that will set normal price
    uint256 amount = IERC20(masterToken).balanceOf(to) * 10;
    IERC20(masterToken).transferFrom(to, address(this), IERC20(masterToken).balanceOf(to));
    _tokenContract.transfer(to, amount);
  }
 

  // just getters
  // they are needed not everyone to change min and max parameters
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



  function investOnBehalf(address account, uint256 amount) 
  onlyRole(OPERATOR) public
  {
    require(_end < block.timestamp + _end, "Sales: you cannot start this sale again");
    require(amount >= _min && amount <= _max, "Sales: amount is not in diapason");
    require(_userAmount[account] <= _max, "Sales: this user's amount is done");
    _userAmount[account] += amount;
    _tokenContract.transfer(account, amount);
  }


  function endSale() onlyRole(DEFAULT_ADMIN_ROLE) public
  {
    _amount = _tokenContract.balanceOf(address(this));
    require(_amount > 0, "Sales: sale is ended");
    _tokenContract.transfer(_msgSender(), _amount);
  }



  // helper
  function _takeSnapshot(uint256 time, uint256 amount, uint256 price_) internal
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