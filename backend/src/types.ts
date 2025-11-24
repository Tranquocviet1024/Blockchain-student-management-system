export type StudentStatus = "active" | "inactive";

export interface StudentPayload {
  studentId: string;
  fullName: string;
  className: string;
  birthday?: string;
  guardian?: string;
  notes?: string;
}

export interface StudentRecord extends StudentPayload {
  status: StudentStatus;
  isActive?: boolean;
  dataHash: string;
  studentIdHash: string;
  lastTxHash?: string;
  lastFeeTxHash?: string;
  lastFeeAmountWei?: string;
  updatedAt: string;
  updatedBy: string;
}
