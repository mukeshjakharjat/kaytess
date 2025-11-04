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
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;