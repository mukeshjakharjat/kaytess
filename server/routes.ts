import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, hashPassword } from "./auth";
import { insertShiftSchema, insertShiftApplicationSchema, insertFacilitySchema, insertDepartmentSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import { emailService } from "./emailService";
import { randomBytes } from "crypto";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Digital Asset Links for TWA verification
  app.get('/.well-known/assetlinks.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, '../.well-known/assetlinks.json'));
  });

  // Auth middleware
  setupAuth(app);

  // Initialize default admin user
  app.post('/api/init-admin', async (req, res) => {
    try {
      // Check if admin already exists
      const existingAdmin = await storage.getUserByEmail("admin@kaytess.com");
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin user already exists" });
      }

      // Create default admin user
      const hashedPassword = await hashPassword("admin123");
      const admin = await storage.createUser({
        email: "admin@kaytess.com",
        password: hashedPassword,
        firstName: "System",
        lastName: "Administrator", 
        role: "admin",
        isActive: true,
      });

      res.json({ 
        message: "Admin user created successfully", 
        email: admin.email,
        password: "admin123"
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Nurse registration endpoint
  app.post("/api/register-nurse", async (req, res) => {
    try {
      console.log("Registration request body:", JSON.stringify(req.body, null, 2));
      
      const { email, password, ...nurseData } = req.body;
      
      // Debug field mapping
      console.log("Field mapping debug:");
      console.log("phone:", nurseData.phone);
      console.log("issuingState:", nurseData.issuingState);
      console.log("notes:", nurseData.notes);
      console.log("nursingSchool:", nurseData.nursingSchool);
      console.log("yearsOfExperience:", nurseData.yearsOfExperience);
      console.log("certifications:", nurseData.certifications);
      console.log("specializations:", nurseData.specializations);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Comprehensive user data with all form fields mapped correctly
      const userData = {
        email,
        password: hashedPassword,
        firstName: nurseData.firstName,
        lastName: nurseData.lastName,
        phoneNumber: nurseData.phone || nurseData.phoneNumber || null,
        role: "nurse" as const,
        licenseNumber: nurseData.licenseNumber || null,
        licenseType: nurseData.licenseType || null,
        state: nurseData.issuingState || nurseData.state || null,
        address: nurseData.address || null,
        city: nurseData.city || null,
        zipCode: nurseData.zipCode || null,
        bio: nurseData.notes || nurseData.bio || null,
        
        // Education & Experience (map frontend field names to backend field names)
        nurseEducation: nurseData.nursingSchool || nurseData.nurseEducation || null,
        nurseExperienceYears: parseInt(nurseData.yearsOfExperience || nurseData.nurseExperienceYears) || 0,
        nurseCertifications: nurseData.certifications || nurseData.nurseCertifications || null,
        nurseSpecialties: nurseData.specializations || nurseData.nurseSpecialties || null,
        
        // References (combine individual reference fields into a single string)
        nurseReferences: [
          nurseData.reference1Name && `${nurseData.reference1Name} - ${nurseData.reference1Phone} (${nurseData.reference1Relationship})`,
          nurseData.reference2Name && `${nurseData.reference2Name} - ${nurseData.reference2Phone} (${nurseData.reference2Relationship})`
        ].filter(Boolean).join('; ') || nurseData.nurseReferences,
        
        // Additional fields if provided
        latitude: nurseData.latitude ? parseFloat(nurseData.latitude) : null,
        longitude: nurseData.longitude ? parseFloat(nurseData.longitude) : null,
        preferredRadius: parseInt(nurseData.preferredRadius) || 25,
        
        // Status fields
        credentialsVerificationStatus: "pending",
        backgroundCheckStatus: "pending",
        isActive: false,
        isVerified: false,
        isAvailableForShifts: true
      };
      
      console.log("Prepared user data:", JSON.stringify(userData, null, 2));
      
      // Create nurse with pending approval status
      const newNurse = await storage.createUser(userData);

      // Send notification to admin about new nurse registration
      await storage.createNotification({
        userId: "admin", // System admin
        title: "New Nurse Registration",
        message: `${nurseData.firstName} ${nurseData.lastName} has submitted a nurse application for review.`,
        type: "general",
        isRead: false,
      });

      // Send welcome email to the nurse
      try {
        await emailService.sendWelcomeEmail(newNurse);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json({ 
        message: "Registration submitted successfully! Our admin team will review your application and contact you via email within 24-48 hours. Thank you for joining KAYTESS Healthcare Staffing.",
        userId: newNurse.id 
      });
    } catch (error) {
      console.error("=== NURSE REGISTRATION ERROR ===");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      console.error("=== END ERROR LOG ===");
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // Admin: Get pending nurse applications
  app.get("/api/admin/pending-nurses", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingNurses = await storage.getUsersByStatus("pending");
      res.json(pendingNurses);
    } catch (error) {
      console.error("Error fetching pending nurses:", error);
      res.status(500).json({ message: "Failed to fetch pending applications" });
    }
  });

  // Admin: Approve or reject nurse application
  app.post("/api/admin/approve-nurse/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, notes } = req.body; // action: "approve" or "reject"
      
      const updatedUser = await storage.updateUser(userId, {
        isActive: action === "approve",
        isVerified: action === "approve",
        credentialsAdminNotes: notes,
        credentialsVerificationStatus: action === "approve" ? "verified" : "rejected",
      });

      // Send notification to nurse
      await storage.createNotification({
        userId: userId,
        title: action === "approve" ? "Application Approved!" : "Application Update",
        message: action === "approve" 
          ? "Congratulations! Your nurse application has been approved. You can now start applying for shifts."
          : `Your application has been reviewed. ${notes || "Please contact admin for more information."}`,
        type: "verification_update",
        isRead: false,
      });

      res.json({ 
        message: `Nurse application ${action}d successfully`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error processing nurse approval:", error);
      res.status(500).json({ message: "Failed to process application" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAdmin, async (req: any, res) => {
    try {
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Hash the password before creating user
      const userData = { ...req.body };
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      const targetUserId = req.params.id;
      
      // Allow users to update their own profile or admin to update any profile
      if (currentUser?.role !== 'admin' && req.user.id !== targetUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const beforeUser = await storage.getUser(targetUserId);
      const user = await storage.updateUser(req.params.id, req.body);

      // Send verification status change notifications (admin only)
      if (currentUser?.role === 'admin' && beforeUser && 'isVerified' in req.body && beforeUser.isVerified !== req.body.isVerified) {
        const notificationTitle = req.body.isVerified ? 'Verification Approved' : 'Verification Update Required';
        const notificationMessage = req.body.isVerified 
          ? 'Congratulations! Your credentials have been verified and approved. You can now apply for shifts.'
          : 'Your verification status requires updates. Please review your credentials and resubmit any missing information.';

        await storage.createNotification({
          userId: targetUserId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'verification_update',
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAdmin, async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      
      // Prevent admin from deleting themselves
      if (req.user.id === targetUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(targetUserId);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Profile update route
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.updateUser(req.user.id, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Facility routes
  app.get('/api/facilities', isAuthenticated, async (req, res) => {
    try {
      const facilities = await storage.getFacilities();
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.post('/api/facilities', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertFacilitySchema.parse(req.body);
      const facility = await storage.createFacility(validatedData);
      res.status(201).json(facility);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid facility data", errors: error.errors });
      }
      console.error("Error creating facility:", error);
      res.status(500).json({ message: "Failed to create facility" });
    }
  });

  // Department routes
  app.get('/api/facilities/:facilityId/departments', isAuthenticated, async (req, res) => {
    try {
      const facilityId = parseInt(req.params.facilityId);
      const departments = await storage.getDepartmentsByFacility(facilityId);
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post('/api/departments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  // Get user's facility info
  app.get('/api/user-facility', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Nursing home access required" });
      }

      // Find or create facility for this nursing home
      const existingFacilities = await storage.getFacilities();
      let userFacility = existingFacilities.find((f: any) => f.contactEmail === user.email);
      
      if (!userFacility) {
        // Create new facility for this nursing home
        const facilityName = user.facilityName || `${user.firstName} ${user.lastName} Healthcare Center`;
        userFacility = await storage.createFacility({
          name: facilityName,
          address: user.address || "123 Healthcare Street",
          city: user.city || "Healthcare City", 
          state: user.state || "CA",
          zipCode: user.zipCode || "90210",
          contactPhone: user.phoneNumber || "555-0123",
          contactEmail: user.email,
          licenseNumber: "HC-" + Date.now(),
          facilityType: "nursing_home"
        });
      }
      
      res.json({ facilityId: userFacility.id, facilityName: userFacility.name });
    } catch (error) {
      console.error("Error getting user facility:", error);
      res.status(500).json({ message: "Failed to get user facility" });
    }
  });

  // Allow nursing homes to create departments for their own facility
  app.post('/api/nursing-home/departments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Nursing home access required" });
      }

      // Get or create facility for this nursing home
      let facilityId;
      
      // Check if user already has a facility
      const existingFacilities = await storage.getFacilities();
      const userFacility = existingFacilities.find(f => f.contactEmail === user.email);
      
      if (userFacility) {
        facilityId = userFacility.id;
      } else {
        // Create new facility for this nursing home
        const facilityName = user.facilityName || `${user.firstName} ${user.lastName} Healthcare Center`;
        const newFacility = await storage.createFacility({
          name: facilityName,
          address: user.address || "123 Healthcare Street",
          city: user.city || "Healthcare City", 
          state: user.state || "CA",
          zipCode: user.zipCode || "90210",
          contactPhone: user.phoneNumber || "555-0123",
          contactEmail: user.email,
          licenseNumber: "HC-" + Date.now(),
          facilityType: "nursing_home"
        });
        facilityId = newFacility.id;
      }
      
      const validatedData = insertDepartmentSchema.parse({
        ...req.body,
        facilityId: facilityId
      });
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  // Shift routes
  app.get('/api/shifts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      const filters: any = {};
      
      // Parse query parameters
      if (req.query.facilityId) filters.facilityId = parseInt(req.query.facilityId as string);
      if (req.query.departmentId) filters.departmentId = req.query.departmentId as string;
      if (req.query.date) filters.date = req.query.date as string;
      if (req.query.minRate) filters.minRate = parseFloat(req.query.minRate as string);
      if (req.query.maxRate) filters.maxRate = parseFloat(req.query.maxRate as string);
      if (req.query.priority) filters.priority = req.query.priority as string;
      if (req.query.status) filters.status = req.query.status as string;

      // For nurses, only show open shifts or their assigned shifts
      if (user?.role === 'nurse') {
        if (!filters.status) {
          filters.status = 'open';
        }
      }

      // For nursing homes, filter by shifts they created if createdBy is specified
      if (req.query.createdBy) {
        filters.createdBy = req.query.createdBy as string;
      }

      const shifts = await storage.getShifts(filters);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get('/api/shifts/:id', isAuthenticated, async (req, res) => {
    try {
      const shiftId = parseInt(req.params.id);
      const shift = await storage.getShift(shiftId);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }

      res.json(shift);
    } catch (error) {
      console.error("Error fetching shift:", error);
      res.status(500).json({ message: "Failed to fetch shift" });
    }
  });

  app.post('/api/shifts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Admin or nursing home access required" });
      }

      // For nursing home users, always use their associated facility
      let facilityId = req.body.facilityId;
      if (user?.role === 'nursing_home') {
        // Find the user's facility based on their email
        const facilities = await storage.getFacilities();
        const userFacility = facilities.find((f: any) => f.contactEmail === user.email);
        if (userFacility) {
          facilityId = userFacility.id;
        } else {
          return res.status(400).json({ message: "No facility found for this nursing home. Please contact admin." });
        }
      }

      const validatedData = insertShiftSchema.parse({
        ...req.body,
        facilityId: facilityId,
        createdBy: req.user.id,
      });

      const shift = await storage.createShift(validatedData);
      
      // Get facility and department details for notification
      const facility = await storage.getFacility(validatedData.facilityId);
      const departments = await storage.getDepartmentsByFacility(validatedData.facilityId);
      const department = departments.find(d => d.id === validatedData.departmentId);
      
      // Notify all verified nurses about new shift opportunity
      const allUsers = await storage.getAllUsers();
      const verifiedNurses = allUsers.filter(u => u.role === 'nurse' && u.isVerified === true);
      
      for (const nurse of verifiedNurses) {
        await storage.createNotification({
          userId: nurse.id,
          title: "New Shift Available",
          message: `New shift posted at ${facility?.name} - ${department?.name} on ${new Date(validatedData.shiftDate).toLocaleDateString()}. Rate: $${validatedData.hourlyRate}/hour`,
          type: 'new_shift',
          relatedShiftId: shift.id,
        });
      }
      
      res.status(201).json(shift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shift data", errors: error.errors });
      }
      console.error("Error creating shift:", error);
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  app.patch('/api/shifts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const shiftId = parseInt(req.params.id);
      const updates = req.body;

      const updatedShift = await storage.updateShift(shiftId, updates);
      res.json(updatedShift);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  // Delete shift route (Admin only)
  app.delete('/api/shifts/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const shiftId = parseInt(req.params.id);
      
      // Check if shift exists
      const shift = await storage.getShift(shiftId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }

      // Check if shift has any applications
      const applications = await storage.getShiftApplications(shiftId);
      if (applications && applications.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete shift with existing applications. Please reject all applications first." 
        });
      }

      // Check if shift is assigned or in progress
      if (shift.assignedTo) {
        return res.status(400).json({ 
          message: "Cannot delete shift that is assigned to a nurse." 
        });
      }

      await storage.deleteShift(shiftId);
      res.json({ message: "Shift deleted successfully" });
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Shift application routes
  app.post('/api/shifts/:shiftId/apply', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }

      const shiftId = parseInt(req.params.shiftId);
      
      // Check if shift exists and is open
      const shift = await storage.getShift(shiftId);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      if (shift.status !== 'open') {
        return res.status(400).json({ message: "Shift is no longer available" });
      }

      // Check if user already applied
      const existingApplications = await storage.getUserApplications(req.user.id);
      const hasApplied = existingApplications.some(app => app.shiftId === shiftId);
      
      if (hasApplied) {
        return res.status(400).json({ message: "You have already applied for this shift" });
      }

      const validatedData = insertShiftApplicationSchema.parse({
        shiftId,
        nurseId: req.user.id,
        applicationNotes: req.body.applicationNotes || '',
      });

      const application = await storage.applyForShift(validatedData);
      
      // Update shift status to pending if it was open
      if (shift.status === 'open') {
        await storage.updateShift(shiftId, { status: 'pending' });
      }

      // Send notification to nursing home about new application
      const nurse = await storage.getUser(req.user.id);
      const facilityName = shift.creator?.facilityName || shift.facility?.name || 'Healthcare Facility';
      await storage.createNotification({
        userId: shift.createdBy,
        title: "New Shift Application",
        message: `${nurse?.firstName} ${nurse?.lastName} has applied for your shift at ${facilityName} - ${shift.department?.name} on ${new Date(shift.shiftDate || '').toLocaleDateString()}.`,
        type: 'new_application',
        relatedShiftId: shiftId,
        relatedApplicationId: application.id,
      });

      // Send confirmation notification to nurse
      await storage.createNotification({
        userId: req.user.id,
        title: "Application Submitted",
        message: `Your application for ${facilityName} - ${shift.department?.name} on ${new Date(shift.shiftDate || '').toLocaleDateString()} has been submitted successfully.`,
        type: 'application_submitted',
        relatedShiftId: shiftId,
        relatedApplicationId: application.id,
      });

      // Send email notifications
      try {
        // Email to nursing home about new application
        const nursingHome = await storage.getUser(shift.createdBy);
        if (nursingHome?.email) {
          await emailService.sendNotificationEmail(nursingHome, {
            title: "New Shift Application",
            message: `${nurse?.firstName} ${nurse?.lastName} has applied for your shift at ${facilityName} - ${shift.department?.name} on ${new Date(shift.shiftDate || '').toLocaleDateString()}.`,
            type: 'new_application'
          });
        }

        // Email confirmation to nurse
        if (nurse?.email) {
          await emailService.sendNotificationEmail(nurse, {
            title: "Application Submitted",
            message: `Your application for ${facilityName} - ${shift.department?.name} on ${new Date(shift.shiftDate || '').toLocaleDateString()} has been submitted successfully.`,
            type: 'application_submitted'
          });
        }
      } catch (emailError) {
        console.error("Failed to send application emails:", emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      console.error("Error applying for shift:", error);
      res.status(500).json({ message: "Failed to apply for shift" });
    }
  });

  app.get('/api/shifts/:shiftId/applications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Admin or nursing home access required" });
      }

      // If nursing home, verify they own the shift
      if (user?.role === 'nursing_home') {
        const shift = await storage.getShift(parseInt(req.params.shiftId));
        if (!shift || shift.createdBy !== user.id) {
          return res.status(403).json({ message: "Access denied - not your shift" });
        }
      }

      const shiftId = parseInt(req.params.shiftId);
      const applications = await storage.getShiftApplications(shiftId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching shift applications:", error);
      res.status(500).json({ message: "Failed to fetch shift applications" });
    }
  });

  // Get all applications for nursing home's shifts
  app.get('/api/shift-applications/nursing-home', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Nursing home access required" });
      }

      const applications = await storage.getNursingHomeApplications(user.id);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching nursing home applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get('/api/my-applications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }

      const applications = await storage.getUserApplications(req.user.id);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch your applications" });
    }
  });

  app.patch('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Admin or nursing home access required" });
      }

      const applicationId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;

      const application = await storage.getApplicationById(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const updatedApplication = await storage.updateApplicationStatus(applicationId, status, adminNotes);
      
      // Create notification for the nurse
      const shift = await storage.getShift(application.shiftId);
      let notificationTitle = "";
      let notificationMessage = "";
      
      if (status === 'approved') {
        // Update shift to filled and assign nurse
        await storage.updateShift(application.shiftId, {
          status: 'filled',
          assignedTo: application.nurseId,
        });
        
        notificationTitle = "Shift Application Approved";
        notificationMessage = `Congratulations! Your application for ${shift?.facility?.name} - ${shift?.department?.name} on ${new Date(shift?.shiftDate || '').toLocaleDateString()} has been approved.`;
      } else if (status === 'rejected') {
        notificationTitle = "Shift Application Update";
        notificationMessage = `Your application for ${shift?.facility?.name} - ${shift?.department?.name} on ${new Date(shift?.shiftDate || '').toLocaleDateString()} was not selected. ${adminNotes ? 'Notes: ' + adminNotes : ''}`;
      }
      
      // Create notification
      if (notificationTitle) {
        await storage.createNotification({
          userId: application.nurseId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'application_update',
          relatedShiftId: application.shiftId,
          relatedApplicationId: applicationId,
        });
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Nurse shift tracking routes
  app.get('/api/shifts/nurse/:nurseId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Nurse access required" });
      }

      const nurseId = req.params.nurseId;
      const status = req.query.status;
      
      let shifts = [];
      
      if (status) {
        const statusFilters = status.split(',');
        
        // Get shifts for each status and combine them
        for (const statusFilter of statusFilters) {
          const statusShifts = await storage.getShifts({
            nurseId,
            status: statusFilter.trim()
          });
          shifts.push(...statusShifts);
        }
        
        // Remove duplicates based on shift id
        const uniqueShifts = shifts.filter((shift, index, array) => 
          array.findIndex(s => s.id === shift.id) === index
        );
        
        shifts = uniqueShifts;
      } else {
        shifts = await storage.getShifts({
          nurseId
        });
      }

      res.json(shifts);
    } catch (error) {
      console.error("Error fetching nurse shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.post('/api/shifts/:shiftId/start', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Nurse access required" });
      }

      const shiftId = parseInt(req.params.shiftId);
      const shift = await storage.getShift(shiftId);
      
      if (!shift || shift.assignedTo !== user.id) {
        return res.status(403).json({ message: "Not assigned to this shift" });
      }

      if (shift.status !== 'filled') {
        return res.status(400).json({ message: "Shift must be filled to start" });
      }

      const updatedShift = await storage.updateShift(shiftId, {
        status: 'in_progress',
        actualStartTime: new Date(),
      });

      // Create notification for nursing home
      await storage.createNotification({
        userId: shift.createdBy,
        title: "Shift Started",
        message: `${user.firstName} ${user.lastName} has started their shift at ${shift.facility.name}`,
        type: "shift_assigned",
        relatedShiftId: shiftId,
      });

      res.json(updatedShift);
    } catch (error) {
      console.error("Error starting shift:", error);
      res.status(500).json({ message: "Failed to start shift" });
    }
  });

  app.post('/api/shifts/:shiftId/end', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse') {
        return res.status(403).json({ message: "Nurse access required" });
      }

      const shiftId = parseInt(req.params.shiftId);
      const shift = await storage.getShift(shiftId);
      
      if (!shift || shift.assignedTo !== user.id) {
        return res.status(403).json({ message: "Not assigned to this shift" });
      }

      if (shift.status !== 'in_progress') {
        return res.status(400).json({ message: "Shift must be in progress to end" });
      }

      const endTime = new Date();
      const startTime = new Date(shift.actualStartTime);
      const totalHoursWorked = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));

      const updatedShift = await storage.updateShift(shiftId, {
        status: 'completed',
        actualEndTime: endTime,
        totalHoursWorked: totalHoursWorked.toString(),
      });

      // Calculate payment amounts
      const totalAmount = totalHoursWorked * parseFloat(shift.hourlyRate);
      const adminFee = totalAmount * 0.15; // 15% admin fee
      const nurseAmount = totalAmount - adminFee;

      // Create payment record
      await storage.createPayment({
        shiftId,
        nurseId: user.id,
        nursingHomeId: shift.createdBy,
        totalAmount: totalAmount.toString(),
        adminFee: adminFee.toString(),
        nurseAmount: nurseAmount.toString(),
        nursingHomeToAdminStatus: 'pending',
        adminToNurseStatus: 'pending',
      });

      // Create notifications
      await storage.createNotification({
        userId: shift.createdBy,
        title: "Shift Completed",
        message: `${user.firstName} ${user.lastName} has completed their shift at ${shift.facility.name}. Payment of $${totalAmount.toFixed(2)} is now due.`,
        type: "payment_received",
        relatedShiftId: shiftId,
      });

      await storage.createNotification({
        userId: user.id,
        title: "Shift Completed",
        message: `Your shift at ${shift.facility.name} is complete. Payment of $${nurseAmount.toFixed(2)} is being processed.`,
        type: "payment_received",
        relatedShiftId: shiftId,
      });

      res.json(updatedShift);
    } catch (error) {
      console.error("Error ending shift:", error);
      res.status(500).json({ message: "Failed to end shift" });
    }
  });

  // Payment routes for nurses
  app.get('/api/payments/nurse/:nurseId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Nurse access required" });
      }

      const nurseId = req.params.nurseId;
      const payments = await storage.getNursePayments(nurseId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching nurse payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Test notification endpoint for push notification testing
  app.post('/api/notifications/test', isAuthenticated, async (req: any, res) => {
    try {
      const { title, message, type, userId } = req.body;
      
      const notification = await storage.createNotification({
        userId: userId || req.user.id,
        title: title || "Test Notification",
        message: message || "This is a test push notification from KAYTESS.",
        type: type || "general",
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  // Dashboard stats for admin
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const openShifts = await storage.getShifts({ status: 'open' });
      const filledShifts = await storage.getShifts({ status: 'filled' });
      const pendingShifts = await storage.getShifts({ status: 'pending' });

      // Get current week shifts
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const weeklyShifts = await storage.getShifts({ 
        date: startOfWeek.toISOString().split('T')[0] 
      });

      res.json({
        openShifts: openShifts.length,
        filledShifts: filledShifts.length,
        pendingShifts: pendingShifts.length,
        weeklyShifts: weeklyShifts.length,
        totalShifts: openShifts.length + filledShifts.length + pendingShifts.length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Nurse profile update route
  app.patch("/api/nurses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUser = await storage.getUser(req.user.id);
      
      // Only allow nurses to update their own profile or admins to update any profile
      if (currentUser?.role !== "admin" && req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this profile" });
      }

      const updates = req.body;
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating nurse profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Location-based shift filtering route
  app.get("/api/shifts/nearby", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.latitude || !user?.longitude) {
        return res.status(400).json({ message: "User location not set. Please update your address in settings." });
      }

      const radius = req.query.radius ? parseInt(req.query.radius as string) : user.preferredRadius || 25;
      
      // Get all shifts and filter by distance (simplified implementation)
      const allShifts = await storage.getShifts({ status: 'open' });
      
      // For now, return all shifts. In production, you'd implement proper distance calculation
      res.json(allShifts);
    } catch (error) {
      console.error("Error fetching nearby shifts:", error);
      res.status(500).json({ message: "Failed to fetch nearby shifts" });
    }
  });

  // Payment routes - Healthcare centers pay admin, admin distributes to nurses
  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      const status = req.query.status;
      
      if (user?.role === 'admin') {
        const payments = await storage.getAllPayments(status);
        res.json(payments);
      } else if (user?.role === 'nursing_home') {
        const payments = await storage.getNursingHomePayments(req.user.id, status);
        res.json(payments);
      } else if (user?.role === 'nurse') {
        // Nurses can see payments they've received from admin
        const nursePayments = await storage.getNursePayments(req.user.id);
        res.json(nursePayments);
      } else {
        res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Healthcare center pays admin for shift
  app.post('/api/payments/shift-payment', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Only healthcare centers can make shift payments" });
      }

      const { shiftId, amount, description } = req.body;
      
      const payment = await storage.createPayment({
        shiftId: shiftId,
        nurseId: '', // Will be filled when admin distributes to nurse
        nursingHomeId: req.user.id,
        amount: amount,
        notes: description || `Payment for shift #${shiftId}`,
        status: 'pending',
        nursingHomePaidAt: new Date()
      });

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating shift payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Admin distributes payment to nurse
  app.post('/api/payments/distribute-to-nurse', isAdmin, async (req: any, res) => {
    try {
      const { shiftId, nurseId, amount, description, originalPaymentId } = req.body;
      
      const payment = await storage.createPayment({
        shiftId: shiftId,
        nurseId: nurseId,
        nursingHomeId: req.user.id, // Admin's ID as processing entity
        amount: amount,
        notes: description || `Payment distribution for shift #${shiftId}`,
        status: 'completed',
        adminApprovedAt: new Date(),
        nursePaidAt: new Date()
      });

      // Send payment notification to nurse
      const nurse = await storage.getUser(nurseId);
      await storage.createNotification({
        userId: nurseId,
        title: "Payment Received",
        message: `You've received payment of $${amount} for shift #${shiftId}. Payment has been processed successfully.`,
        type: 'payment_received',
        relatedShiftId: shiftId,
      });

      // Update original payment status to distributed
      if (originalPaymentId) {
        await storage.updatePayment(originalPaymentId, {
          status: 'distributed'
        });
      }

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error distributing payment to nurse:", error);
      res.status(500).json({ message: "Failed to distribute payment" });
    }
  });

  app.patch('/api/payments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const payment = await storage.updatePayment(parseInt(req.params.id), req.body);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // User profile update routes
  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUser = await storage.getUser(req.user.id);
      
      // Users can only update their own profile, or admin can update any
      if (req.user.id !== userId && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Process the request body to handle array fields properly
      const updateData = { ...req.body };
      
      // Handle array fields that might come as strings
      if (updateData.specialties !== undefined) {
        if (typeof updateData.specialties === 'string') {
          updateData.specialties = updateData.specialties ? updateData.specialties.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];
        } else if (!Array.isArray(updateData.specialties)) {
          updateData.specialties = [];
        }
      }
      
      // Remove any undefined values that could cause issues
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
        // Convert empty strings to null for optional fields
        if (updateData[key] === '') {
          updateData[key] = null;
        }
      });

      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Document upload route for credentials
  app.post('/api/upload-document', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }

      // In a real implementation, you would handle file upload to cloud storage
      // For now, we'll simulate successful upload
      const { fileName, fileType, documentType } = req.body;
      
      const documentData = {
        id: Date.now(),
        fileName: fileName || `document-${Date.now()}`,
        fileType: fileType || 'application/pdf',
        documentType: documentType || 'general',
        uploadedAt: new Date(),
        status: 'uploaded',
        url: `/api/documents/${Date.now()}` // Simulated URL
      };

      // Save document reference to user profile
      const currentDocuments = Array.isArray(user.documents) ? user.documents : [];
      const updatedDocuments = [...currentDocuments, documentData];
      
      await storage.updateUser(req.user.id, { 
        documents: updatedDocuments 
      });

      res.json({ 
        success: true, 
        message: "Document uploaded successfully",
        document: documentData
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Credentials management routes
  app.get('/api/certifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Parse and return certifications
      let certifications = [];
      try {
        if (user.certifications) {
          if (typeof user.certifications === 'string') {
            certifications = JSON.parse(user.certifications);
          } else {
            certifications = user.certifications;
          }
        }
      } catch (error) {
        console.error('Error parsing certifications:', error);
        certifications = [];
      }
      
      res.json(certifications);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ message: "Failed to fetch certifications" });
    }
  });

  app.post('/api/certifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Save certification to user data
      const newCertification = {
        id: Date.now(),
        ...req.body,
        status: 'pending',
        createdAt: new Date()
      };
      
      const currentCertifications = Array.isArray(user.certifications) ? user.certifications : [];
      const updatedCertifications = [...currentCertifications, newCertification];
      
      console.log("Updating certifications:", JSON.stringify(updatedCertifications, null, 2));
      
      await storage.updateUser(req.user.id, { 
        certifications: JSON.stringify(updatedCertifications)
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Certification added successfully",
        certification: newCertification
      });
    } catch (error) {
      console.error("Error adding certification:", error);
      res.status(500).json({ message: "Failed to add certification" });
    }
  });

  app.put('/api/certifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const certId = parseInt(req.params.id);
      const currentCertifications = Array.isArray(user.certifications) ? user.certifications : [];
      const updatedCertifications = currentCertifications.map((cert: any) => 
        cert.id === certId ? { ...cert, ...req.body, updatedAt: new Date() } : cert
      );
      
      await storage.updateUser(req.user.id, { 
        certifications: updatedCertifications 
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Certification updated successfully"
      });
    } catch (error) {
      console.error("Error updating certification:", error);
      res.status(500).json({ message: "Failed to update certification" });
    }
  });

  app.delete('/api/certifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const certId = parseInt(req.params.id);
      const currentCertifications = Array.isArray(user.certifications) ? user.certifications : [];
      const updatedCertifications = currentCertifications.filter((cert: any) => cert.id !== certId);
      
      await storage.updateUser(req.user.id, { 
        certifications: updatedCertifications 
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Certification deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting certification:", error);
      res.status(500).json({ message: "Failed to delete certification" });
    }
  });

  app.get('/api/education', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Parse and return education
      let education = [];
      try {
        if (user.education) {
          if (typeof user.education === 'string') {
            education = JSON.parse(user.education);
          } else {
            education = user.education;
          }
        }
      } catch (error) {
        console.error('Error parsing education:', error);
        education = [];
      }
      
      res.json(education);
    } catch (error) {
      console.error("Error fetching education:", error);
      res.status(500).json({ message: "Failed to fetch education" });
    }
  });

  app.post('/api/education', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const newEducation = {
        id: Date.now(),
        ...req.body,
        status: 'pending',
        createdAt: new Date()
      };
      
      let currentEducation = [];
      try {
        if (user.education) {
          if (typeof user.education === 'string') {
            currentEducation = JSON.parse(user.education);
          } else if (Array.isArray(user.education)) {
            currentEducation = user.education;
          }
        }
      } catch (error) {
        console.error('Error parsing current education:', error);
        currentEducation = [];
      }
      
      const updatedEducation = [...currentEducation, newEducation];
      
      await storage.updateUser(req.user.id, { 
        education: JSON.stringify(updatedEducation)
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Education record added successfully",
        education: newEducation
      });
    } catch (error) {
      console.error("Error adding education:", error);
      res.status(500).json({ message: "Failed to add education record" });
    }
  });

  app.put('/api/education/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const educationId = parseInt(req.params.id);
      const currentEducation = Array.isArray(user.education) ? user.education : [];
      const updatedEducation = currentEducation.map((edu: any) => 
        edu.id === educationId ? { ...edu, ...req.body, updatedAt: new Date() } : edu
      );
      
      await storage.updateUser(req.user.id, { 
        education: updatedEducation 
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Education record updated successfully"
      });
    } catch (error) {
      console.error("Error updating education:", error);
      res.status(500).json({ message: "Failed to update education record" });
    }
  });

  app.delete('/api/education/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const educationId = parseInt(req.params.id);
      const currentEducation = Array.isArray(user.education) ? user.education : [];
      const updatedEducation = currentEducation.filter((edu: any) => edu.id !== educationId);
      
      await storage.updateUser(req.user.id, { 
        education: updatedEducation 
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Education record deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting education:", error);
      res.status(500).json({ message: "Failed to delete education record" });
    }
  });

  app.get('/api/experience', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Parse and return experience
      let experience = [];
      try {
        if (user.experience) {
          if (typeof user.experience === 'string') {
            experience = JSON.parse(user.experience);
          } else if (Array.isArray(user.experience)) {
            experience = user.experience;
          }
        }
      } catch (error) {
        console.error('Error parsing experience:', error);
        experience = [];
      }
      
      res.json(experience);
    } catch (error) {
      console.error("Error fetching experience:", error);
      res.status(500).json({ message: "Failed to fetch experience" });
    }
  });

  app.post('/api/experience', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const newExperience = {
        id: Date.now(),
        ...req.body,
        status: 'pending',
        createdAt: new Date()
      };
      
      let currentExperience = [];
      try {
        if (user.experience) {
          if (typeof user.experience === 'string') {
            currentExperience = JSON.parse(user.experience);
          } else if (Array.isArray(user.experience)) {
            currentExperience = user.experience;
          }
        }
      } catch (error) {
        console.error('Error parsing current experience:', error);
        currentExperience = [];
      }
      
      const updatedExperience = [...currentExperience, newExperience];
      
      await storage.updateUser(req.user.id, { 
        experience: JSON.stringify(updatedExperience)
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Experience record added successfully",
        experience: newExperience
      });
    } catch (error) {
      console.error("Error adding experience:", error);
      res.status(500).json({ message: "Failed to add experience record" });
    }
  });

  app.put('/api/experience/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const experienceId = parseInt(req.params.id);
      const currentExperience = Array.isArray(user.experience) ? user.experience : [];
      const updatedExperience = currentExperience.map((exp: any) => 
        exp.id === experienceId ? { ...exp, ...req.body, updatedAt: new Date() } : exp
      );
      
      await storage.updateUser(req.user.id, { 
        experience: updatedExperience 
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Experience record updated successfully"
      });
    } catch (error) {
      console.error("Error updating experience:", error);
      res.status(500).json({ message: "Failed to update experience record" });
    }
  });

  app.delete('/api/experience/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const experienceId = parseInt(req.params.id);
      const currentExperience = Array.isArray(user.experience) ? user.experience : [];
      const updatedExperience = currentExperience.filter((exp: any) => exp.id !== experienceId);
      
      await storage.updateUser(req.user.id, { 
        experience: updatedExperience 
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Experience record deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting experience:", error);
      res.status(500).json({ message: "Failed to delete experience record" });
    }
  });

  app.get('/api/references', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Parse and return references
      let references = [];
      try {
        if (user.references) {
          if (typeof user.references === 'string') {
            references = JSON.parse(user.references);
          } else if (Array.isArray(user.references)) {
            references = user.references;
          }
        }
      } catch (error) {
        console.error('Error parsing references:', error);
        references = [];
      }
      
      res.json(references);
    } catch (error) {
      console.error("Error fetching references:", error);
      res.status(500).json({ message: "Failed to fetch references" });
    }
  });

  app.post('/api/references', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const newReference = {
        id: Date.now(),
        ...req.body,
        status: 'pending',
        createdAt: new Date()
      };
      
      let currentReferences = [];
      try {
        if (user.references) {
          if (typeof user.references === 'string') {
            currentReferences = JSON.parse(user.references);
          } else if (Array.isArray(user.references)) {
            currentReferences = user.references;
          }
        }
      } catch (error) {
        console.error('Error parsing current references:', error);
        currentReferences = [];
      }
      
      const updatedReferences = [...currentReferences, newReference];
      
      await storage.updateUser(req.user.id, { 
        references: JSON.stringify(updatedReferences)
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Reference added successfully",
        reference: newReference
      });
    } catch (error) {
      console.error("Error adding reference:", error);
      res.status(500).json({ message: "Failed to add reference" });
    }
  });

  app.put('/api/references/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const referenceId = parseInt(req.params.id);
      const currentReferences = Array.isArray(user.references) ? user.references : [];
      const updatedReferences = currentReferences.map((ref: any) => 
        ref.id === referenceId ? { ...ref, ...req.body, updatedAt: new Date() } : ref
      );
      
      await storage.updateUser(req.user.id, { 
        references: updatedReferences 
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Reference updated successfully"
      });
    } catch (error) {
      console.error("Error updating reference:", error);
      res.status(500).json({ message: "Failed to update reference" });
    }
  });

  app.delete('/api/references/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'nurse' && user?.role !== 'nursing_home') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const referenceId = parseInt(req.params.id);
      const currentReferences = Array.isArray(user.references) ? user.references : [];
      const updatedReferences = currentReferences.filter((ref: any) => ref.id !== referenceId);
      
      await storage.updateUser(req.user.id, { 
        references: updatedReferences 
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Reference deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting reference:", error);
      res.status(500).json({ message: "Failed to delete reference" });
    }
  });

  // License information route
  app.get('/api/license', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (user?.role === 'nurse') {
        const license = {
          licenseNumber: user.licenseNumber || '',
          licenseType: user.licenseType || '',
          issuingState: user.state || '',
          expirationDate: '',
          status: user.credentialsVerificationStatus || 'pending'
        };
        res.json(license);
      } else if (user?.role === 'nursing_home') {
        const license = {
          facilityLicense: user.facilityLicenseNumber || '',
          facilityType: user.facilityType || '',
          issuingState: user.state || '',
          expirationDate: '',
          status: user.credentialsVerificationStatus || 'pending'
        };
        res.json(license);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      console.error("Error fetching license:", error);
      res.status(500).json({ message: "Failed to fetch license information" });
    }
  });

  app.post('/api/license', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (user?.role === 'nurse') {
        await storage.updateUser(req.user.id, {
          licenseNumber: req.body.licenseNumber,
          licenseType: req.body.licenseType,
          state: req.body.licenseState
        });
      } else if (user?.role === 'nursing_home') {
        await storage.updateUser(req.user.id, {
          facilityLicenseNumber: req.body.facilityLicense,
          facilityType: req.body.facilityType,
          state: req.body.licenseState
        });
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.status(200).json({ 
        success: true, 
        message: "License information updated successfully"
      });
    } catch (error) {
      console.error("Error updating license:", error);
      res.status(500).json({ message: "Failed to update license information" });
    }
  });

  // Admin credentials verification routes
  app.get("/api/admin/pending-credentials", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const pendingNurses = users.filter(user => 
        user.role === 'nurse' && 
        (!user.credentialsVerificationStatus || user.credentialsVerificationStatus === 'pending')
      );
      
      res.json(pendingNurses);
    } catch (error) {
      console.error("Error fetching pending credentials:", error);
      res.status(500).json({ message: "Failed to fetch pending credentials" });
    }
  });

  app.put("/api/admin/verify-credentials/:nurseId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { nurseId } = req.params;
      const { status, notes } = req.body;

      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const updatedUser = await storage.updateUser(nurseId, {
        credentialsVerificationStatus: status,
        credentialsAdminNotes: notes || null
      });

      // Create notification for the nurse
      try {
        await storage.createNotification({
          userId: nurseId,
          title: status === 'verified' ? 'Credentials Verified' : 'Credentials Verification Required',
          message: status === 'verified' 
            ? 'Your nursing credentials have been verified. You can now apply for shifts.'
            : `Your credentials verification was rejected. ${notes ? `Reason: ${notes}` : 'Please review and resubmit your credentials.'}`,
          type: 'verification'
        });
        console.log(`Notification created for user ${nurseId} - status: ${status}`);

        // Send email notification
        const nurse = await storage.getUser(nurseId);
        if (nurse?.email) {
          await emailService.sendNotificationEmail(nurse, {
            title: status === 'verified' ? 'Credentials Verified' : 'Credentials Verification Required',
            message: status === 'verified' 
              ? 'Your nursing credentials have been verified. You can now apply for shifts.'
              : `Your credentials verification was rejected. ${notes ? `Reason: ${notes}` : 'Please review and resubmit your credentials.'}`,
            type: 'verification'
          });
        }
      } catch (notificationError) {
        console.error('Failed to create notification or send email:', notificationError);
        // Don't fail the whole request if notification fails
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error verifying credentials:", error);
      res.status(500).json({ message: "Failed to verify credentials" });
    }
  });

  // Password Reset Routes
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
        isUsed: false
      });

      // Send email
      const emailSent = await emailService.sendPasswordResetEmail(user, resetToken);
      
      if (!emailSent) {
        console.error("Failed to send password reset email");
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Validate reset token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Invalidate the token
      await storage.invalidatePasswordResetToken(token);

      // Get user for email notification
      const user = await storage.getUser(resetToken.userId);
      if (user) {
        // Send confirmation email
        await emailService.sendNotificationEmail(user, {
          title: "Password Reset Successful",
          message: "Your password has been successfully reset. If you did not make this change, please contact support immediately.",
          type: "security"
        });
      }

      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  // Object Storage Routes for Document Uploads
  // The endpoint for getting the upload URL for an object entity.
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // This endpoint is used to serve private objects.
  // It checks the ACL policy for the object properly.
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    // Gets the authenticated user id.
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: "read" as any,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint for updating the model state after a document is uploaded
  app.put("/api/nurse-documents", isAuthenticated, async (req, res) => {
    if (!req.body.documentURL) {
      return res.status(400).json({ error: "documentURL is required" });
    }

    // Gets the authenticated user id.
    const userId = req.user?.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.documentURL,
        {
          owner: userId,
          visibility: "private", // Private documents for nurses
        },
      );

      // Update user's document list
      const user = await storage.getUser(userId);
      const currentDocuments = Array.isArray(user?.documents) ? user.documents : [];
      const newDocument = {
        id: Date.now(),
        fileName: req.body.fileName || 'Document',
        fileType: req.body.fileType || 'application/pdf',
        documentType: req.body.documentType || 'certificate',
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        url: objectPath
      };
      
      const updatedDocuments = [...currentDocuments, newDocument];
      await storage.updateUser(userId, { documents: updatedDocuments });

      res.status(200).json({
        objectPath: objectPath,
        document: newDocument
      });
    } catch (error) {
      console.error("Error setting nurse document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
