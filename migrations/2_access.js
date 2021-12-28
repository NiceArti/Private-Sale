const AccessTest = artifacts.require("AccessTest");

module.exports = function (deployer) {
  deployer.deploy(AccessTest);
};
