import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID must be at most 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  // Role is always EMPLOYEE at signup. Admin accounts are created by existing admins.
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// ─── Profile ─────────────────────────────────────────────────────────────────

/** Schema for employee self-edit (limited fields) */
export const employeeProfileUpdateSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  profilePictureUrl: z.string().url().optional().or(z.literal("")),
  about: z.string().max(2000).optional(),
  interests: z.string().max(2000).optional(),
});

/** Schema for admin full-field edit */
export const adminProfileUpdateSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  profilePictureUrl: z.string().url().optional().or(z.literal("")),
});

// ─── Attendance ──────────────────────────────────────────────────────────────

export const attendanceQuerySchema = z.object({
  employeeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  range: z.enum(["daily", "weekly"]).optional().default("weekly"),
});

// ─── Leave ───────────────────────────────────────────────────────────────────

export const leaveRequestSchema = z.object({
  leaveType: z.enum(["PAID", "SICK", "UNPAID"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  remarks: z.string().max(1000).optional(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: "End date must be on or after start date", path: ["endDate"] }
);

export const leaveDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewerComment: z.string().max(1000).optional(),
});

export const leaveQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

// ─── Payroll ─────────────────────────────────────────────────────────────────

export const createSalaryStructureSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  baseSalary: z.number().positive("Base salary must be positive"),
  allowances: z.record(z.number().min(0)).default({}),
  deductions: z.record(z.number().min(0)).default({}),
  effectiveDate: z.string().min(1, "Effective date is required"),
}).refine(
  (data) => {
    const totalAllowances = Object.values(data.allowances).reduce((s, v) => s + v, 0);
    const totalDeductions = Object.values(data.deductions).reduce((s, v) => s + v, 0);
    return data.baseSalary + totalAllowances - totalDeductions >= 0;
  },
  { message: "Net salary cannot be negative" }
);

export const payrollQuerySchema = z.object({
  employeeId: z.string().optional(),
});

// ─── Notifications ───────────────────────────────────────────────────────────

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});
// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  actorId: z.string().optional(),
  targetEntity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});
