import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { requireAuth } from "../middleware/requireAuth";
import {
  listStudents,
  upsertStudent,
  deactivateStudent,
  getStudent
} from "../services/student.service";
import {
  syncRecord,
  deactivateRecord,
  getJsonRpcProvider
} from "../services/blockchain.service";
import { deductFee } from "../services/balance.service";
import { ethers } from "ethers";

export const studentRouter = Router();

studentRouter.use(requireAuth);

studentRouter.get("/", (_req, res) => {
  res.json({ success: true, data: listStudents() });
});

studentRouter.get(
  "/:studentId",
  [param("studentId").isString().notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const student = getStudent(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.json({ success: true, data: student });
  }
);

const studentValidators = [
  body("studentId").isString().notEmpty(),
  body("fullName").isString().notEmpty(),
  body("className").isString().notEmpty(),
  body("birthday").optional().isISO8601(),
  body("guardian").optional().isString(),
  body("notes").optional().isString(),
  body("feeTxHash").isString().notEmpty()
];

const FEE_RECIPIENT = (process.env.FEE_TREASURY_ADDRESS || "").toLowerCase();
const FEE_AMOUNT_WEI = process.env.MUTATION_FEE_WEI
  ? BigInt(process.env.MUTATION_FEE_WEI)
  : ethers.parseEther(process.env.MUTATION_FEE_ETH || "0.01");

if (!FEE_RECIPIENT) {
  console.warn("FEE_TREASURY_ADDRESS is not set; student mutations will fail until configured.");
}

studentRouter.post("/", studentValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const actor = (req as any).user?.address || "unknown";
  const { feeTxHash, ...payload } = req.body;

  try {
    const fee = await verifyMutationFee(feeTxHash, actor);
    const record = upsertStudent(payload, actor, fee);
    const txHash = await syncRecord(record.studentIdHash, record.dataHash);
    const response = { ...record, lastTxHash: txHash };
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
});

studentRouter.put("/:studentId", studentValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  if (req.params.studentId !== req.body.studentId) {
    return res.status(400).json({ success: false, message: "studentId mismatch" });
  }

  const actor = (req as any).user?.address || "unknown";
  const { feeTxHash, ...payload } = req.body;

  try {
    const fee = await verifyMutationFee(feeTxHash, actor);
    const record = upsertStudent(payload, actor, fee);
    const txHash = await syncRecord(record.studentIdHash, record.dataHash);
    const response = { ...record, lastTxHash: txHash };
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
});

studentRouter.put(
  "/:studentId/deactivate",
  [param("studentId").isString().notEmpty(), body("feeTxHash").isString().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const actor = (req as any).user?.address || "unknown";
    try {
      const fee = await verifyMutationFee(req.body.feeTxHash, actor);
      const record = deactivateStudent(req.params.studentId, actor, fee);
      const txHash = await deactivateRecord(record.studentIdHash);
      res.json({ success: true, data: { ...record, lastTxHash: txHash } });
    } catch (error) {
      const status = (error as Error).message.includes("fee") ? 400 : 404;
      res.status(status).json({ success: false, message: (error as Error).message });
    }
  }
);

async function verifyMutationFee(feeTxHash: string, actor: string) {
  if (!feeTxHash) {
    throw new Error("feeTxHash is required");
  }
  if (!FEE_RECIPIENT) {
    throw new Error("Fee recipient not configured on server");
  }
  if (!actor || actor === "unknown") {
    throw new Error("Actor address missing for fee verification");
  }

  const provider = getJsonRpcProvider();
  const tx = await provider.getTransaction(feeTxHash);
  if (!tx) {
    throw new Error("Không tìm thấy giao dịch phí");
  }

  if ((tx.from || "").toLowerCase() !== actor.toLowerCase()) {
    throw new Error("Giao dịch phí không khớp ví đang đăng nhập");
  }

  if (!tx.to || tx.to.toLowerCase() !== FEE_RECIPIENT) {
    throw new Error("Giao dịch phí không gửi đến địa chỉ thu phí");
  }

  if (tx.value < FEE_AMOUNT_WEI) {
    throw new Error("Số ETH gửi không đủ mức phí yêu cầu");
  }

  const receipt = await provider.getTransactionReceipt(feeTxHash);
  if (!receipt || receipt.status !== 1) {
    throw new Error("Giao dịch phí chưa được xác nhận");
  }

  // Deduct from virtual balance
  try {
    deductFee(tx.value);
  } catch (balanceError) {
    throw new Error(`Virtual balance error: ${(balanceError as Error).message}`);
  }

  return {
    feeTxHash,
    feeAmountWei: tx.value.toString()
  };
}
