import {
  users,
  facilities,
  departments,
  shifts,
  shiftApplications,
  notifications,
  payments,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type Facility,
  type InsertFacility,
  type Department,
  type InsertDepartment,
  type Shift,
  type InsertShift,
  type ShiftApplication,
  type InsertShiftApplication,
  type Notification,
  type InsertNotification,
  type Payment,
  type InsertPayment,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type ShiftWithDetails,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, desc, asc, sql, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin user management
  getAllUsers(): Promise<User[]>;
  getUsersByStatus(status: string): Promise<User[]>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Facility operations
  getFacilities(): Promise<Facility[]>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  getFacility(id: number): Promise<Facility | undefined>;
  
  // Department operations
  getDepartmentsByFacility(facilityId: number): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Shift operations
  getShifts(filters?: {
    facilityId?: number;
    departmentId?: string;
    date?: string;
    minRate?: number;
    maxRate?: number;
    priority?: string;
    status?: string;
    nurseId?: string;
    createdBy?: string;
  }): Promise<ShiftWithDetails[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, updates: Partial<InsertShift>): Promise<Shift>;
  getShift(id: number): Promise<ShiftWithDetails | undefined>;
  deleteShift(id: number): Promise<void>;
  
  // Shift application operations
  applyForShift(application: InsertShiftApplication): Promise<ShiftApplication>;
  getShiftApplications(shiftId: number): Promise<ShiftApplication[]>;
  getUserApplications(nurseId: string): Promise<ShiftApplication[]>;
  getNursingHomeApplications(nursingHomeId: string): Promise<ShiftApplication[]>;
  updateApplicationStatus(id: number, status: string, adminNotes?: string): Promise<ShiftApplication>;
  getApplicationById(id: number): Promise<ShiftApplication | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getAllPayments(): Promise<Payment[]>;
  getNursingHomePayments(nursingHomeId: string): Promise<Payment[]>;
  getNursePayments(nurseId: string): Promise<Payment[]>;
  updatePayment(id: number, updates: Partial<InsertPayment>): Promise<Payment>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  invalidatePasswordResetToken(token: string): Promise<void>;
  updateUserPassword(userId: string, password: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({...userData, id: userData.id || `user_${Date.now()}`})
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByStatus(status: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.credentialsVerificationStatus, status),
        eq(users.role, "nurse")
      ))
      .orderBy(desc(users.createdAt));
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const userId = `user_${Date.now()}`;
    
    // Comprehensive SQL insert with all nurse registration fields
    const query = `
      INSERT INTO users (
        id, email, password, first_name, last_name, phone_number, role,
        license_number, license_type, state, address, city, zip_code, bio,
        nurse_education, nurse_experience_years, nurse_certifications, 
        nurse_specialties, nurse_references, latitude, longitude, 
        preferred_radius, credentials_verification_status, background_check_status,
        is_active, is_verified, is_available_for_shifts, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW(), NOW()
      ) RETURNING *;
    `;
    
    const values = [
      userId,
      userData.email,
      userData.password,
      userData.firstName,
      userData.lastName,
      userData.phoneNumber,
      userData.role,
      userData.licenseNumber,
      userData.licenseType,
      userData.state,
      userData.address,
      userData.city,
      userData.zipCode,
      userData.bio,
      userData.nurseEducation,
      userData.nurseExperienceYears,
      userData.nurseCertifications,
      userData.nurseSpecialties,
      userData.nurseReferences,
      userData.latitude,
      userData.longitude,
      userData.preferredRadius || 25,
      userData.credentialsVerificationStatus || 'pending',
      userData.backgroundCheckStatus || 'pending',
      userData.isActive || false,
      userData.isVerified || false,
      userData.isAvailableForShifts || true
    ];
    
    console.log("SQL Query:", query);
    console.log("SQL Values:", JSON.stringify(values, null, 2));
    
    const result = await pool.query(query, values);
    return result.rows[0] as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Clean up the updates object to handle array fields properly
    const cleanUpdates = { ...updates };
    
    const [user] = await db
      .update(users)
      .set({
        ...cleanUpdates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  // Facility operations
  async getFacilities(): Promise<Facility[]> {
    try {
      return await db.select().from(facilities).where(eq(facilities.isActive, true)).orderBy(asc(facilities.name));
    } catch (error) {
      console.error("Error fetching facilities:", error);
      return [];
    }
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const [newFacility] = await db.insert(facilities).values(facility).returning();
    return newFacility;
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility;
  }

  // Department operations
  async getDepartmentsByFacility(facilityId: number): Promise<Department[]> {
    try {
      return await db
        .select()
        .from(departments)
        .where(and(eq(departments.facilityId, facilityId), eq(departments.isActive, true)))
        .orderBy(asc(departments.name));
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  // Shift operations
  async getShifts(filters?: {
    facilityId?: number;
    departmentId?: string;
    date?: string;
    minRate?: number;
    maxRate?: number;
    priority?: string;
    status?: string;
    nurseId?: string;
    createdBy?: string;
  }): Promise<ShiftWithDetails[]> {
    try {
      // Simple query to get shifts first
      let shiftsQuery = db.select().from(shifts);
      
      const conditions = [];
      
      if (filters) {
        if (filters.facilityId) {
          conditions.push(eq(shifts.facilityId, filters.facilityId));
        }
        if (filters.date) {
          conditions.push(gte(shifts.shiftDate, filters.date));
        }
        if (filters.minRate) {
          conditions.push(gte(shifts.hourlyRate, filters.minRate.toString()));
        }
        if (filters.maxRate) {
          conditions.push(sql`${shifts.hourlyRate} <= ${filters.maxRate}`);
        }
        if (filters.priority) {
          conditions.push(eq(shifts.priority, filters.priority as any));
        }
        if (filters.status) {
          conditions.push(eq(shifts.status, filters.status as any));
        }
        if (filters.nurseId) {
          conditions.push(eq(shifts.assignedTo, filters.nurseId));
        }
        if (filters.createdBy) {
          conditions.push(eq(shifts.createdBy, filters.createdBy));
        }
      }

      let shiftsResult;
      if (conditions.length > 0) {
        shiftsResult = await shiftsQuery.where(and(...conditions)).orderBy(desc(shifts.createdAt));
      } else {
        shiftsResult = await shiftsQuery.orderBy(desc(shifts.createdAt));
      }

      // Get additional data separately
      const enrichedShifts = await Promise.all(shiftsResult.map(async (shift) => {
        // Get facility
        let facility = null;
        try {
          if (shift.facilityId) {
            const [facilityData] = await db.select().from(facilities).where(eq(facilities.id, shift.facilityId));
            facility = facilityData || null;
          }
        } catch (error) {
          console.error('Error fetching facility:', error);
          facility = null;
        }

        // Get department  
        let department = null;
        try {
          if (shift.departmentId) {
            const [departmentData] = await db.select().from(departments).where(eq(departments.id, shift.departmentId));
            department = departmentData || null;
          }
        } catch (error) {
          console.error('Error fetching department:', error);
          department = null;
        }

        // Get creator
        let creator = null;
        try {
          if (shift.createdBy) {
            const [creatorData] = await db.select().from(users).where(eq(users.id, shift.createdBy));
            creator = creatorData || null;
          }
        } catch (error) {
          console.error('Error fetching creator:', error);
          creator = null;
        }

        // Get application count
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(shiftApplications)
          .where(eq(shiftApplications.shiftId, shift.id));

        return {
          ...shift,
          facility,
          department,
          creator,
          applicationsCount: countResult?.count || 0
        };
      }));

      return enrichedShifts as ShiftWithDetails[];
    } catch (error) {
      console.error("Error in getShifts:", error);
      return [];
    }
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [newShift] = await db.insert(shifts).values(shift).returning();
    return newShift;
  }

  async updateShift(id: number, updates: Partial<InsertShift>): Promise<Shift> {
    // Clean the updates object to ensure proper types
    const cleanUpdates: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'actualStartTime' || key === 'actualEndTime') {
        // Ensure timestamp fields are proper Date objects
        cleanUpdates[key] = value instanceof Date ? value : new Date(value as string);
      } else {
        cleanUpdates[key] = value;
      }
    }
    
    const [updatedShift] = await db
      .update(shifts)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(shifts.id, id))
      .returning();
    return updatedShift;
  }

  async getShift(id: number): Promise<ShiftWithDetails | undefined> {
    try {
      // Get the basic shift first
      const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
      if (!shift) return undefined;

      // Get related data separately to avoid column conflicts
      let facility = null;
      try {
        if (shift.facilityId) {
          const [facilityData] = await db.select().from(facilities).where(eq(facilities.id, shift.facilityId));
          facility = facilityData || null;
        }
      } catch (error) {
        console.error('Error fetching facility:', error);
        facility = null;
      }

      let department = null;
      try {
        if (shift.departmentId) {
          const [departmentData] = await db.select().from(departments).where(eq(departments.id, shift.departmentId));
          department = departmentData || null;
        }
      } catch (error) {
        console.error('Error fetching department:', error);
        department = null;
      }

      let creator = null;
      try {
        if (shift.createdBy) {
          const [creatorData] = await db.select().from(users).where(eq(users.id, shift.createdBy));
          creator = creatorData || null;
        }
      } catch (error) {
        console.error('Error fetching creator:', error);
        creator = null;
      }

      return {
        ...shift,
        facility,
        department,
        creator,
        applicationsCount: 0
      } as ShiftWithDetails;
    } catch (error) {
      console.error("Error in getShift:", error);
      return undefined;
    }
  }

  // Shift application operations
  async applyForShift(application: InsertShiftApplication): Promise<ShiftApplication> {
    const [newApplication] = await db.insert(shiftApplications).values(application).returning();
    return newApplication;
  }

  async getShiftApplications(shiftId: number): Promise<ShiftApplication[]> {
    const results = await db
      .select()
      .from(shiftApplications)
      .leftJoin(users, eq(shiftApplications.nurseId, users.id))
      .where(eq(shiftApplications.shiftId, shiftId))
      .orderBy(desc(shiftApplications.appliedAt));

    return results.map((row: any) => ({
      ...row.shift_applications,
      nurse: row.users,
    })) as any;
  }

  async getUserApplications(nurseId: string): Promise<ShiftApplication[]> {
    return await db
      .select()
      .from(shiftApplications)
      .where(eq(shiftApplications.nurseId, nurseId))
      .orderBy(desc(shiftApplications.appliedAt));
  }

  async getNursingHomeApplications(nursingHomeId: string): Promise<ShiftApplication[]> {
    const results = await db
      .select()
      .from(shiftApplications)
      .leftJoin(shifts, eq(shiftApplications.shiftId, shifts.id))
      .leftJoin(facilities, eq(shifts.facilityId, facilities.id))
      .leftJoin(departments, eq(shifts.departmentId, departments.id))
      .leftJoin(users, eq(shiftApplications.nurseId, users.id))
      .where(eq(shifts.createdBy, nursingHomeId))
      .orderBy(desc(shiftApplications.appliedAt));

    return results.map((row: any) => ({
      ...row.shift_applications,
      shift: {
        ...row.shifts,
        facility: row.facilities,
        department: row.departments,
      },
      nurse: row.users,
    })) as any;
  }

  async updateApplicationStatus(id: number, status: string, adminNotes?: string): Promise<ShiftApplication> {
    const updateData: any = { status, respondedAt: new Date() };
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    const [updatedApplication] = await db
      .update(shiftApplications)
      .set(updateData)
      .where(eq(shiftApplications.id, id))
      .returning();
    return updatedApplication;
  }

  async getApplicationById(id: number): Promise<ShiftApplication | undefined> {
    const [application] = await db
      .select()
      .from(shiftApplications)
      .where(eq(shiftApplications.id, id));
    return application;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
      RETURNING *;
    `;
    
    const values = [
      notification.userId,
      notification.title,
      notification.message,
      notification.type || 'info',
      notification.isRead || false
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0] as Notification;
  }

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async getNursingHomePayments(nursingHomeId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.nursingHomeId, nursingHomeId));
  }

  async getNursePayments(nurseId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.nurseId, nurseId));
  }

  async updatePayment(id: number, updates: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Password reset operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.isUsed, false),
        gte(passwordResetTokens.expiresAt, new Date())
      ));
    return resetToken;
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, password: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
