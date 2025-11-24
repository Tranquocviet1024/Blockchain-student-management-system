import { Router } from "express";
import { getJsonRpcProvider, getReadContract } from "../services/blockchain.service";

export const blockchainRouter = Router();

blockchainRouter.get("/tx/:hash", async (req, res) => {
  const provider = getJsonRpcProvider();
  try {
    const tx = await provider.getTransaction(req.params.hash);
    if (!tx) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    const receipt = await provider.getTransactionReceipt(req.params.hash);
    res.json({
      success: true,
      data: {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        blockNumber: tx.blockNumber,
        status: receipt?.status === 1 ? "success" : receipt ? "failed" : "pending",
        gasUsed: receipt?.gasUsed?.toString() ?? null,
        confirmations: receipt?.confirmations ?? 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

function formatArgs(args: Record<string, unknown> | undefined) {
  if (!args) return {};
  return Object.entries(args).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (!Number.isNaN(Number(key))) {
      return acc;
    }
    if (typeof value === "bigint") {
      acc[key] = value.toString();
    } else if (value && typeof value === "object" && "toString" in value) {
      try {
        acc[key] = (value as { toString(): string }).toString();
      } catch {
        acc[key] = value;
      }
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
}

blockchainRouter.get("/events", async (_req, res) => {
  try {
    const provider = getJsonRpcProvider();
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 5000, 0);
    const contract = getReadContract();
    const filters = [
      contract.filters.RecordAdded(),
      contract.filters.RecordUpdated(),
      contract.filters.RecordDeactivated(),
      contract.filters.TeacherGranted(),
      contract.filters.TeacherRevoked()
    ];

    const eventChunks = await Promise.all(
      filters.map(async (filter) => {
        const logs = await contract.queryFilter(filter, fromBlock);
        return logs.map((evt) => ({
          event: evt.eventName,
          args: formatArgs(evt.args as Record<string, unknown> | undefined),
          blockNumber: evt.blockNumber,
          transactionHash: evt.transactionHash,
          logIndex: evt.logIndex ?? 0
        }));
      })
    );

    const flattened = eventChunks
      .flat()
      .sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
          return (b.logIndex ?? 0) - (a.logIndex ?? 0);
        }
        return (b.blockNumber ?? 0) - (a.blockNumber ?? 0);
      })
      .slice(0, 100);

    res.json({ success: true, data: flattened });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

blockchainRouter.get("/history", async (_req, res) => {
  try {
    const provider = getJsonRpcProvider();
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 5000, 0);
    const contract = getReadContract();
    const filters = [
      contract.filters.RecordAdded(),
      contract.filters.RecordUpdated(),
      contract.filters.RecordDeactivated(),
      contract.filters.TeacherGranted(),
      contract.filters.TeacherRevoked()
    ];

    const eventChunks = await Promise.all(
      filters.map(async (filter) => {
        const logs = await contract.queryFilter(filter, fromBlock);
        return logs.map((evt) => ({
          event: evt.eventName,
          args: formatArgs(evt.args as Record<string, unknown> | undefined),
          blockNumber: evt.blockNumber,
          transactionHash: evt.transactionHash,
          logIndex: evt.logIndex ?? 0
        }));
      })
    );

    const recent = eventChunks
      .flat()
      .sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
          return (b.logIndex ?? 0) - (a.logIndex ?? 0);
        }
        return (b.blockNumber ?? 0) - (a.blockNumber ?? 0);
      })
      .slice(0, 25);

    const uniqueBlocks = Array.from(new Set(recent.map((item) => item.blockNumber).filter(Boolean)));
    const blockMap = new Map<number, number>();
    await Promise.all(
      uniqueBlocks.map(async (blockNumber) => {
        if (typeof blockNumber !== "number") return;
        const block = await provider.getBlock(blockNumber);
        if (block) {
          blockMap.set(blockNumber, block.timestamp);
        }
      })
    );

    const history = await Promise.all(
      recent.map(async (entry) => {
        const [tx, receipt] = await Promise.all([
          provider.getTransaction(entry.transactionHash),
          provider.getTransactionReceipt(entry.transactionHash)
        ]);
        const timestamp = entry.blockNumber ? blockMap.get(entry.blockNumber) : undefined;
        return {
          hash: entry.transactionHash,
          event: entry.event,
          args: entry.args,
          blockNumber: entry.blockNumber,
          timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : null,
          from: tx?.from ?? null,
          to: tx?.to ?? null,
          status: receipt?.status === 1 ? "success" : receipt ? "failed" : "pending",
          gasUsed: receipt?.gasUsed?.toString() ?? null
        };
      })
    );

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

blockchainRouter.get("/balance", async (_req, res) => {
  try {
    const { getBalanceInfo } = await import("../services/balance.service");
    const balanceInfo = getBalanceInfo();
    res.json({ success: true, data: balanceInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});
