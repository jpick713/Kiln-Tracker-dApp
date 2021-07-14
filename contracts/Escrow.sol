pragma solidity >=0.5.0 <0.9.0;

import './Owner.sol';

contract Escrow is Owner {
    //Storage variables
    address public storageContract;
    address[2] public addressesCheck;
    mapping (address => bool) public whiteList;
    mapping (address => bool) public blackList; //addresses which canot be added to whitelist
    mapping (address => bool) public adminMap;
    mapping (bytes32 => VerifyInfo) public verificationInfo;


    event Received(address indexed _sender, uint _amount);
    event BlackListAddition(address indexed _deviceAddress, string _reason);
    event WhiteListAddition(address indexed _deviceAddress, address indexed _approver);
    event AdminAdded(address indexed _added);

    struct VerifyInfo {
        address payable companyAddress;
        bytes32 UUID;
        uint256 dealBalance;
        //string deviceIMEI; ///IMEI for device that will be at location
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

    constructor() public {
            adminMap[msg.sender] = true;
    }

    modifier onlyStorageContract(){
        require(msg.sender == storageContract);
        _;
    }

    modifier onlyAdmin(){
        require (adminMap[msg.sender], "only admin");
        _;
    }

    /*receive() external payable {
        emit Received(msg.sender, msg.value);
    } */ //newer version of solidity   

    function() external payable {
        require(msg.value > 0);
        emit Received(msg.sender, msg.value);
    }

    function getBalance() public view returns(uint){
        return address(this).balance;
    }

    function setStorageContract(address _storageContract) public isOwner{
        storageContract = _storageContract;
    }

    function addAdmin (address _addedAdmin) onlyStorageContract external {
        adminMap[_addedAdmin] = true;
        emit AdminAdded(_addedAdmin);
    }

    function triggerPayout(address _to, uint _amount) external onlyStorageContract{
        require(_to !=address(0), "Invalid address");
        require(address(this).balance >= _amount);
        //(bool sent, bytes memory data) = _to.call.value(_amount);
        (bool sent, bytes memory data) = _to.call.value(_amount)("");
        require(sent, "Transaction failed");
    }

    function addToWhiteList (address _deviceAddress) public onlyAdmin{
        require(!whiteList[_deviceAddress], "address on WhiteList");
        require(!blackList[_deviceAddress], "address banned");
        whiteList[_deviceAddress] = true;
        
        emit WhiteListAddition(_deviceAddress, msg.sender);
    }

    function addToBlackList (address _deviceAddress, string memory _reason) public isOwner{
        require(!blackList[_deviceAddress], "address already banned");
        whiteList[_deviceAddress] = false;
        blackList[_deviceAddress] = true;
        emit BlackListAddition(_deviceAddress, _reason);
    }

    function checkSimulatorAddress (string memory jsonString, bytes32 r , bytes32 s) public {
        //bytes32 testHash = keccak256(bytes(jsonString));
        //string memory jsonString = '{"message":{"snr":78,"vbat":2.21924,"latitude":4605.29358,"longitude":5352.96463,"gasResistance":10,"temperature":33.19269,"pressure":1555.48425,"humidity":68.59576,"light":1762.69028,"temperature2":45.26462,"gyroscope":[14,-1808,-10],"accelerometer":[2689,1808,3466],"timestamp":"1626009053476","random":"ba5a38466233a778"}}';
        bytes32 testHash = keccak256(abi.encodePacked(jsonString));
        address _deviceAddress;
        bool onWhiteList = false;
        for (uint8 v=27 ; v<29; v++){
            _deviceAddress = ecrecover(testHash, v, r, s);
            addressesCheck[v-27]= _deviceAddress;
                      
        } 
    }

    function returnSimulatorAddresses() public view returns(address[2] memory){
        return addressesCheck;
    }

    function setDealVerify(address payable _companyAddress, bytes32 _UUID, uint[] memory intInfo) public onlyStorageContract {
            verificationInfo[_UUID] = VerifyInfo({
            companyAddress : _companyAddress,
            UUID : _UUID,
            paidOut: false,
            dealBalance: intInfo[0],
            timeStart : uint48(intInfo[6]),
            timeEnd : uint48(intInfo[1]),
            failedVerifyCount : 0,
            totalCurrentCount : 0,
            totalCountsAllowed : uint32(intInfo[2]),
            minThreshold : uint24(intInfo[3]), 
            maxThreshold : uint32(intInfo[4]),
            gasResistanceTarget : uint16(intInfo[5])
            });
    }

}