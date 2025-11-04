import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, serial, date, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// User storage table - ONLY fields that exist in database
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  role: varchar("role", { enum: ["nurse", "admin", "nursing_home"] }).notNull().default("nurse"),
  
  // Basic fields that exist
  licenseNumber: varchar("license_number"),
  licenseType: varchar("license_type"),
  state: varchar("state"),
  education: text("education"),
  experience: text("experience"),
  references: text("references"),
  certifications: text("certifications"),
  bio: text("bio"),
  
  // Nurse-specific fields that exist
  nurseExperienceYears: integer("nurse_experience_years"),
  nurseEducation: text("nurse_education"),
  nurseCertifications: text("nurse_certifications"),
  nurseReferences: text("nurse_references"),
  nurseSpecialties: text("nurse_specialties"),
  
  // Status fields that exist
  credentialsVerificationStatus: varchar("credentials_verification_status").default("pending"),
  credentialsAdminNotes: text("credentials_admin_notes"),
  backgroundCheckStatus: varchar("background_check_status").default("pending"),
  
  // Nursing home fields that exist
  facilityName: varchar("facility_name"),
  facilityType: varchar("facility_type"),
  facilityLicenseNumber: varchar("facility_license_number"),
  capacity: integer("capacity"),
  servicesOffered: text("services_offered"),
  address: text("address"),
  city: varchar("city"),
  zipCode: varchar("zip_code"),
  facilityPhone: varchar("facility_phone"),
  facilityEmail: varchar("facility_email"),
  website: varchar("website"),
  adminName: varchar("admin_name"),
  adminTitle: varchar("admin_title"),
  establishedYear: integer("established_year"),
  accreditation: text("accreditation"),
  emergencyContact: varchar("emergency_contact"),
  medicaidCertified: boolean("medicaid_certified").default(false),
  medicareCertified: boolean("medicare_certified").default(false),
  verificationDocuments: text("verification_documents"),
  verificationNotes: text("verification_notes"),
  verifiedBy: varchar("verified_by"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  preferredRadius: integer("preferred_radius").default(25),
  isAvailableForShifts: boolean("is_available_for_shifts").notNull().default(true),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").notNull().default(true),
  documents: jsonb("documents").default('[]'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Rest of the schema tables
export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  facilityId: integer("facility_id"),
  description: text("description"),
  requiredCertifications: text("required_certifications"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull(),
  departmentId: integer("department_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  assignedTo: varchar("assigned_to"),
  shiftDate: date("shift_date").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }).notNull(),
  priority: varchar("priority").default("medium"),
  status: varchar("status").default("open"),
  requirements: text("requirements"),
  notes: text("notes"),
  maxApplications: integer("max_applications").default(1),
  careType: varchar("care_type"),
  location: varchar("location"),
  address: text("address"),
  zipCode: varchar("zip_code"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  totalHoursWorked: decimal("total_hours_worked", { precision: 4, scale: 2 }),
  breakDuration: decimal("break_duration", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shiftApplications = pgTable("shift_applications", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull(),
  nurseId: varchar("nurse_id").notNull(),
  status: varchar("status").default("pending"),
  applicationNotes: text("application_notes"),
  adminNotes: text("admin_notes"),
  appliedAt: timestamp("applied_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"),
  relatedShiftId: integer("related_shift_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull(),
  nurseId: varchar("nurse_id").notNull(),
  nursingHomeId: varchar("nursing_home_id").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  nurseAmount: decimal("nurse_amount", { precision: 10, scale: 2 }).notNull(),
  adminFee: decimal("admin_fee", { precision: 10, scale: 2 }),
  notes: text("notes"),
  nursingHomeToAdminStatus: varchar("nursing_home_to_admin_status").default("pending"),
  adminToNurseStatus: varchar("admin_to_nurse_status").default("pending"),
  nursingHomePaidAt: timestamp("nursing_home_paid_at"),
  nursePaidAt: timestamp("nurse_paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdShifts: many(shifts),
  applications: many(shiftApplications),
  notifications: many(notifications),
  payments: many(payments),
}));

export const facilitiesRelations = relations(facilities, ({ many }) => ({
  departments: many(departments),
  shifts: many(shifts),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [departments.facilityId],
    references: [facilities.id],
  }),
  shifts: many(shifts),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [shifts.facilityId],
    references: [facilities.id],
  }),
  department: one(departments, {
    fields: [shifts.departmentId],
    references: [departments.id],
  }),
  creator: one(users, {
    fields: [shifts.createdBy],
    references: [users.id],
  }),
  applications: many(shiftApplications),
  payments: many(payments),
}));

export const shiftApplicationsRelations = relations(shiftApplications, ({ one }) => ({
  shift: one(shifts, {
    fields: [shiftApplications.shiftId],
    references: [shifts.id],
  }),
  nurse: one(users, {
    fields: [shiftApplications.nurseId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  createdAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShiftApplicationSchema = createInsertSchema(shiftApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Types
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type ShiftApplication = typeof shiftApplications.$inferSelect;
export type InsertShiftApplication = z.infer<typeof insertShiftApplicationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Complex types
export type ShiftWithDetails = Shift & {
  facility: Facility;
  department: Department;
  creator: User;
  assignedNurse?: User;
  applications?: ShiftApplication[];
  applicationsCount?: number;
};

export type ShiftApplicationWithDetails = ShiftApplication & {
  shift: ShiftWithDetails;
  nurse: User;
};