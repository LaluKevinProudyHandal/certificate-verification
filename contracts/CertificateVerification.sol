// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateVerification {
    struct Certificate {
        string recipientName;
        string eventName;
        string issueDate;
        address issuer;
        bool isValid;
    }
    
    mapping(bytes32 => Certificate) public certificates;
    mapping(address => bool) public authorizedIssuers;
    
    address public owner;
    
    event CertificateIssued(bytes32 indexed certificateHash, string recipientName, string eventName);
    event CertificateRevoked(bytes32 indexed certificateHash);
    
    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }
    
    modifier onlyAuthorized() {
        require(authorizedIssuers[msg.sender], "Not authorized to issue certificates");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    function addAuthorizedIssuer(address _issuer) public onlyOwner {
        authorizedIssuers[_issuer] = true;
    }
    
    function issueCertificate(
        string memory _recipientName,
        string memory _eventName,
        string memory _issueDate
    ) public onlyAuthorized returns (bytes32) {
        bytes32 certificateHash = keccak256(
            abi.encodePacked(_recipientName, _eventName, _issueDate, msg.sender, block.timestamp)
        );
        
        certificates[certificateHash] = Certificate({
            recipientName: _recipientName,
            eventName: _eventName,
            issueDate: _issueDate,
            issuer: msg.sender,
            isValid: true
        });
        
        emit CertificateIssued(certificateHash, _recipientName, _eventName);
        return certificateHash;
    }
    
    function verifyCertificate(bytes32 _certificateHash) public view returns (
        string memory recipientName,
        string memory eventName,
        string memory issueDate,
        address issuer,
        bool isValid
    ) {
        Certificate memory cert = certificates[_certificateHash];
        return (cert.recipientName, cert.eventName, cert.issueDate, cert.issuer, cert.isValid);
    }
    
    function revokeCertificate(bytes32 _certificateHash) public onlyAuthorized {
        require(certificates[_certificateHash].issuer == msg.sender, "Can only revoke own certificates");
        certificates[_certificateHash].isValid = false;
        emit CertificateRevoked(_certificateHash);
    }
    
    function getAllCertificateHashes() public pure returns (bytes32[] memory) {
        // Implementasi sederhana - dalam production perlu pagination
        // Untuk demo, kita return array kosong saja
        bytes32[] memory empty;
        return empty;
    }
}