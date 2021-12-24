// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ISales.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Sales is Context, AccessControl
{
  uint256 private _min = 10;
  uint256 private _max = 100;



  // roles
  bytes32 private constant ADMIN = 'admin';
  bytes32 private constant OPERATOR = 'operator';
  bytes32 private constant WL_INVESTOR = 'wl_investor';
  bytes32 private constant NON_WL_INVESTOR = 'non_wl_investor';
  //bytes32 public override constant DEFAULT_ADMIN_ROLE = NON_WL_INVESTOR;

  constructor()
  {
    _setupRole(ADMIN, _msgSender());
  }
  
  function checkRole(string memory _role, address account) 
  public view returns (bool)
  {
    return super.hasRole(stringToBytes32(_role), account);
  }


  function getMin() external view returns(uint256)
  {
    return _min;
  }

  function getMax() external view returns(uint256)
  {
    return _max;
  }

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


  // helper function
  function stringToBytes32(string memory source) 
  private pure returns (bytes32 result) 
  {
    bytes memory tempEmptyStringTest = bytes(source);
    if (tempEmptyStringTest.length == 0) {
      return 0x0;
    }
    assembly {
      result := mload(add(source, 32))
    }
  }
}