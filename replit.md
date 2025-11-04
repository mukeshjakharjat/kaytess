# KAYTESS - Healthcare Staffing Platform

## Overview
KAYTESS is a comprehensive healthcare staffing platform that optimizes workforce allocation and nurse engagement through intelligent, data-driven technology. It serves three main user types: Admins (managing accounts, payments, facility verification), Nursing Homes (posting shifts, reviewing applications, handling payments), and Nurses (applying for shifts, completing credentials, receiving notifications). The platform's vision is to streamline healthcare staffing, offering a robust solution for efficient staff deployment and enhanced professional experiences for nurses.

## User Preferences
- **Mobile-first approach**: All interfaces must be fully responsive and touch-friendly
- **Dark mode support**: Users require comprehensive dark mode implementation
- **Complete data persistence**: All form submissions must save and display correctly
- **Verification workflows**: Admin panel must provide comprehensive tools for reviewing credentials
- **Role-based access**: Strict separation of functionality by user role

## System Architecture

### UI/UX Decisions
The platform features a mobile-first responsive design, ensuring optimal experience across all devices. It incorporates dark mode support with localStorage persistence, providing a comfortable viewing experience. Design is based on Tailwind CSS and shadcn/ui for a modern, consistent, and responsive system. Components are touch-optimized with 60px minimum touch targets for interactive elements and collapsible navigation for mobile devices. Celebration animations, hover effects, and smooth Framer Motion transitions are used for an enhanced user experience, particularly in onboarding flows.

### Technical Implementations
The backend is built with Node.js and TypeScript, utilizing an Express.js server for session-based authentication and RESTful API endpoints. PostgreSQL is used as the database with Drizzle ORM for type-safe data operations. Role-based access control (admin, nurse, nursing_home) is strictly enforced. The frontend uses React with TypeScript for type-safe component development, Wouter for routing, and TanStack Query for efficient server state management and caching.

### Feature Specifications
- **Multi-role Authentication System**: Secure login/logout with session persistence, role-based dashboard routing, and access control.
- **Admin Panel**: Mobile-responsive with dark mode, verification center for nurse and facility credentials, user management, shift management, system-wide push notification management, and detailed statistics.
- **Nursing Home Dashboard**: Facility profile management, shift creation and management, application review system with approval/rejection workflows, and integrated credential section.
- **Nurse Dashboard**: Comprehensive credential management (including document uploads), shift browsing and application functionality, profile management with verification status tracking, and optimized forms.
- **Comprehensive Push Notification System**: Real-time browser notifications for over 15 types (shift, payment, verification, system updates) with persistence in the database, role-based filtering, and an admin testing interface.
- **Running Shifts System**: Voice/beep notifications, start/end time tracking, hour calculation, and healthcare center to admin to nurse payment flow with status tracking.

### System Design Choices
- **Session-based authentication**: Chosen for simplicity and security.
- **Drizzle ORM**: Selected for type-safe database operations.
- **TanStack Query**: Implemented for efficient data fetching and caching.
- **Component-based architecture**: Ensures maintainable and reusable UI elements.
- **Database Schema**: Includes Users (role-based), Facilities, Departments, Shifts, Shift Applications, Notifications, and Payments tables to support all core functionalities.

## External Dependencies
- **PostgreSQL**: Relational database for data persistence.
- **Express.js**: Node.js web application framework.
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **React**: JavaScript library for building user interfaces.
- **Wouter**: Lightweight React router.
- **TanStack Query**: Data-fetching library for React.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Component library built with Tailwind CSS.
- **Web Notifications API**: For browser-based push notifications.
- **Framer Motion**: For animations and transitions.