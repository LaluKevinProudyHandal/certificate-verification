const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load contract info
const contractInfo = JSON.parse(fs.readFileSync('contract-info.json', 'utf8'));

// Setup provider and contract
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const signer = new ethers.Wallet(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // First hardhat account private key
  provider
);
const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
// Check if contract is deployed
if (!contract) {
  console.error('Contract not found. Please deploy the contract first.');
  process.exit(1);
}

// Simulated off-chain database for oracle data
const offChainDatabase = {
  events: [
    { id: 1, name: "Programming Contest 2024", organizer: "Tech University" },
    { id: 2, name: "Hackathon 2024", organizer: "Dev Community" },
    { id: 3, name: "AI Competition", organizer: "AI Institute" }
  ],
  participants: [
    { eventId: 1, name: "John Doe", rank: 1 },
    { eventId: 1, name: "Jane Smith", rank: 2 },
    { eventId: 2, name: "Bob Johnson", rank: 1 },
    { eventId: 3, name: "Alice Brown", rank: 3 }
  ]
};

// Oracle function - validates participant eligibility
function validateParticipant(eventName, participantName) {
  const event = offChainDatabase.events.find(e => e.name === eventName);
  if (!event) return { valid: false, reason: "Event not found" };
  
  const participant = offChainDatabase.participants.find(
    p => p.eventId === event.id && p.name === participantName
  );
  
  if (!participant) {
    return { valid: false, reason: "Participant not found in event records" };
  }
  
  return { valid: true, participant, event };
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// Get available events (oracle data)
app.get('/api/events', (req, res) => {
  res.json({
    success: true,
    data: offChainDatabase.events
  });
});

// Get participants for an event (oracle data)
app.get('/api/events/:eventId/participants', (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const participants = offChainDatabase.participants.filter(p => p.eventId === eventId);
  
  res.json({
    success: true,
    data: participants
  });
});

// Issue certificate (connects on-chain and off-chain)
app.post('/api/certificates/issue', async (req, res) => {
  try {
    const { recipientName, eventName, issueDate } = req.body;
    
    if (!recipientName || !eventName || !issueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: recipientName, eventName, issueDate'
      });
    }
    
    // Oracle validation - check off-chain data
    const validation = validateParticipant(eventName, recipientName);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${validation.reason}`
      });
    }
    
    // If validation passes, issue certificate on-chain
    console.log('Issuing certificate on blockchain...');
    const tx = await contract.issueCertificate(recipientName, eventName, issueDate);
    const receipt = await tx.wait();
    
    // Extract certificate hash from event logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'CertificateIssued';
      } catch (e) {
        return false;
      }
    });
    
    const certificateHash = event ? contract.interface.parseLog(event).args.certificateHash : null;
    
    res.json({
      success: true,
      message: 'Certificate issued successfully',
      data: {
        certificateHash,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        validation: validation
      }
    });
    
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify certificate
app.get('/api/certificates/verify/:hash', async (req, res) => {
  try {
    const certificateHash = req.params.hash;
    
    console.log('Verifying certificate on blockchain...');
    const result = await contract.verifyCertificate(certificateHash);
    
    if (!result[4]) { // isValid field
      return res.json({
        success: false,
        message: 'Certificate not found or invalid'
      });
    }
    
    // Add oracle data enrichment
    const validation = validateParticipant(result[1], result[0]); // eventName, recipientName
    
    res.json({
      success: true,
      message: 'Certificate is valid',
      data: {
        recipientName: result[0],
        eventName: result[1],
        issueDate: result[2],
        issuer: result[3],
        isValid: result[4],
        oracleValidation: validation
      }
    });
    
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Revoke certificate
app.post('/api/certificates/revoke/:hash', async (req, res) => {
  try {
    const certificateHash = req.params.hash;
    
    console.log('Revoking certificate on blockchain...');
    const tx = await contract.revokeCertificate(certificateHash);
    await tx.wait();
    
    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      data: {
        transactionHash: tx.hash
      }
    });
    
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get contract info
app.get('/api/contract-info', (req, res) => {
  res.json({
    success: true,
    data: {
      address: contractInfo.address,
      network: 'localhost:8545'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Certificate Verification API is running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/events - Get available events`);
  console.log(`   GET  /api/events/:eventId/participants - Get participants`);
  console.log(`   POST /api/certificates/issue - Issue certificate`);
  console.log(`   GET  /api/certificates/verify/:hash - Verify certificate`);
  console.log(`   POST /api/certificates/revoke/:hash - Revoke certificate`);
  console.log(`   GET  /api/contract-info - Get contract information`);
  console.log(`\n📱 Use Postman or curl to test the API`);
});