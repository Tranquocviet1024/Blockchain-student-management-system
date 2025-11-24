import { ethers } from "ethers";

const INITIAL_BALANCE_ETH = "10000";
let currentBalanceWei = ethers.parseEther(INITIAL_BALANCE_ETH);

/**
 * Get current virtual balance in ETH
 */
export function getBalance(): string {
  return ethers.formatEther(currentBalanceWei);
}

/**
 * Get current virtual balance in Wei
 */
export function getBalanceWei(): bigint {
  return currentBalanceWei;
}

/**
 * Deduct fee from virtual balance
 * @param amountWei - Amount to deduct in Wei
 * @throws Error if insufficient balance
 */
export function deductFee(amountWei: bigint): void {
  if (currentBalanceWei < amountWei) {
    throw new Error(
      `Insufficient virtual balance. Current: ${ethers.formatEther(currentBalanceWei)} ETH, Required: ${ethers.formatEther(amountWei)} ETH`
    );
  }
  currentBalanceWei -= amountWei;
}

/**
 * Reset balance to initial value (10,000 ETH)
 */
export function resetBalance(): void {
  currentBalanceWei = ethers.parseEther(INITIAL_BALANCE_ETH);
}

/**
 * Get balance info including ETH and Wei formats
 */
export function getBalanceInfo() {
  return {
    balanceEth: ethers.formatEther(currentBalanceWei),
    balanceWei: currentBalanceWei.toString(),
    initialBalanceEth: INITIAL_BALANCE_ETH
  };
}
