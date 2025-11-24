import { Router } from "express";
import { body, validationResult } from "express-validator";
import { issueNonce, verifySignature } from "../services/auth.service";

export const authRouter = Router();

authRouter.get("/nonce", async (req, res) => {
  const { address } = req.query;
  if (!address || typeof address !== "string") {
    return res.status(400).json({ success: false, message: "Address is required" });
  }
  const nonce = await issueNonce(address);
  return res.json({ success: true, nonce });
});

authRouter.post(
  "/verify",
  [body("address").isString(), body("signature").isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { address, signature } = req.body;
    try {
      const token = await verifySignature(address, signature);
      return res.json({ success: true, token });
    } catch (error) {
      return res.status(401).json({ success: false, message: (error as Error).message });
    }
  }
);
