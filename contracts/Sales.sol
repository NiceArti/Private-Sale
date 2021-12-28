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

  address public token_;


  constructor()
  {
    _grantRole(ADMIN, _msgSender());
  }

  function init(address token, uint256 amount) public
  {
    require(token != address(0), "Sales: zero address");
    IERC20 tokenContract = IERC20(token);

    tokenContract.transferFrom(_msgSender(), address(this), amount);
    _amount = tokenContract.balanceOf(address(this));
  }

  function buy(address token, uint256 amount) public
  {
    require(token != address(0), "Sales: zero address");
    require(
      super.hasRole(OPERATOR, super._msgSender()) ||
      super.hasRole(ADMIN, super._msgSender())    ||
      super.hasRole(WL_INVESTOR, super._msgSender()),
      "Sales: user has no access rights to participate here"
    );
    IERC20 tokenContract = IERC20(token);

    require(_amount > 0, "Sales: sale is ended");
    require(amount >= _min || amount <= _max, "Sales: amount is not in diapason");

    
    if((_userAmount + amount) > _max)
      revert("Sales: your amount is overflow");

    _userAmount += amount;
    
    tokenContract.approve(address(this), amount);
    tokenContract.transferFrom(address(this), _msgSender(), amount);
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


  function investOnBehalf(uint256 amount) public view returns(uint256)
  {
    // operator must initialise transaction
  }


  function endSale(address token) onlyRole(ADMIN) public
  {
    IERC20 tokenContract = IERC20(token);
    _amount = tokenContract.balanceOf(address(this));

    require(_amount > 0, "Sales: sale is ended");
    
    tokenContract.approve(address(this), _amount);
    tokenContract.transferFrom(address(this), _msgSender(), _amount);
  }
}