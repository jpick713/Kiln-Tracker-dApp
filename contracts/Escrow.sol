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
    event NotOnWhiteList(bytes32 indexed _UUID);
    event DateNotValid(bytes32 indexed _UUID);
    event UncleanLevel(bytes32 _UUID);

    struct VerifyInfo {
        address payable companyAddress;
        bytes32 UUID;
        uint256 dealBalance;
        //string deviceIMEI; ///IMEI for device that will be at location
        bool paidOut; ///flag to see if pay out has been given or not
        ///Struct Packing rest of integers
        uint48 timeStart; ///start of Deal
        uint48 timeEnd; /// end of Deal
        uint24 SuccessVerify; ///successful verifications
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

    function triggerPayout(address payable _to, uint _balance, uint _success, uint _min, uint _max) public payable onlyAdmin{
        require(_to !=address(0), "Invalid address");
        require(address(this).balance >= _balance);
        //(bool sent, bytes memory data) = _to.call.value(_amount);
        uint portion;
        if (_success >= _max){
        (bool sent, bytes memory data) = _to.call.value(_balance)("");
        require(sent, "Transaction failed");
        //_to.transfer(_balance);
        }
        else if(_success>=_min){
            portion = _balance/2 + _balance*(_success-_min)/(2*_max-2*_min);
            //_to.transfer(portion);
            (bool sent, bytes memory data) = _to.call.value(portion)("");
            require(sent, "Transaction failed");
        }  
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

    function checkSimulatorAddress (string memory jsonString, bytes32 r , bytes32 s) public returns (bool){
        bytes32 testHash = keccak256(abi.encodePacked(jsonString));
        address _deviceAddress;
        bool onWhiteList = false;
        for (uint8 v=27 ; v<29; v++){
            _deviceAddress = ecrecover(testHash, v, r, s);
            //addressesCheck[v-27]= _deviceAddress;
            if(whiteList[_deviceAddress]){
                onWhiteList = true;
            }
        }
        return onWhiteList;
    }

    function checkDealInfo (string memory jsonString, bytes32 r , bytes32 s, bytes32 _UUID, uint gasTarget, uint time) public onlyAdmin{
        
        require(!verificationInfo[_UUID].paidOut, "deal already paid out");
        require(verificationInfo[_UUID].totalCurrentCount < verificationInfo[_UUID].totalCountsAllowed, "no more verification allowed");
        verificationInfo[_UUID].totalCurrentCount ++;
        if(!checkSimulatorAddress(jsonString, r, s)){
            emit NotOnWhiteList(_UUID);
        }
        else if(time > verificationInfo[_UUID].timeEnd || time < verificationInfo[_UUID].timeStart){
            emit DateNotValid(_UUID);
        }
        else if (gasTarget > verificationInfo[_UUID].gasResistanceTarget){
            emit UncleanLevel(_UUID);
        }
        else{
            verificationInfo[_UUID].SuccessVerify ++;
        }
        if(verificationInfo[_UUID].totalCurrentCount == verificationInfo[_UUID].totalCountsAllowed){
            triggerPayout(verificationInfo[_UUID].companyAddress, verificationInfo[_UUID].dealBalance, verificationInfo[_UUID].SuccessVerify, verificationInfo[_UUID].minThreshold, verificationInfo[_UUID].maxThreshold);
            verificationInfo[_UUID].paidOut = true;
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
            SuccessVerify : 0,
            totalCurrentCount : 0,
            totalCountsAllowed : uint32(intInfo[2]),
            minThreshold : uint24(intInfo[3]), 
            maxThreshold : uint32(intInfo[4]),
            gasResistanceTarget : uint16(intInfo[5])
            });
    }
}
