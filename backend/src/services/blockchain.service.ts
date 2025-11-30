import { ethers } from "ethers";
import registryAbi from "../config/registryAbi.json";
import db from "../db/database";

const RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.REGISTRY_ADDRESS || "";
const PRIVATE_KEY = process.env.DEPLOYER_KEY;

let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Signer | null = null;
let writeContract: ethers.Contract | null = null;
let readContract: ethers.Contract | null = null;

function instantiateContract(connection: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, registryAbi, connection) as unknown as ethers.Contract;
}

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
}

function ensureContracts() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("REGISTRY_ADDRESS missing in environment");
  }
  if (!readContract) {
    readContract = instantiateContract(getProvider());
  }
  if (!writeContract) {
    if (!PRIVATE_KEY) {
      throw new Error("DEPLOYER_KEY missing in environment");
    }
    signer = new ethers.Wallet(PRIVATE_KEY, getProvider());
    writeContract = instantiateContract(signer);
  }
  return { read: readContract!, write: writeContract! };
}

export async function syncRecord(studentIdHash: string, dataHash: string) {
  try {
    const { write } = ensureContracts();
    const tx = await write.upsertRecord(studentIdHash, dataHash);
    const receipt = await tx.wait();
    
    // Save event to database
    await saveEventToDatabase(receipt);
    
    return receipt.hash as string;
  } catch (error) {
    console.error("Blockchain sync failed", error);
    return undefined;
  }
}

export async function deactivateRecord(studentIdHash: string) {
  try {
    const { write } = ensureContracts();
    const tx = await write.deactivate(studentIdHash);
    const receipt = await tx.wait();
    
    // Save event to database
    await saveEventToDatabase(receipt);
    
    return receipt.hash as string;
  } catch (error) {
    console.error("Blockchain deactivate failed", error);
    return undefined;
  }
}

export async function saveEventToDatabase(txHashOrReceipt: string | ethers.TransactionReceipt) {
  try {
    const provider = getProvider();
    
    // If we received a string (txHash), fetch the receipt
    const receipt = typeof txHashOrReceipt === 'string' 
      ? await provider.getTransactionReceipt(txHashOrReceipt)
      : txHashOrReceipt;
    
    if (!receipt) {
      console.warn("No receipt found for transaction");
      return;
    }
    
    console.log(`Saving events from tx ${receipt.hash}, found ${receipt.logs.length} logs`);
    
    const block = await provider.getBlock(receipt.blockNumber);
    const timestamp = block ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString();

    const contract = getReadContract();
    const contractAddress = await contract.getAddress();
    
    let savedCount = 0;
    for (const log of receipt.logs) {
      // Only process logs from our contract
      if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
        continue;
      }
      
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });

        if (!parsed) continue;

        console.log(`Saving event: ${parsed.name} from tx ${receipt.hash}`);

        const stmt = db.prepare(`
          INSERT INTO blockchain_events (
            eventName, transactionHash, blockNumber, logIndex, timestamp,
            studentIdHash, dataHash, actor, account, grantedBy, revokedBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(transactionHash, logIndex) DO NOTHING
        `);

        stmt.run(
          parsed.name,
          receipt.hash,
          receipt.blockNumber,
          log.index,
          timestamp,
          parsed.args.studentIdHash?.toString() ?? null,
          parsed.args.dataHash?.toString() ?? null,
          parsed.args.actor?.toString() ?? null,
          parsed.args.account?.toString() ?? null,
          parsed.args.grantedBy?.toString() ?? null,
          parsed.args.revokedBy?.toString() ?? null
        );
        savedCount++;
      } catch (err) {
        // Skip logs that don't match our contract events
        continue;
      }
    }
    console.log(`Saved ${savedCount} events to database`);
  } catch (error) {
    console.error("Failed to save event to database:", error);
  }
}

export function getReadContract() {
  const { read } = ensureContracts();
  return read;
}

export function getJsonRpcProvider() {
  return getProvider();
}
