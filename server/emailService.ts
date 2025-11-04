import nodemailer from 'nodemailer';
import type { User } from '@shared/schema';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize with SMTP configuration from environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Verify SMTP connection
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'https://app.kaytesshift.com'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'KAYTESS - Password Reset Request',
        html: this.getPasswordResetTemplate(user, resetUrl),
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // Send notification email
  async sendNotificationEmail(user: User, notification: {
    title: string;
    message: string;
    type: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: `KAYTESS - ${notification.title}`,
        html: this.getNotificationTemplate(user, notification),
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  }

  // Send shift notification email
  async sendShiftNotificationEmail(user: User, shiftDetails: {
    facilityName: string;
    department: string;
    date: string;
    time: string;
    type: 'application_approved' | 'application_rejected' | 'shift_reminder' | 'shift_cancelled';
  }): Promise<boolean> {
    try {
      const subject = this.getShiftEmailSubject(shiftDetails.type);
      
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: `KAYTESS - ${subject}`,
        html: this.getShiftNotificationTemplate(user, shiftDetails),
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send shift notification email:', error);
      return false;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user: User): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Welcome to KAYTESS - Healthcare Staffing Platform',
        html: this.getWelcomeTemplate(user),
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  // Email templates
  private getPasswordResetTemplate(user: User, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - KAYTESS</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KAYTESS</h1>
            <p>Healthcare Staffing Platform</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.firstName || 'User'},</p>
            <p>We received a request to reset your password for your KAYTESS account. If you made this request, click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>For security, this link can only be used once.</p>
          </div>
          <div class="footer">
            <p>© 2025 KAYTESS. All rights reserved.</p>
            <p>If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
            ${resetUrl}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getNotificationTemplate(user: User, notification: {
    title: string;
    message: string;
    type: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title} - KAYTESS</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .notification-${notification.type} { border-left: 4px solid #2563eb; background-color: #f0f9ff; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KAYTESS</h1>
            <p>Healthcare Staffing Platform</p>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>Hello ${user.firstName || 'User'},</p>
            <div class="notification-${notification.type}">
              <p>${notification.message}</p>
            </div>
            <p>Thank you for using KAYTESS!</p>
          </div>
          <div class="footer">
            <p>© 2025 KAYTESS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getShiftNotificationTemplate(user: User, shiftDetails: {
    facilityName: string;
    department: string;
    date: string;
    time: string;
    type: 'application_approved' | 'application_rejected' | 'shift_reminder' | 'shift_cancelled';
  }): string {
    const typeColors = {
      application_approved: '#22c55e',
      application_rejected: '#ef4444',
      shift_reminder: '#f59e0b',
      shift_cancelled: '#ef4444'
    };

    const typeMessages = {
      application_approved: 'Your shift application has been approved!',
      application_rejected: 'Your shift application was not selected this time.',
      shift_reminder: 'Reminder: You have an upcoming shift.',
      shift_cancelled: 'Your shift has been cancelled.'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shift Update - KAYTESS</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .shift-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .status-banner { background-color: ${typeColors[shiftDetails.type]}; color: white; padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 15px; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KAYTESS</h1>
            <p>Healthcare Staffing Platform</p>
          </div>
          <div class="content">
            <h2>Shift Update</h2>
            <p>Hello ${user.firstName || 'User'},</p>
            
            <div class="status-banner">
              ${typeMessages[shiftDetails.type]}
            </div>
            
            <div class="shift-card">
              <h3>Shift Details</h3>
              <p><strong>Facility:</strong> ${shiftDetails.facilityName}</p>
              <p><strong>Department:</strong> ${shiftDetails.department}</p>
              <p><strong>Date:</strong> ${shiftDetails.date}</p>
              <p><strong>Time:</strong> ${shiftDetails.time}</p>
            </div>
            
            <p>Log into your KAYTESS dashboard for more details and next steps.</p>
          </div>
          <div class="footer">
            <p>© 2025 KAYTESS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTemplate(user: User): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to KAYTESS</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .features { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to KAYTESS!</h1>
            <p>Healthcare Staffing Platform</p>
          </div>
          <div class="content">
            <h2>Welcome, ${user.firstName || 'User'}!</h2>
            <p>Thank you for joining KAYTESS, the innovative healthcare staffing platform that connects qualified nurses with healthcare facilities.</p>
            
            <div class="features">
              <h3>What you can do with KAYTESS:</h3>
              <ul>
                <li>Browse and apply for available shifts</li>
                <li>Manage your professional credentials</li>
                <li>Track your work history and earnings</li>
                <li>Receive real-time notifications</li>
                <li>Connect with healthcare facilities</li>
              </ul>
            </div>
            
            <p>To get started, complete your profile and upload your credentials for verification. Once verified, you'll be able to apply for shifts in your area.</p>
            
            <p>If you have any questions, our support team is here to help!</p>
            
            <p>Welcome to the future of healthcare staffing!</p>
          </div>
          <div class="footer">
            <p>© 2025 KAYTESS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getShiftEmailSubject(type: string): string {
    const subjects = {
      application_approved: 'Shift Application Approved',
      application_rejected: 'Shift Application Update',
      shift_reminder: 'Upcoming Shift Reminder',
      shift_cancelled: 'Shift Cancellation Notice'
    };
    return subjects[type as keyof typeof subjects] || 'Shift Update';
  }
}

export const emailService = new EmailService();