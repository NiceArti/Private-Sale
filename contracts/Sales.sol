// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ISales.sol";
import "./access/Access.sol";

contract Sales is Access, ISales
{
  uint256 private _min = 10;
  uint256 private _max = 100;


  constructor()
  {
    _grantRole(ADMIN, _msgSender());
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

}