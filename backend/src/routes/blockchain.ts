import { Router } from "express";
import { getJsonRpcProvider, getReadContract } from "../services/blockchain.service";
import db from "../db/database";

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
    const rows = db.prepare(`
      SELECT * FROM blockchain_events
      ORDER BY blockNumber DESC, logIndex DESC
      LIMIT 100
    `).all() as any[];

    console.log(`/events endpoint: Found ${rows.length} events in database`);

    const events = rows.map((row) => {
      const args: Record<string, unknown> = {};
      if (row.studentIdHash) args.studentIdHash = row.studentIdHash;
      if (row.dataHash) args.dataHash = row.dataHash;
      if (row.actor) args.actor = row.actor;
      if (row.account) args.account = row.account;
      if (row.grantedBy) args.grantedBy = row.grantedBy;
      if (row.revokedBy) args.revokedBy = row.revokedBy;

      return {
        event: row.eventName,
        args,
        blockNumber: row.blockNumber,
        transactionHash: row.transactionHash,
        logIndex: row.logIndex
      };
    });

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

blockchainRouter.get("/history", async (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM blockchain_events
      ORDER BY blockNumber DESC, logIndex DESC
      LIMIT 25
    `).all() as any[];

    const provider = getJsonRpcProvider();

    const history = await Promise.all(
      rows.map(async (row) => {
        const args: Record<string, unknown> = {};
        if (row.studentIdHash) args.studentIdHash = row.studentIdHash;
        if (row.dataHash) args.dataHash = row.dataHash;
        if (row.actor) args.actor = row.actor;
        if (row.account) args.account = row.account;
        if (row.grantedBy) args.grantedBy = row.grantedBy;
        if (row.revokedBy) args.revokedBy = row.revokedBy;

        try {
          const [tx, receipt] = await Promise.all([
            provider.getTransaction(row.transactionHash),
            provider.getTransactionReceipt(row.transactionHash)
          ]);

          return {
            hash: row.transactionHash,
            event: row.eventName,
            args,
            blockNumber: row.blockNumber,
            timestamp: row.timestamp,
            from: tx?.from ?? null,
            to: tx?.to ?? null,
            status: receipt?.status === 1 ? "success" : receipt ? "failed" : "pending",
            gasUsed: receipt?.gasUsed?.toString() ?? null
          };
        } catch {
          // If transaction not found on chain (node restarted), use stored data
          return {
            hash: row.transactionHash,
            event: row.eventName,
            args,
            blockNumber: row.blockNumber,
            timestamp: row.timestamp,
            from: null,
            to: null,
            status: "success",
            gasUsed: null
          };
        }
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

blockchainRouter.get("/balance/history/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const rows = db.prepare(`
      SELECT * FROM wallet_balances
      WHERE address = ?
      ORDER BY timestamp DESC
      LIMIT 50
    `).all(address) as any[];

    const history = rows.map((row) => ({
      id: row.id,
      balance: row.balance,
      previousBalance: row.previousBalance,
      changeAmount: row.changeAmount,
      changeType: row.changeType,
      transactionHash: row.transactionHash,
      timestamp: row.timestamp,
      description: row.description
    }));

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});
