var Escrow = artifacts.require("./Escrow.sol");
var StateMonitor = artifacts.require("./StateMonitor.sol");

module.exports = (deployer, network) => {
  deployer.deploy(Escrow).then(function(){
    return deployer.deploy(StateMonitor, Escrow.address);
  });
};