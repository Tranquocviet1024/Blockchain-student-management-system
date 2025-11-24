import { ethers } from "ethers";
import { StudentPayload, StudentRecord } from "../types";
import db from "../db/database";

interface FeeMetadata {
  feeTxHash?: string;
  feeAmountWei?: string;
}

function hashStudentId(studentId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(studentId.trim().toLowerCase()));
}

function hashPayload(payload: StudentPayload): string {
  const ordered = {
    studentId: payload.studentId,
    fullName: payload.fullName,
    className: payload.className,
    birthday: payload.birthday ?? null,
    guardian: payload.guardian ?? null,
    notes: payload.notes ?? null
  };
  return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(ordered)));
}

export function listStudents(): StudentRecord[] {
  const rows = db.prepare("SELECT * FROM students").all() as any[];
  return rows.map((row) => ({
    studentId: row.studentId,
    fullName: row.fullName,
    className: row.className,
    birthday: row.birthday,
    guardian: row.guardian,
    notes: row.notes,
    status: row.status,
    isActive: Boolean(row.isActive),
    dataHash: row.dataHash,
    studentIdHash: row.studentIdHash,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
    lastFeeTxHash: row.lastFeeTxHash,
    lastFeeAmountWei: row.lastFeeAmountWei
  }));
}

export function getStudent(studentId: string): StudentRecord | undefined {
  const row = db.prepare("SELECT * FROM students WHERE studentId = ?").get(studentId) as any;
  if (!row) return undefined;
  return {
    studentId: row.studentId,
    fullName: row.fullName,
    className: row.className,
    birthday: row.birthday,
    guardian: row.guardian,
    notes: row.notes,
    status: row.status,
    isActive: Boolean(row.isActive),
    dataHash: row.dataHash,
    studentIdHash: row.studentIdHash,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
    lastFeeTxHash: row.lastFeeTxHash,
    lastFeeAmountWei: row.lastFeeAmountWei
  };
}

export function upsertStudent(
  payload: StudentPayload,
  actor: string,
  fee?: FeeMetadata
): StudentRecord {
  const dataHash = hashPayload(payload);
  const studentIdHash = hashStudentId(payload.studentId);
  const now = new Date().toISOString();

  const record: StudentRecord = {
    ...payload,
    status: "active",
    isActive: true,
    dataHash,
    studentIdHash,
    updatedAt: now,
    updatedBy: actor,
    lastFeeTxHash: fee?.feeTxHash,
    lastFeeAmountWei: fee?.feeAmountWei
  };

  const stmt = db.prepare(`
    INSERT INTO students (
      studentId, fullName, className, birthday, guardian, notes,
      status, isActive, dataHash, studentIdHash, updatedAt, updatedBy,
      lastFeeTxHash, lastFeeAmountWei
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(studentId) DO UPDATE SET
      fullName = excluded.fullName,
      className = excluded.className,
      birthday = excluded.birthday,
      guardian = excluded.guardian,
      notes = excluded.notes,
      status = excluded.status,
      isActive = excluded.isActive,
      dataHash = excluded.dataHash,
      studentIdHash = excluded.studentIdHash,
      updatedAt = excluded.updatedAt,
      updatedBy = excluded.updatedBy,
      lastFeeTxHash = excluded.lastFeeTxHash,
      lastFeeAmountWei = excluded.lastFeeAmountWei
  `);

  stmt.run(
    record.studentId,
    record.fullName,
    record.className,
    record.birthday ?? null,
    record.guardian ?? null,
    record.notes ?? null,
    record.status,
    record.isActive ? 1 : 0,
    record.dataHash,
    record.studentIdHash,
    record.updatedAt,
    record.updatedBy,
    record.lastFeeTxHash ?? null,
    record.lastFeeAmountWei ?? null
  );

  return record;
}

export function deactivateStudent(
  studentId: string,
  actor: string,
  fee?: FeeMetadata
): StudentRecord {
  const record = getStudent(studentId);
  if (!record) {
    throw new Error("Student not found");
  }

  const updated: StudentRecord = {
    ...record,
    status: "inactive",
    isActive: false,
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
    lastFeeTxHash: fee?.feeTxHash,
    lastFeeAmountWei: fee?.feeAmountWei
  };

  const stmt = db.prepare(`
    UPDATE students SET
      status = ?,
      isActive = ?,
      updatedAt = ?,
      updatedBy = ?,
      lastFeeTxHash = ?,
      lastFeeAmountWei = ?
    WHERE studentId = ?
  `);

  stmt.run(
    updated.status,
    updated.isActive ? 1 : 0,
    updated.updatedAt,
    updated.updatedBy,
    updated.lastFeeTxHash ?? null,
    updated.lastFeeAmountWei ?? null,
    studentId
  );

  return updated;
}
