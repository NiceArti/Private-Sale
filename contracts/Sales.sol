// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISales.sol";
import "./access/Access.sol";

contract Sales is Access, ISales
{
  uint256 private _min = 10;
  uint256 private _max = 100;
  uint256 public _amount;

  uint256 public _userAmount = 0;

  IERC20 private _tokenContract;

  constructor(address token, uint256 amount)
  {
    _grantRole(ADMIN, _msgSender());
    _tokenContract = IERC20(token);
    _amount = amount;
  }

  function startSale(uint256 amount) public
  {
    _tokenContract.transferFrom(_msgSender(), address(this), amount);
    _amount = _tokenContract.balanceOf(address(this));
  }

  function buy(address token, uint256 amount) public
  {
    require(
      super.hasRole(OPERATOR, super._msgSender()) ||
      super.hasRole(ADMIN, super._msgSender())    ||
      super.hasRole(WL_INVESTOR, super._msgSender()),
      "Sales: user has no access rights to participate here"
    );
    require(_amount > 0, "Sales: sale is ended");
    require(amount >= _min || amount <= _max, "Sales: amount is not in diapason");
 
    if((_userAmount + amount) > _max && !hasRole(ADMIN,_msgSender()))
      revert("Sales: your amount is overflow");

    _userAmount += amount;


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
    require(amount >= _min || amount <= _max, "Sales: amount is not in diapason");

    if((_userAmount + amount) > _max && !hasRole(ADMIN,_msgSender()))
      revert("Sales: your amount is overflow");

    _userAmount += amount;
    
    _tokenContract.transfer(_msgSender(), amount);
  }
 
  // just getters
  // they are needed not everyone to change min and max parameters
  function getMin() external view returns(uint256)
  {
    return _min;
  }

  function getMax() external view returns(uint256)
  {
    return _max;
  }


  // only admin role can modify min and max parameter
  function setMin(uint8 new_min) onlyRole(ADMIN) external
  {
    require(new_min <= _max, "Sales: MIN_AMOUNT is too high");
    _min = new_min;
  }

  function setMax(uint8 new_max) onlyRole(ADMIN) external
  {
    require(new_max >= _min, "Sales: MAX_AMOUNT is too low");
    _max = new_max;
  }


  function investOnBehalf(address account, uint256 amount) 
  onlyRole(OPERATOR) public
  {
    _tokenContract.transfer(account, amount);
  }


  function endSale() onlyRole(ADMIN) public
  {
    _amount = _tokenContract.balanceOf(address(this));
    require(_amount > 0, "Sales: sale is ended");
    _tokenContract.transfer(_msgSender(), _amount);
  }
}