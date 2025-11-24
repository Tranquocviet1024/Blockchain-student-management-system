import { ethers } from "ethers";
import registryAbi from "../config/registryAbi.json";

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
    return receipt.hash as string;
  } catch (error) {
    console.error("Blockchain deactivate failed", error);
    return undefined;
  }
}

export function getReadContract() {
  const { read } = ensureContracts();
  return read;
}

export function getJsonRpcProvider() {
  return getProvider();
}
