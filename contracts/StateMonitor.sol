pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import './Owner.sol';
import './Escrow.sol';

contract StateMonitor is Owner {
    //Storage variables

    address[] public admins; ///could make multisig as option, but for competition any admin can initiate agreements
    mapping (address => bool) public adminMap; ///make multisig as option, but for competiton any admin can initiate agreements
    //mapping (address => bool) public whiteList; ///whiteList of device addresses that are trusted to Transmit data
    //mapping (address => bool) public blackList; //addresses which canot be added to whitelist
    address public escrow; ///escrow address (either trusted third-party or another contract controlled by government finance agency)
    Escrow public escrowContract; ///escrow contract deployed with this contract
    mapping (string => Device) public deviceIMEIs; ///allows for quick retrieval of device info from deviceIMEIs
    mapping (address => Device[]) public deviceOwners; ///allows for convenient retrieval of devices by owner address
    mapping (address => Deal[]) public dealsOriginator; ///deals in which the address is lead_admin, if multisig, can be just any admins
    mapping (bytes32 => Deal) public deals; ///maps deal Id to deals
    mapping (address => Deal[]) public dealsByCompanyAddress;///maps address of wallet (of company or whatever entity is on other side of deal) to deal
    Deal[] public allDeals; ///will allow to iterate through all deals if loss of uuid, for convenience, should scan events by company name or ID
    //mapping (bytes32 => DealInfo) public dealsInfo; ///DealInfo mapping from uuid to all dealInfo. 

    //Events

    
    event DeviceRegistered(address indexed _deviceOwner, string indexed _IMEI);
    //event WhiteListAddition(address indexed _deviceAddress, address indexed _approver);
    event DealInitiated(address _originator, string indexed _companyID, bytes32 indexed _uuid);
    event Received(address _sender, uint _amount);
    event DeviceDeleted(address indexed _deviceOwner, string _IMEI);
    //event DealAdminAddedUUID(address indexed _addressAdded, bytes32 indexed _UUID);
    
    //Modifiers

    modifier onlyAdmin(){
        require (adminMap[msg.sender], "only admin");
        _;
    }

    struct Device{
        address deviceOwner;
        string IMEI;
        ///string did; would be used along with DID device manager 
        string privKey; //only for simulator, real pebble tracker remove!
        address deviceAddress;//real pebble tracker this is know when registered
        bool exists;
    }

    struct Deal{
        address originator;
        //address [] dealAdmins; ///if using multi-sig or just want multiple addresses able to access these
        address payable companyAddress; ///address that rewards will be paid to
        bool isActive; ///Is the deal still active?
        bytes32 uuid; ///ID of deal
        string companyID; ///Id to identify company being monitored
        //string companyName; ///company name
        //DealInfo dealInformation;///Deal Information packed in struct to prevent too deep in stack
    }

    /*
    struct DealInfo{
        
        bytes32 dealUUID;
        uint256 dealBalance; ///money put into escrow by governing agency for this part of deal
        string deviceIMEI; ///IMEI for device that will be at location
        bool paidOut; ///flag to see if pay out has been given or not
        ///Struct Packing rest of integers
        uint48 timeStart; ///start of Deal
        uint48 timeEnd; /// end of Deal
        uint24 failedVerifyCount; ///failed verifications
        uint32 totalCurrentCount; ///total current verifications
        uint32 totalCountsAllowed; ///number of data points to be validated
        uint24 minThreshold; ///minimum number of successful validations to start receiving reward
        uint32 maxThreshold; ///number of successful validations to receive full reward;
        uint16 gasResistanceTarget; ///target reading that is max acceptable air quality
        
    }
    */

    constructor (address payable _escrow) public{  
        require (_escrow != address(0), "zero addr");
        require (_escrow != msg.sender, "can't be owner");
        escrow = _escrow;
        escrowContract = Escrow(_escrow);
        admins.push(msg.sender);
        adminMap[msg.sender] = true;

    }

    /*receive() external payable {
        require(msg.value >0);
        emit Received(msg.sender, msg.value);
    }*/

    function() external payable {
        require(msg.value > 0);
        emit Received(msg.sender, msg.value);
    }
    
    function getAllAdmins() public view returns(address[] memory){
        return admins;
    }

    function getAllOwnersDevices(address _address) public view returns(Device[] memory){
        return deviceOwners[_address];
    }

    function getOriginatorsDeals(address _address) public view returns(Deal[] memory){
        return dealsOriginator[_address];
    }

    function getCompanyDeals(address _address) public view returns(Deal[] memory){
        return dealsByCompanyAddress[_address];
    }

    

    /*
    * Add Admins to State Contract
    * Note this is different than individual deal Admins!
    * These admins can initiate deals and whitelist devices, but unless explicitly added on other admin deals
    * then they cannot edit other admin's deals
    */

    function addAdmin (address _addedAdmin) isOwner public {
        require(_addedAdmin != address(0), "invalid address");
        require(!adminMap[_addedAdmin], "address already Admin");
        adminMap[_addedAdmin] = true;
        admins.push(_addedAdmin);
        escrowContract.addAdmin(_addedAdmin);
        
    }

    /*
    * Easiest for a manufacturer/owner of a pebble tracker to pass or search
    * IMEIs since those are on the device. In a real world situation without the
    * simulator making data, privKey would NOT be passed!!! This is passed only
    * so that simulator script can make sure to be consistent on a device that was already
    * registered. 
    */

    function registerDevice (string memory _IMEI, string memory _privKey, address _deviceAddress) public {
        require(!deviceIMEIs[_IMEI].exists, "device is already registered!");
        Device memory deviceToAdd = Device({
            deviceOwner : msg.sender,
            IMEI : _IMEI,
            privKey : _privKey,
            exists : true,
            deviceAddress : _deviceAddress
        });
        deviceIMEIs[_IMEI] = deviceToAdd;
        deviceOwners[msg.sender].push(deviceToAdd);
        emit DeviceRegistered(msg.sender, _IMEI);
    }

    // Device Owner can delete a device which will set the mapping key back to the default struct
    function deleteDevice (string memory _IMEI) public {
        require(deviceIMEIs[_IMEI].exists, "Device not in registry");
        require(msg.sender == deviceIMEIs[_IMEI].deviceOwner, "must be device or contract owner");
        Device[] storage devicesArray = deviceOwners[msg.sender];
        for (uint i=0; i<devicesArray.length; i++){
            if(keccak256(abi.encode(devicesArray[i].IMEI)) == keccak256(abi.encode(_IMEI))){
                devicesArray[i] = devicesArray[devicesArray.length-1];
                devicesArray.pop();
                deviceOwners[msg.sender] = devicesArray;
                break;
            }
        }
        deviceIMEIs[_IMEI] = Device({
            deviceOwner : address(0),
            IMEI : "",
            privKey : "",
            exists : false,
            deviceAddress : address(0)
        });
        emit DeviceDeleted(msg.sender, _IMEI);
    }

    /** 
    * could use onlyOwner modifier or multiSig for adding to Whitelist, but for 
    * contest leaving as onlyAdmin so any admin can add to Whitelist
    **/
    /*
    function addToWhiteList (address _deviceAddress) public onlyAdmin{
        require(!whiteList[_deviceAddress], "address on WhiteList");
        require(!blackList[_deviceAddress], "address banned");
        whiteList[_deviceAddress] = true;
        
        emit WhiteListAddition(_deviceAddress, msg.sender);
    }

    function addToBlackList (address _deviceAddress, string memory _reason) public isOwner{
        require(!blackList[_deviceAddress], "address banned");
        whiteList[_deviceAddress] = false;
        blackList[_deviceAddress] = true;
        
    }*/

    /*
    * Initiating a Deal involves an amount of money put in escrow account address
    * Then when deal is complete, depending on if the company being monitored successfully passed
    * enough verified data within valid timeframe, then payout is issued.
    */

    function initiateDeal (address payable _companyAddress, string memory _companyID, uint[] memory dealInfoParams, string memory _deviceIMEI) public onlyAdmin{
        require (dealInfoParams[1] > dealInfoParams[6], "Invalid End Time");
        require (address(this).balance >= dealInfoParams[0], "insufficient funds");
        require (_companyAddress != address(0), "invalid company addr");
        require (dealInfoParams[4] >= dealInfoParams[3], "max >= min");
        require (dealInfoParams[4] <= dealInfoParams[2], "Threshold values <= total count");
        require (deviceIMEIs[_deviceIMEI].exists, "device not registered");

        //address[] memory initialArray;
        //bytes32 newUUID = keccak256(abi.encodePacked(msg.sender, block.timestamp)); //Use this when not on ganache
        bytes32 newUUID = keccak256(abi.encodePacked(msg.sender, dealInfoParams[6]));

        Deal memory dealToAdd = Deal({
            originator : msg.sender,
            companyAddress : _companyAddress,
            uuid : newUUID,
            isActive : true,
            companyID : _companyID
        });
        dealsOriginator[msg.sender].push(dealToAdd);
        deals[dealToAdd.uuid] = dealToAdd;
        dealsByCompanyAddress[_companyAddress].push(dealToAdd);
        //dealsInfo[newUUID] = newDealInfo;
        sendToEscrow(dealInfoParams[0]);
        escrowContract.setDealVerify(_companyAddress, newUUID, dealInfoParams);

        emit DealInitiated(msg.sender, _companyID, dealToAdd.uuid);
    }

    /*
    function setDealInfo(bytes32 _dealUUID, string memory _deviceIMEI, uint[] memory intInfo) internal returns (DealInfo memory){
        DealInfo memory dealInfoRet = DealInfo({
            dealUUID: _dealUUID,
            deviceIMEI : _deviceIMEI,
            paidOut: false,
            dealBalance: intInfo[0],
            timeStart : uint48(block.timestamp),
            timeEnd : uint48(intInfo[1]),
            failedVerifyCount : 0,
            totalCurrentCount : 0,
            totalCountsAllowed : uint32(intInfo[2]),
            minThreshold : uint24(intInfo[3]), 
            maxThreshold : uint32(intInfo[4]),
            gasResistanceTarget : uint16(intInfo[6])
        });
        return dealInfoRet;
    }
    */


    //If you want admin to be per deal uncomment this functions and the admins[]
    /*
    function addDealAdminUUID(address _addressToAdd, bytes32 _UUID) public {
        require(_UUID.length>0, "invalid UUID");
        require (deals[_UUID].uuid == _UUID, "UUID invalid");
        require(deals[_UUID].isActive, "Inactive deal");
        require(_addressToAdd != address(0), "zero address");
        bool alreadyDealAdmin = false;
        for (uint i = 0; i< deals[_UUID].dealAdmins.length; i++){
            if(_addressToAdd == deals[_UUID].dealAdmins[i]){
                alreadyDealAdmin = true;
                break;
            }
        require(!alreadyDealAdmin, "already deal admin");
        deals[_UUID].dealAdmins.push(_addressToAdd);
        emit DealAdminAddedUUID(_addressToAdd, _UUID);
        }
    }*/


    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    //sends money to escrow contract for safe-keeping
    function sendToEscrow(uint _amount) private onlyAdmin{
        // Call returns a boolean value indicating success or failure.
        (bool sent, bytes memory data) = escrow.call.value(_amount)("");
        require(sent, "Failed to send");
    }

    function triggerEscrow(address _to, uint _amount) private onlyAdmin{
        require(address(escrow).balance >= _amount, "Not enough in escrow");
        require(_to != address(0), "invalid address");
        escrowContract.triggerPayout(_to, _amount);
        //bytes memory payload = abi.encodeWithSignature("triggerPayout(address, uint)", _to, _amount);
        //(bool success, bytes memory returnData) = address(escrow).call(payload);
        //require(success);
    }
}