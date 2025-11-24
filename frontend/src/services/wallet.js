import axios from "axios";
import { BrowserProvider, parseEther } from "ethers";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const MUTATION_FEE_ETH = import.meta.env.VITE_MUTATION_FEE_ETH || "0.01";
const MUTATION_FEE_RECIPIENT = import.meta.env.VITE_MUTATION_FEE_RECIPIENT || "";

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("Không tìm thấy MetaMask");
  }

  const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });
  const nonceResponse = await axios.get(`${API_BASE}/auth/nonce`, { params: { address } });
  const signature = await window.ethereum.request({
    method: "personal_sign",
    params: [nonceResponse.data.nonce, address]
  });
  const verifyResponse = await axios.post(`${API_BASE}/auth/verify`, { address, signature });
  const token = verifyResponse.data.token;
  localStorage.setItem("token", token);
  localStorage.setItem("address", address);
  return { address, token };
}

export async function payMutationFee() {
  if (!window.ethereum) {
    throw new Error("Không tìm thấy MetaMask");
  }
  if (!MUTATION_FEE_RECIPIENT) {
    throw new Error("Chưa cấu hình địa chỉ thu phí");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const tx = await signer.sendTransaction({
    to: MUTATION_FEE_RECIPIENT,
    value: parseEther(MUTATION_FEE_ETH)
  });
  const receipt = await tx.wait();
  window.dispatchEvent(new Event("wallet:refresh"));
  return receipt?.hash || tx.hash;
}
