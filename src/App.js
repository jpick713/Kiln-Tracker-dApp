import StateMonitor from './abis/StateMonitor.json';
import Escrow from './abis/Escrow.json';
import './App.css';
import { render } from '@testing-library/react';
import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import parse from 'html-react-parser';

var Web3 = require('web3');

class App extends React.Component {


  constructor(props){
    super(props);
    this.state = {
      data: null,
      output: null,
      dataAddr: null,
      accounts: null,
      ownerMonitor: null,
      escrowContract: null,
      monitorContract: null,
      escrowAddress : null,
      monitorAddress : null,
      storageAddress : null,
      AdminAddressToAdd : null,
      adminList : [],
      deviceList : [],
      originatorDealList : [],
      companyDealList : [],
      adminString : "",
      deviceIMEI : "",
      firstLine : "",
      jsonString : "",
      checkSumAddr : "",
      AddressToWhiteList : "",
      AddressToBlackList : "",
      deviceString : "",
      originatorString : "",
      companyDealString : "",
      IMEISearch : "",
      IMEISearchResult : "",
      AddressDealSearch : "",
      AddressDealSearchResult : "",
      FormAddress : "",
      FormID : "",
      FormIMEI : "",
      FormBalance : 0,
      FormTimeEnd : 30,
      FormMinThreshold : 0,
      FormMaxThreshold : 0,
      FormTotalCounts : 0,
      FormGasResistance : 0,
      UUIDVerify : "",
      primedVerify : false,
      storeUUIDforVerify : ""
    };
    
    this.addrFind = this.addrFind.bind(this);
    this.setStorageAddr = this.setStorageAddr.bind(this);
    this.showStorageAddr = this.showStorageAddr.bind(this);
    this.runPebbleSimulator = this.runPebbleSimulator.bind(this);
    this.runPebbleSimulatorVerify = this.runPebbleSimulatorVerify.bind(this);
    this.AddAdminAddress = this.AddAdminAddress.bind(this);
    this.getAccountBalances = this.getAccountBalances.bind(this);
    this.RegisterDevice = this.RegisterDevice.bind(this);
    this.WhiteListAddress = this.WhiteListAddress.bind(this);
    this.BlackListAddress = this.BlackListAddress.bind(this);
    this.IMEISearch = this.IMEISearch.bind(this);
    this.InitiateDeal = this.InitiateDeal.bind(this);
    this.DealSearchByAddress = this.DealSearchByAddress.bind(this);
  }

  
  
  async componentDidMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
    this.callBackendAPI()
      .then(res => this.setState({ data: res.express }))
      .catch(err => console.log(err));
    this.setEventListeners();
    const pebResponse = await this.runPebbleSimulator(1,10,5);
    
  }
    // fetching the GET route from the Express server which matches the GET route from server.js
  callBackendAPI = async () => {
    const response = await fetch('/express_backend');
    const body = await response.json();
         
    
    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body;
  };
  
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkMonitorData = StateMonitor.networks[networkId]
    const networkEscrowData = Escrow.networks[networkId]
    if(networkMonitorData) {
      // Assign contract
      const stateMonitor = new web3.eth.Contract(StateMonitor.abi, networkMonitorData.address);
      const escrowTarget = new web3.eth.Contract(Escrow.abi, networkEscrowData.address);
      this.setState({monitorContract : stateMonitor, escrowContract : escrowTarget, monitorAddress : networkMonitorData.address});
      const escrowAddress = await stateMonitor.methods.escrow().call();
      const ownerMonitor = await stateMonitor.methods.admins(0).call();
      const storageAddress = await escrowTarget.methods.storageContract().call();
      const adminList = await stateMonitor.methods.getAllAdmins().call();
      const deviceList = await stateMonitor.methods.getAllOwnersDevices(this.state.account).call(); 
      const originatorDealList = await stateMonitor.methods.getOriginatorsDeals(this.state.account).call();
      this.setState({ownerMonitor, escrowAddress, storageAddress, adminList, deviceList, originatorDealList});
      var deviceString = "";
      if(deviceList.length>0){
        for (var i=0; i<this.state.deviceList.length; i++){
        deviceString += `<tr><td>${deviceList[i].IMEI}</td><td>${deviceList[i].deviceAddress}</td></tr>`;
        }
      }
      var originatorString = "";
      if(originatorDealList.length>0){
        for (var i=0; i<this.state.originatorDealList.length; i++){
        originatorString += `<tr><td>${originatorDealList[i].uuid}</td><td>${originatorDealList[i].companyAddress}</td><td>${originatorDealList[i].companyID}</td></tr>`;
        }
      }
      var adminString = `${this.state.adminList[0]}`;
      for (var i=1; i<this.state.adminList.length; i++){
        adminString +=`, ${this.state.adminList[i]}`;
      }
      this.setState({adminString, deviceString, originatorString});
      
    } else {
      window.alert('State Monitor contract not deployed to detected network.')
    }
  }

  setEventListeners(){
  window.ethereum.on('accountsChanged', async (accounts) => {
    this.setState({account : accounts[0]});
    const deviceList = await this.state.monitorContract.methods.getAllOwnersDevices(this.state.account).call(); 
    const originatorDealList = await this.state.monitorContract.methods.getOriginatorsDeals(this.state.account).call();
    this.setState({deviceList, originatorDealList, AddressDealSearch : "", AddressDealSearchResult : ""});
    var deviceString = "";
    if(deviceList.length>0){
      for (var i=0; i<this.state.deviceList.length; i++){
          deviceString += `<tr><td>${deviceList[i].IMEI}</td><td>${deviceList[i].deviceAddress}</td></tr>`;
        }
      }
    var originatorString = "";
    if(originatorDealList.length>0){
      for (var i=0; i<this.state.originatorDealList.length; i++){
        originatorString += `<tr><td>${originatorDealList[i].uuid}</td><td>${originatorDealList[i].companyAddress}</td><td>${originatorDealList[i].companyID}</td></tr>`;
      }
    }
    this.setState({deviceString, originatorString, primedVerify : false});
  });
}


  addrFind = async (intFlag) => {
    const response = await fetch(`/get_address?readData=${intFlag}`);
    const body = await response.json();
         
    if (response.status !== 200) {
      throw Error(body.message)
    }

    const addr = body.currentAddr;
    const firstLine = body.firstLine;
    const checkSumAddr = window.web3.utils.toChecksumAddress(addr);
    this.setState({dataAddr : checkSumAddr, firstLine, primedVerify : false});
    return body;
  };


  setStorageAddr = async (inputAddress) => {
    if(this.state.escrowContract){
    await this.state.escrowContract.methods.setStorageContract(inputAddress).send( {from: this.state.account}).on('transactionHash', (hash) =>{
    });
    }
    return;
  };

  showStorageAddr = async () => {
    const storageAddress = await this.state.escrowContract.methods.storageContract().call();
    this.setState({storageAddress});
    alert(this.state.storageAddress);
  }

  getAccountBalances = async () => {
    const monitorBalance = await this.state.monitorContract.methods.getBalance().call();
    const escrowBalance = await this.state.escrowContract.methods.getBalance().call();
    alert(`State Monitor Balance is ${monitorBalance} and escrow balance is ${escrowBalance}`);
  }

  AddAdminAddress = async (event) => {
    event.preventDefault();
    if (this.state.AdminAddressToAdd){
      await this.state.monitorContract.methods.addAdmin(this.state.AdminAddressToAdd).send({from: this.state.account}).on('transactionHash', async (hash) => {
      this.setState({AdminAddressToAdd : ""});
      
      }).on('error', (e) =>{
        this.setState({AdminAddressToAdd : ""});
      })
      const adminList = await this.state.monitorContract.methods.getAllAdmins().call();
      this.setState({adminList});
      var adminString = `${this.state.adminList[0]}`;
      for (var i=1; i<this.state.adminList.length; i++){
        adminString +=`, ${this.state.adminList[i]}`;
      }
      this.setState({adminString});
    }
    
  }

  runPebbleSimulator = async (amount, max, min) => {
  const response = await fetch(`/run_simulator?runs=${amount}&TargetMax=${max}&TargetMin=${min}`);
  const body = await response.json();
       
  if (response.status !== 200) {
    throw Error(body.message)
  }
  this.setState({primedVerify : false});
  return body;
  }

  runPebbleSimulatorVerify = async (event) => {
    event.preventDefault();
    const isAdmin = await this.state.monitorContract.methods.adminMap(this.state.account).call();
    if (!isAdmin){
      alert(`will need an admin account to verify a deal`);
      this.setState({UUIDVerify : ""});
      return;
    }
    const deal = await this.state.monitorContract.methods.deals(this.state.UUIDVerify).call();
    if(!deal.isActive){
      alert('can only verify active deals');
      this.setState({UUIDVerify : ""});
      return;
    }
    const device = await this.state.monitorContract.methods.deviceIMEIs(deal.deviceIMEI).call();
    if(!device.exists){
      alert('can only verify deals with still registered devices'); //the delete device function not added, but if you had it this line is needed
      this.setState({UUIDVerify : ""});
      return;
    }
    const verifyInfo = await this.state.escrowContract.methods.verificationInfo(this.state.UUIDVerify).call();
    if(verifyInfo.paidOut){
      alert('this deal has already been paid out');
      this.setState({UUIDVerify : ""});
      return;
    }
    const privKeyVerify = device.privKey;
    const start = verifyInfo.timeStart;
    const delta = Math.floor((verifyInfo.timeEnd - verifyInfo.timeStart)/10);
    const TargetMin = Math.round(0.7 * verifyInfo.gasResistanceTarget);
    const TargetMax = Math.round(1.1* verifyInfo.gasResistanceTarget);
    const response = await fetch(`/run_simulator_verify?Start=${start}&Delta=${delta}&TargetMax=${TargetMax}&TargetMin=${TargetMin}&PrivKey=${privKeyVerify}`);
    const body = await response.json();
         
    if (response.status !== 200) {
      throw Error(body.message)
    }

    this.setState({primedVerify : true});
    this.setState({storeUUIDforVerify : this.state.UUIDVerify})

    return body;
    }

  VerifyDealData = async (event) => {
    event.preventDefault();
    const response = await fetch('/deal_verify_final');
    const body = await response.json();
    const msgArray = body.dataVerify;
    for (var i=0; i< 12; i++){
    const msgString = msgArray[i];
    const s = "0x" + msgString.substring(msgString.length-67, msgString.length-3);
    const r = "0x" + msgString.substring(msgString.length-138, msgString.length-74);
    const msgRaw = msgString.substring(0, msgString.length-157)+"}";
    var colonSplit = msgString.split(":");
    const gasResistance = Number(colonSplit[6].split(",")[0]);
    const timeStamp = Number(colonSplit[14].split('"')[1]);
    

    await this.state.escrowContract.methods.checkDealInfo(msgRaw, r, s, this.state.storeUUIDforVerify, gasResistance, timeStamp).send({from: this.state.account});     
    //const addressesArray = await this.state.escrowContract.methods.returnSimulatorAddresses().call();
    }
    this.setState({primedVerify : false, UUIDVerify : ""});
    return body;
  }

  RegisterDevice = async (event) => {
    event.preventDefault();
    this.setState({primedVerify : false});
    if(this.state.deviceIMEI.trim().length!==15){
      alert('IMEI must be 15 characters!');
      return;
    }
    const Device = await this.state.monitorContract.methods.deviceIMEIs(this.state.deviceIMEI.trim()).call();
    if(Device.exists){
      alert('device already registered');
      this.setState({deviceIMEI : ""});
      return;
    }
    else{
        const addrFindBody = await this.addrFind(1);
        const checkSumAddress = window.web3.utils.toChecksumAddress(addrFindBody.currentAddr);
        const devicePrivKey = addrFindBody.privKey;
        await this.state.monitorContract.methods.registerDevice(this.state.deviceIMEI, devicePrivKey, checkSumAddress).send({from : this.state.account});
        const deviceList = await this.state.monitorContract.methods.getAllOwnersDevices(this.state.account).call(); 
        this.setState({deviceList});
        var deviceString = "";
        if(deviceList.length>0){
          for (var i=0; i<this.state.deviceList.length; i++){
            deviceString += `<tr><td>${deviceList[i].IMEI}</td><td>${deviceList[i].deviceAddress}</td></tr>`;
          }
        } 
        const blackListed = await this.state.escrowContract.methods.blackList(checkSumAddress).call();
        const whiteListed = await this.state.escrowContract.methods.whiteList(checkSumAddress).call();
        if (blackListed){
          alert('This device associated with this address is currently on the blackList');
        }
        else if(!whiteListed){
          const isAdmin = await this.state.monitorContract.methods.adminMap(this.state.account).call();
          if (!isAdmin){
            alert(`will need an admin account to add the address ${checkSumAddress} associated with this device to white List`);
          }
          else{
            const x = window.confirm(`Would you like to add the address ${checkSumAddress} to the White list?`);
            if(x){
              await this.state.escrowContract.methods.addToWhiteList(checkSumAddress).send({from : this.state.account});
            }
          }
        }
      this.setState({deviceIMEI : "", deviceString});
      const pebResponse = await this.runPebbleSimulator(10,10,5);
    }  
  }

  WhiteListAddress = async (event) => {
    event.preventDefault();
    const isAdmin = await this.state.monitorContract.methods.adminMap(this.state.account).call();
    if (!isAdmin){
      alert(`will need an admin account to add an address to white List`);
      this.setState({AddressToWhiteList : ""});
    }
    else{
      const x = window.confirm(`Would you like to add the address ${this.state.AddressToWhiteList} to the White list?`);
      if(x){
        await this.state.escrowContract.methods.addToWhiteList(this.state.AddressToWhiteList).send({from : this.state.account})
        .on('error', (e) =>{
          this.setState({AddressToWhiteList : ""});
        });
        this.setState({AddressToWhiteList : ""});
      }
    }
  }

  BlackListAddress = async (event) => {
    event.preventDefault();
    const isAdmin = await this.state.monitorContract.methods.adminMap(this.state.account).call();
    if (!isAdmin){
      alert(`will need to be the owner to add an address to Black List`);
      this.setState({AddressToBlackList : ""});
    }
    else{
      const x = window.confirm(`Would you like to add the address ${this.state.AddressToBlackList} to the Black list?`);
      if(x){
        await this.state.escrowContract.methods.addToBlackList(this.state.AddressToBlackList, "").send({from : this.state.account})
        .on('error', (e) =>{
          this.setState({AddressToBlackList : ""});
        });
        this.setState({AddressToBlackList : ""});
      }
    }
  }

  IMEISearch = async (event) => {
    event.preventDefault();
    if(this.state.IMEISearch.trim().length!==15){
      alert('IMEI must be 15 characters!');
      this.setState({IMEISearchResult : ""});
      return;
    }
    const Device = await this.state.monitorContract.methods.deviceIMEIs(this.state.IMEISearch.trim()).call();
    if(!Device.exists){
      alert('device is not registered');
      this.setState({IMEISearch : "", IMEISearchResult : ""});
      return;
    }
    else{
      const IMEISearchResult = `IMEI: ${Device.IMEI}  device Address: ${Device.deviceAddress}  Owner: ${Device.deviceOwner}`;
      this.setState({IMEISearchResult, IMEISearch : ""});
    }
  }

  InitiateDeal = async () => {
    
    const isAdmin = await this.state.monitorContract.methods.adminMap(this.state.account).call();
    if(!isAdmin){
      alert('Only Admin can initiate deals');
      return;
    }
    const Device = await this.state.monitorContract.methods.deviceIMEIs(this.state.FormIMEI.trim()).call();
    if(!Device.exists){
      alert('device is not registered');
      this.setState({FormIMEI : ""});
      return;
    }
    if(this.state.FormMinThreshold> 12 || this.state.FormMaxThreshold > 12){
      alert('in demo max and min must be less than or equal to 12');
      return;
    }
    if(Math.round(this.state.FormMinThreshold) > Math.round(this.state.FormMaxThreshold)){
      alert('max must be greater than min');
      return;
    }
    if(Math.floor(this.state.FormBalance) <=0){
      alert('balance must be a positive integer');
      return;
    }
    var gasResistance;
    if(this.state.FormGasResistance<100){
      gasResistance = 100;
    }
    else if(this.state.FormGasResistance>500){
      gasResistance = 500;
    }
    else{
      gasResistance = Math.round(this.state.FormGasResistance);
    }
    var intArray = [];
    const companyAddress = this.state.FormAddress; const companyID = this.state.FormID;
    const IMEI = this.state.FormIMEI;  const currentUnix = Math.floor(Date.now()/1000);
    const timeEnd = currentUnix + Math.round(this.state.FormTimeEnd)*24*3600;
    intArray.push(Math.round(this.state.FormBalance)); intArray.push(timeEnd);
    intArray.push(12); intArray.push(Math.round(this.state.FormMinThreshold));
    intArray.push(Math.round(this.state.FormMaxThreshold)); intArray.push(gasResistance);
    intArray.push(currentUnix);
    //alert(`${intArray[1]} versus ${intArray[6]} __ ${Math.round(this.state.FormTimeEnd)*24*3600}`)
    await this.state.monitorContract.methods.initiateDeal(companyAddress, companyID, intArray, IMEI).send({from : this.state.account}).on('transactionHash', async (hash) => {
    const originatorDealList = await this.state.monitorContract.methods.getOriginatorsDeals(this.state.account).call();
    this.setState({originatorDealList});
    var originatorString = "";
      if(originatorDealList.length>0){
        for (var i=0; i<this.state.originatorDealList.length; i++){
        originatorString += `<tr><td>${originatorDealList[i].uuid}</td><td>${originatorDealList[i].companyAddress}</td><td>${originatorDealList[i].companyID}</td></tr>`;
        }
      }
    this.setState({originatorString});
    });
  }

  DealSearchByAddress = async () => {
    const companyDealList = await this.state.monitorContract.methods.getCompanyDeals(this.state.AddressDealSearch).call();
    this.setState({companyDealList});
    var AddressDealSearchResult = "";
    for (var i=0; i< companyDealList.length; i++){
      AddressDealSearchResult += `<div>UUID : ${this.state.companyDealList[i].uuid}</div>`;
    }
    this.setState({AddressDealSearchResult, AddressDealSearch : ""});
  }
  

  /* need to finish
  VerifyData = async () => {
    const addrFindBody = await this.addrFind(1);
        const checkSumAddress = window.web3.utils.toChecksumAddress(addrFindBody.currentAddr);
        const msgString = addrFindBody.firstLine;
        const s = "0x" + msgString.substring(msgString.length-67, msgString.length-3);
        const r = "0x" + msgString.substring(msgString.length-138, msgString.length-74);
        const msgRaw = msgString.substring(0, msgString.length-157)+"}";
        await this.state.escrowContract.methods.setSimulatorAddress(msgRaw, r, s).send({from: this.state.account});     
        const addressesArray = await this.state.escrowContract.methods.returnSimulatorAddresses().call();
        alert (checkSumAddress+ '_' + addressesArray[0] + '_' + addressesArray[1]);
        const pebResponse = await this.runPebbleSimulator(10,10,5);
  }*/

  
  render(){
    return (
      <div className = "Container">
        <div className="App">
          <header className="App-header">
          <h2>
          {this.state.data}
          </h2>
          <div>Address Owner: {this.state.ownerMonitor}&emsp; 
          Address of escrow : {this.state.escrowAddress}&emsp;
          Address Monitor Account : {this.state.monitorAddress}
          </div>
          <div>
            Admin List:&nbsp;{this.state.adminString} 
          </div>
          <div>{this.state.dataAddr}</div>
          </header>
        </div>

          <div className="columns">
            <div className="cols" style={{width: "5%", textAlign: "center"}}></div>
		        <div className="cols" style={{width: "20%", textAlign: "center"}}>
              <Button variant = "success" size = "lg" onClick={() => this.addrFind(0)}>Address from simulator</Button>
            </div>
            <div className="cols" style={{width: "20%", textAlign: "center"}}>
              <Button variant = "info" size = "lg" onClick={() => this.setStorageAddr(this.state.monitorAddress)}>Set stored Address</Button>
            </div>
            <div className="cols" style={{width: "20%", textAlign: "center"}}>
              <Button variant = "warning" size = "lg" onClick={() => this.showStorageAddr()}>See Stored Address</Button>
            </div>
            <div className="cols" style={{width: "20%", textAlign: "center"}}>
              <Button variant = "primary" size = "lg" onClick={() => this.runPebbleSimulator(25, 15, 8)}>Run Simulator</Button>
            </div>
            <div className="cols" style={{width: "15%", textAlign: "left", paddingLeft: "0.5em"}}>
              <Button variant="danger" size = "lg" onClick={() => this.getAccountBalances()}>Balances</Button>
            </div>
          </div>

          <div className="columns">
            <div className="cols" style={{width: "1%", textAlign: "center"}}></div>
		        <div className="cols" style={{width: "25%", textAlign: "right"}}>
              Add Admin Address (Only Owner can perform):&ensp;
            </div>
            <div className="cols" style={{width: "20%", textAlign: "left"}}>
              <input type="text" id="adminAddress" style={{width: "95%", backgroundColor: "beige"}} value={this.state.AdminAddressToAdd} onChange={(e)=>{this.setState({AdminAddressToAdd: e.target.value})}} />
            </div>
            <div className="cols" style={{width: "12%", textAlign: "left", paddingLeft: "0.5em"}}>
              <Button variant="primary" size = "md" onClick={(event) => this.AddAdminAddress(event)}>Submit Address</Button>
            </div>
            <div className="cols" style={{width: "14%", textAlign: "right"}}>
              Register Device (IMEI):&ensp;
            </div>
            <div className="cols" style={{width: "12%", textAlign: "left"}}>
              <input type="text" id="deviceIMEI" style={{width: "95%", backgroundColor: "beige", border: this.state.deviceIMEI.trim().length!==15 ? "5px solid red" : "5px solid green"}} placeholder = "15 character IMEI" value={this.state.deviceIMEI} onChange={(e)=>{this.setState({deviceIMEI: e.target.value})}} />
            </div>
            <div className="cols" style={{width: "12%", textAlign: "left", paddingLeft: "0.5em"}}>
              <Button variant="primary" size = "md" onClick={(event) => this.RegisterDevice(event)}>Register Device</Button>
            </div>
          </div>

          <div className="columns" style={{backgroundColor : "darkBlue", color: "white", border : "2px solid black"}}>
            <div className="cols" style={{width: "1%"}}></div>
		        <div className="cols" style={{width: "49%", borderRight: "2px solid white"}}>
              <div className="mini-container">
                <div className="mini-columns">
                    <h4 style={{textAlign : "center", width: "100%"}}><em><u>Device Control</u></em></h4>
                </div>  
                <div className="mini-columns">
                  <div className = "mini-cols" style={{width : "35%", textAlign : "right"}}>
                    <Button variant="primary" size = "md" style= {{width : "95%"}} onClick={(event) => this.WhiteListAddress(event)}>Add Whitelist Address</Button> &ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "60%", textAlign : "left"}}>
                    <input type="text" id="whiteListAddress" style={{width: "95%", backgroundColor: "beige"}} value={this.state.AddressToWhiteList} onChange={(e)=>{this.setState({AddressToWhiteList: e.target.value})}} />
                  </div>
                </div>
                <div className="mini-columns" style = {{paddingTop: "0.65em"}}>
                  <div className = "mini-cols" style={{width : "35%", textAlign : "right"}}>
                    <Button variant="danger" size = "md" style= {{width : "95%"}} onClick={(event) => this.BlackListAddress(event)}>Add Blacklist Address</Button> &ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "60%", textAlign : "left"}}>
                    <input type="text" id="whiteListAddress" style={{width: "95%", backgroundColor: "beige"}} value={this.state.AddressToBlackList} onChange={(e)=>{this.setState({AddressToBlackList: e.target.value})}} />
                  </div>
                </div>
                <div className="mini-columns" style = {{paddingTop: "0.65em", paddingBottom: "0.25em"}}>
                  <div className = "mini-cols" style={{width : "35%", textAlign : "right"}}>
                    <Button variant="info" size = "md" style= {{width : "95%"}} onClick={(event) => this.IMEISearch(event)}>Search for IMEI</Button> &ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "60%", textAlign : "left"}}>
                    <input type="text" id="IMEISearch" style={{width: "95%", backgroundColor: "beige", border: this.state.IMEISearch.trim().length!==15 ? "5px solid red" : "5px solid green"}} value={this.state.IMEISearch} onChange={(e)=>{this.setState({IMEISearch: e.target.value})}} />
                  </div>
                </div>
                <div className="mini-columns" style = {{paddingTop: "0.25em", paddingBottom: "0.25em", display: this.state.IMEISearchResult.length===0 ? "none" : "block"}}>
                  <div className = "mini-cols" style={{width : "100%", textAlign : "center"}}>
                    {this.state.IMEISearchResult}
                  </div>
                </div>             
              </div>
            </div>




            <div className="cols" style={{width: "49%"}}>
              <div className="mini-container">
                <div className="mini-columns">
                  <h4 style={{textAlign : "center", width: "100%"}}><em><u>Devices You Own</u></em></h4>
                </div>
                <div className = "mini-columns">
                  <div className = "mini-cols" style={{width : "10%"}}></div>
                  <div className = "mini-cols" style={{width : "80%", maxHeight: "150px", overflowY: "scroll"}}>
                  <Table striped bordered hover size="sm" style={{backgroundColor: "gainsboro"}}>
                    <thead>
                      <tr>
                        <th>IMEI</th>
                        <th>address</th>
                      </tr>
                    </thead>
                    <tbody>
                        {parse(`${this.state.deviceString}`)}
                    </tbody>        

                  </Table>
                  </div>
                  <div className = "mini-cols" style={{width : "10%"}}></div>
                </div>
              </div>
            </div>
            <div className="cols" style={{width: "1%"}}></div>
          </div>
          

          <div className="columns" style={{backgroundColor : "green", color: "beige", marginTop: "2em", border:"2px solid black"}}>
            <div className="cols" style={{width: "1%"}}></div>
		        <div className="cols" style={{width: "49%", borderRight: "2px solid white"}}>
              <div className="mini-container">
                <div className = "mini-columns">
                <h4 style={{textAlign : "center", width: "100%"}}><em><u>Initiate a Deal</u></em></h4>
                </div>
                <div className="mini-columns" style = {{marginTop: "0.25em"}}>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "right"}}>
                    Company Addr:&ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "40%", textAlign : "left"}}>
                    <input type="text" id="dealAddress" style={{width: "95%", backgroundColor: "beige"}} value={this.state.FormAddress} onChange={(e)=>{this.setState({FormAddress: e.target.value})}} />
                  </div>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "right"}}>
                    Company ID:&ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "left"}}>
                    <input type="text" id="dealID" style={{width: "95%", backgroundColor: "beige"}} value={this.state.FormID} onChange={(e)=>{this.setState({FormID: e.target.value})}} />
                  </div>
                </div>
                <div className="mini-columns" style = {{marginTop: "0.5em"}}>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "right"}}>
                    Device IMEI for Deal:&ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "40%", textAlign : "left"}}>
                    <input type="text" id="FormIMEI" style={{width: "95%", backgroundColor: "beige", border: this.state.FormIMEI.trim().length!==15 ? "5px solid red" : "5px solid green"}} value={this.state.FormIMEI} onChange={(e)=>{this.setState({FormIMEI: e.target.value})}} />
                  </div>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "right"}}>
                    Deal Balance in Wei:&ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "left"}}>
                    <input type="number" id="dealBalance" style={{width: "95%", backgroundColor: "beige"}} value={this.state.FormBalance} onChange={(e)=>{this.setState({FormBalance: e.target.value})}} />
                  </div>
                </div>
                <div className="mini-columns" style = {{marginTop: "0.5em"}}>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "right"}}>
                    Deal Length:&ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "40%", textAlign : "left"}}>
                    <select style = {{width: "95%", backgroundColor: "beige"}} value={this.state.FormTimeEnd} onChange={(e)=>{this.setState({FormTimeEnd: Math.round(e.target.value)})}} >
                        <option value = "30" selected>30 days</option>
                        <option value = "60">60 days</option>
                        <option value = "90">90 days</option>
                    </select>
                  </div>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "right"}}>
                    Min # Successes:&ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "left"}}>
                    <input type="number" id="dealMinThreshold" style={{width: "95%", backgroundColor: "beige"}} value={this.state.FormMinThreshold} onChange={(e)=>{this.setState({FormMinThreshold: e.target.value})}} />
                  </div>
                </div>
                <div className="mini-columns" style = {{marginTop: "0.5em"}}>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "right", paddingRight:"0.5em"}}>
                    Max # Successes (12 max allowed in demo):
                  </div>
                  <div className = "mini-cols" style={{width : "40%", textAlign : "left"}}>
                  <input type="number" id="dealMaxThreshold" style={{width: "95%", backgroundColor: "beige"}} value={this.state.FormMaxThreshold} onChange={(e)=>{this.setState({FormMaxThreshold: e.target.value})}} />
                  </div>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "right", paddingRight:"0.5em"}}>
                    Gas Target (between 100 and 500):&ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "20%", textAlign : "left"}}>
                    <input type="number" id="dealGasTarget" style={{width: "95%", backgroundColor: "beige"}} value={this.state.FormGasResistance} onChange={(e)=>{this.setState({FormGasResistance: e.target.value})}} />
                  </div>
                </div>
                <div className="mini-columns" style = {{marginTop: "0.5em", marginBottom: "0.25em"}}>
                  <div className = "mini-cols" style={{width : "45%"}}></div>
                  <Button variant="primary" size = "md" onClick={(event) => this.InitiateDeal(event)}>Initiate Deal</Button>
                  <div className = "mini-cols" style={{width : "40%"}}></div>
                </div>
              </div>
            </div>

            <div className="cols" style={{width: "49%"}}>
              <div className="mini-container">
                <div className="mini-columns">
                  <h4 style={{textAlign : "center", width: "100%"}}><em><u>Deals Originated by You</u></em></h4>
                </div>
                <div className = "mini-columns">
                  <div className = "mini-cols" style={{width : "1%"}}></div>
                  <div className = "mini-cols" style={{width : "96%", maxHeight: "150px", overflowY: "scroll", backgroundColor: "gainsboro"}}>
                    <Table striped bordered hover size="sm" >
                      <thead>
                        <tr>
                          <th>UUID</th>
                          <th>Company address</th>
                          <th>Company ID</th>
                        </tr>
                      </thead>
                      <tbody style={{fontSize : "93%"}}>
                        {parse(`${this.state.originatorString}`)}
                      </tbody>        
                    </Table>
                  </div>
                  <div className = "mini-cols" style={{width : "1%"}}></div>
                </div>
                <div className="mini-columns" style = {{paddingTop: "0.65em", paddingBottom: "0.25em"}}>
                  <div className = "mini-cols" style={{width : "35%", textAlign : "right"}}>
                    <Button variant="info" size = "md" style= {{width : "95%"}} onClick={(event) => this.DealSearchByAddress(event)}>Search for Deals by Address</Button> &ensp;
                  </div>
                  <div className = "mini-cols" style={{width : "60%", textAlign : "left"}}>
                    <input type="text" id="AddressDealSearch" style={{width: "95%", backgroundColor: "beige"}} value={this.state.AddressDealSearch} onChange={(e)=>{this.setState({AddressDealSearch: e.target.value})}} />
                  </div>
                </div>
                <div className="mini-columns" style = {{paddingTop: "0.25em", paddingBottom: "0.25em", display: this.state.AddressDealSearchResult.length===0 ? "none" : "block"}}>
                  <div className = "mini-cols" style={{width : "100%", textAlign : "center"}}>
                    {parse(`${this.state.AddressDealSearchResult}`)}
                  </div>
                </div>    
              </div>
            </div>
            <div className="cols" style={{width: "1%"}}></div>

          </div>

          <div className="columns" style={{margin:"2em"}}>
            <div className="cols" style={{width: "10%", textAlign: "center"}}></div>
            <div className="cols" style={{width: "25%", textAlign: "right"}}>
              UUID to verify:&ensp;
            </div>
            <div className="cols" style={{width: "30%", textAlign: "left"}}>
              <input type="text" id="UUIDforVerify" style={{width: "95%", backgroundColor: "beige"}} value={this.state.UUIDVerify} onChange={(e)=>{this.setState({UUIDVerify: e.target.value})}} />
            </div>
		        <div className="cols" style={{width: "20%", textAlign: "left"}}>
              <Button variant="primary" size = "md" onClick={(event) => this.runPebbleSimulatorVerify(event)}>Get Verify Data</Button>
              </div>
            <div className="cols" style={{width: "10%", textAlign: "center"}}></div>
          </div>
          <div className="columns" >
            <div className="cols" style={{width: "40%", textAlign: "center"}}></div>
            <div className="cols" style={{width: "20%", textAlign: "center"}}>
              <Button variant="danger" size = "md" style = {{display : this.state.primedVerify ? "block" : "none"}} onClick={(event) => this.VerifyDealData(event)}>Verify</Button>
            </div>
            <div className="cols" style={{width: "40%", textAlign: "center"}}></div>
          </div>
          
      </div>
    );
  }
}
export default App;
