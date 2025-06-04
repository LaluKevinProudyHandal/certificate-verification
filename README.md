# Blockchain Certificate Verification System

## Project Overview
Smart contract and REST API system for verifying competition certificates using blockchain technology. This project demonstrates practical blockchain implementation for certificate authenticity verification.

## Features
- ✅ Smart contract for immutable certificate storage
- ✅ Oracle integration for participant validation
- ✅ RESTful API for certificate issuance and verification
- ✅ Local blockchain deployment using Hardhat
- ✅ Comprehensive testing with Postman

## Technology Stack
- **Blockchain**: Hardhat Local Network
- **Smart Contract**: Solidity ^0.8.19
- **Backend**: Node.js + Express.js
- **Web3 Library**: Ethers.js v6
- **Testing**: Postman API testing

## Quick Start
1. Install dependencies: `npm install`
2. Start Hardhat network: `npx hardhat node`
3. Deploy contract: `npx hardhat run scripts/deploy.js --network localhost`
4. Start API server: `npm start`
5. Test with Postman using provided endpoints

## API Endpoints
- `GET /health` - Health check
- `GET /api/events` - Get available events (Oracle data)
- `POST /api/certificates/issue` - Issue new certificate
- `GET /api/certificates/verify/:hash` - Verify certificate

## Project Demo
This system successfully demonstrates:
- Certificate issuance with oracle validation
- Blockchain storage for immutability
- Instant certificate verification
- Fraud prevention through participant checking

## Author
[Lalu Kevin Proudy Handal] - [23/515833/TK/56745]
Final Project - Blockchain Technology Course
Universitas Gadjah Mada - 2025
