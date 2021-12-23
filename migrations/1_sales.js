const Sales = artifacts.require("Sales");

module.exports = function (deployer) {
  deployer.deploy(Sales);
};
