// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISales.sol";
import "./access/Access.sol";
import "./utils/UQ112x112.sol";

contract Sales is Access, ISales
{
  using UQ112x112 for uint224;

  enum Tactic {TimeFrame, Amount}
  Tactic private _tactic;

  uint112 private _price;
  uint256 public timeFrame = 10;
  uint256 public constant discount = 1;

  uint256 private _start;
  uint256 private _end;


  uint112 private _min = 10;
  uint112 private _max = 100;
  uint256 public _amount;

  mapping(address => uint256) internal _userAmount;

  IERC20 private _tokenContract;

  constructor(address token, uint112 price_, uint256 amount, uint112 min, uint112 max, uint256 start, uint256 end, Tactic tactic)
  {
    _grantRole(ADMIN, _msgSender());
    _tokenContract = IERC20(token);
    _amount = amount;

    _min = min;
    _max = max;

    //choosen tactic
    _tactic = tactic;

    //set start price
    _price = price_;

    // setup time
    _start = start;
    _end = end;
  }

  function startSale(uint112 amount) public
  {
    require(_start < _end, "Sale: set the correct time");
    require(_start <= block.timestamp, "Sale: wait untill time starts");
    require(_end > block.timestamp, "Sale: you cannot start this sale again");


    _tokenContract.transferFrom(_msgSender(), address(this), amount);
    _amount = _tokenContract.balanceOf(address(this));
  }

  function buy(address token, uint112 amount) public
  {
    require(
      super.hasRole(OPERATOR, super._msgSender()) ||
      super.hasRole(ADMIN, super._msgSender())    ||
      super.hasRole(WL_INVESTOR, super._msgSender()),
      "Sales: user has no access rights to participate here"
    );
    require(_amount > 0, "Sales: sale is ended");
    require(block.timestamp <= _end, "Sales: sale is ended");
    require(block.timestamp >= _start, "Sales: sale is not started yet");

    // amount of tokens that user will get by other ERC20 token's price
    //uint amount_ = expected(amount);

    require(amount >= _min && amount <= _max, "Sales: amount is not in diapason");
 
    if((_userAmount[_msgSender()] + amount) > _max && !hasRole(ADMIN,_msgSender()))
      revert("Sales: your amount is overflow");

    _userAmount[_msgSender()] += amount;

    IERC20 tokenContractClient = IERC20(token);
    tokenContractClient.transferFrom(_msgSender(), address(this), amount);
    _tokenContract.transfer(_msgSender(), amount);
  }

  // buy tokens using ETH
  function buyETH(uint256 amount) public payable
  {
    require(
      super.hasRole(OPERATOR, super._msgSender()) ||
      super.hasRole(ADMIN, super._msgSender())    ||
      super.hasRole(WL_INVESTOR, super._msgSender()),
      "Sales: user has no access rights to participate here"
    );
    require(_amount > 0, "Sales: sale is ended");
    require(block.timestamp <= _end, "Sales: sale is ended");
    require(block.timestamp >= _start, "Sales: sale is not started yet");
    require(amount >= _min && amount <= _max, "Sales: amount is not in diapason");
    require(msg.value == amount, "Sales: try different amount"); 

    if((_userAmount[_msgSender()] + amount) > _max && !hasRole(ADMIN,_msgSender()))
      revert("Sales: your amount is overflow");

    _userAmount[_msgSender()] += amount;
    
    _tokenContract.transfer(_msgSender(), msg.value);
  }

  
  // working on dynamic price
  function price() public view returns(uint112)
  {
    //uint112 currentPrice = 1;

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
    
    return _price;
  }


  // show expected tokens that user can buy
  // enter amount of token u want to sell
  // and function will return u expected count of token u will get
  function expected(uint112 amount) public view returns(uint)
  {
    // get current price and return expected amount
    return uint(UQ112x112.encode(amount).uqdiv(price()));
  }


  function returnTokens(address masterToken, address to) 
  onlyRole(OPERATOR) public
  {
    IERC20(masterToken).transferFrom(to, address(this), IERC20(masterToken).balanceOf(to));
    uint256 amount = IERC20(masterToken).balanceOf(to) * 10;
    _tokenContract.transfer(to, amount);
  }
 

  // just getters
  // they are needed not everyone to change min and max parameters
  function getMin() public view returns(uint)
  {
    return uint(UQ112x112.encode(_min));
  }


  function getMax() public view returns(uint)
  {
    return uint(UQ112x112.encode(_max));
  }


  // only admin role can modify min and max parameter
  function setMin(uint112 new_min) onlyRole(ADMIN) external
  {
    require(new_min <= _max, "Sales: MIN_AMOUNT is too high");
    _min = new_min;
  }


  function setMax(uint112 new_max) onlyRole(ADMIN) external
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


  function endSale() onlyRole(ADMIN) public
  {
    _amount = _tokenContract.balanceOf(address(this));
    require(_amount > 0, "Sales: sale is ended");
    _tokenContract.transfer(_msgSender(), _amount);
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