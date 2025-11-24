import db from "./database";
import { ethers } from "ethers";

const sampleStudents = [
  {
    studentId: "HS001",
    fullName: "Nguyễn Văn An",
    className: "10A1",
    birthday: "2008-03-15",
    guardian: "Nguyễn Văn Bình",
    notes: "Học sinh giỏi toán"
  },
  {
    studentId: "HS002",
    fullName: "Trần Thị Bích",
    className: "10A1",
    birthday: "2008-05-20",
    guardian: "Trần Văn Cường",
    notes: "Tích cực hoạt động văn nghệ"
  },
  {
    studentId: "HS003",
    fullName: "Lê Hoàng Minh",
    className: "10A2",
    birthday: "2008-01-10",
    guardian: "Lê Văn Dũng",
    notes: "Đội trưởng lớp"
  },
  {
    studentId: "HS004",
    fullName: "Phạm Thu Hà",
    className: "10A2",
    birthday: "2008-07-25",
    guardian: "Phạm Văn Hải",
    notes: "Học sinh xuất sắc môn Anh"
  },
  {
    studentId: "HS005",
    fullName: "Hoàng Đức Nam",
    className: "11B1",
    birthday: "2007-11-08",
    guardian: "Hoàng Văn Khải",
    notes: "Thành viên CLB Robotics"
  },
  {
    studentId: "HS006",
    fullName: "Vũ Thị Mai",
    className: "11B1",
    birthday: "2007-09-18",
    guardian: "Vũ Văn Long",
    notes: "Học bổng học kỳ I"
  },
  {
    studentId: "HS007",
    fullName: "Đỗ Quang Huy",
    className: "11B2",
    birthday: "2007-04-30",
    guardian: "Đỗ Văn Mạnh",
    notes: "Đội tuyển Olympic Hóa học"
  },
  {
    studentId: "HS008",
    fullName: "Bùi Lan Anh",
    className: "11B2",
    birthday: "2007-12-12",
    guardian: "Bùi Văn Nghĩa",
    notes: "Lớp trưởng"
  },
  {
    studentId: "HS009",
    fullName: "Ngô Tuấn Kiệt",
    className: "12C1",
    birthday: "2006-02-22",
    guardian: "Ngô Văn Oanh",
    notes: "Đội trưởng đội bóng đá trường"
  },
  {
    studentId: "HS010",
    fullName: "Đinh Thị Ngọc",
    className: "12C1",
    birthday: "2006-06-05",
    guardian: "Đinh Văn Phúc",
    notes: "Bí thư chi đoàn"
  },
  {
    studentId: "HS011",
    fullName: "Trịnh Văn Sơn",
    className: "12C2",
    birthday: "2006-08-14",
    guardian: "Trịnh Văn Quang",
    notes: "Học sinh tiên tiến"
  },
  {
    studentId: "HS012",
    fullName: "Lý Thị Thanh",
    className: "12C2",
    birthday: "2006-10-03",
    guardian: "Lý Văn Rộng",
    notes: "Đạt giải Nhì Olympic Văn"
  },
  {
    studentId: "HS013",
    fullName: "Phan Đức Toàn",
    className: "10A3",
    birthday: "2008-04-17",
    guardian: "Phan Văn Sáng",
    notes: "Thành viên CLB Guitar"
  },
  {
    studentId: "HS014",
    fullName: "Võ Thị Uyên",
    className: "10A3",
    birthday: "2008-09-28",
    guardian: "Võ Văn Tâm",
    notes: "Học sinh gương mẫu"
  },
  {
    studentId: "HS015",
    fullName: "Dương Minh Tuấn",
    className: "11B3",
    birthday: "2007-03-11",
    guardian: "Dương Văn Ước",
    notes: "Đội tuyển Olympic Tin học"
  }
];

function hashStudentId(studentId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(studentId.trim().toLowerCase()));
}

function hashPayload(payload: any): string {
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

export function seedDatabase() {
  const stmt = db.prepare(`
    INSERT INTO students (
      studentId, fullName, className, birthday, guardian, notes,
      status, isActive, dataHash, studentIdHash, updatedAt, updatedBy,
      lastFeeTxHash, lastFeeAmountWei
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(studentId) DO NOTHING
  `);

  const now = new Date().toISOString();
  let count = 0;

  for (const student of sampleStudents) {
    const dataHash = hashPayload(student);
    const studentIdHash = hashStudentId(student.studentId);
    
    const result = stmt.run(
      student.studentId,
      student.fullName,
      student.className,
      student.birthday,
      student.guardian,
      student.notes,
      "active",
      1,
      dataHash,
      studentIdHash,
      now,
      "system",
      null,
      null
    );

    if (result.changes > 0) {
      count++;
    }
  }

  console.log(`✓ Đã thêm ${count} học sinh mẫu vào database`);
  return count;
}

// Chạy seed nếu file được gọi trực tiếp
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
  db.close();
}
