const Sales = artifacts.require("Sales");

module.exports = function (deployer) {
  //let eth = deployer.deploy(Token, "Ethereum", "ETH");
  deployer.deploy(Sales);
};