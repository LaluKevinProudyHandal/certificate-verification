const hre = require("hardhat");

async function main() {
  console.log("Deploying CertificateVerification contract...");
  
  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const certificate = await CertificateVerification.deploy();
  
  await certificate.waitForDeployment();
  
  const contractAddress = await certificate.getAddress();
  console.log("CertificateVerification deployed to:", contractAddress);
  
  // Save contract address and ABI for API use
  const fs = require('fs');
  const contractInfo = {
    address: contractAddress,
    abi: certificate.interface.format('json')
  };
  
  fs.writeFileSync('contract-info.json', JSON.stringify(contractInfo, null, 2));
  console.log("Contract info saved to contract-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });