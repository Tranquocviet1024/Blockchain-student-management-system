import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";

const pendingNonces = new Map<string, string>();

export async function issueNonce(address: string): Promise<string> {
  const normalized = ethers.getAddress(address);
  const nonce = randomUUID();
  pendingNonces.set(normalized, nonce);
  return nonce;
}

export async function verifySignature(address: string, signature: string): Promise<string> {
  const normalized = ethers.getAddress(address);
  const nonce = pendingNonces.get(normalized);
  if (!nonce) {
    throw new Error("Nonce not found");
  }

  const recovered = ethers.verifyMessage(nonce, signature);
  if (ethers.getAddress(recovered) !== normalized) {
    throw new Error("Signature mismatch");
  }

  pendingNonces.delete(normalized);

  const token = jwt.sign(
    { address: normalized },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "1h" }
  );
  return token;
}
