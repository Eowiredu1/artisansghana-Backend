# Overview

This is a full-stack artisan marketplace application built with React, Express, and PostgreSQL. The platform serves multiple user roles including buyers, sellers, clients, and admins. Buyers can browse and purchase construction materials, sellers can manage product inventory, clients can track custom project progress with contractors, and admins oversee the entire system. The application features e-commerce functionality with shopping cart, order management, and project milestone tracking with image uploads.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with role-based protected routes
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation schemas
- **Authentication**: Context-based auth provider with session management

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy using scrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **File Uploads**: Multer for handling image uploads with local file storage
- **API Design**: RESTful API with role-based access control middleware
- **Middleware**: Custom authentication and authorization middleware for route protection

## Database Design
- **ORM**: Drizzle ORM with Neon PostgreSQL serverless connection
- **Schema**: Comprehensive schema covering users, products, orders, projects, and progress tracking
- **User Roles**: Enum-based role system (buyer, seller, client, admin)
- **Relationships**: Proper foreign key relationships between entities
- **Migration**: Drizzle Kit for database migrations and schema management

## Data Models
- **Users**: Role-based user system with business profile support
- **Products**: Full e-commerce product catalog with categories and inventory
- **Orders**: Complete order management with line items and status tracking
- **Projects**: Custom project tracking with milestone-based progress
- **Progress Images**: Image upload system for project documentation
- **Cart**: Session-based shopping cart functionality

## File Upload System
- **Storage**: Local file system storage with organized directory structure
- **Processing**: Multer middleware for multipart form handling
- **Security**: File type validation and unique filename generation
- **Serving**: Static file serving with CORS headers for image access

## Authentication & Authorization
- **Strategy**: Session-based authentication with secure password hashing
- **Role Management**: Granular role-based access control throughout the application
- **Session Storage**: PostgreSQL-backed session persistence
- **Password Security**: Scrypt-based hashing with salt for secure credential storage

# External Dependencies

- **Database**: Neon PostgreSQL serverless database with connection pooling
- **UI Library**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **Validation**: Zod for runtime type validation and schema definition
- **File Handling**: Multer for multipart form processing and file uploads
- **Date Utilities**: date-fns for date manipulation and formatting
- **Development**: Vite with React plugin for fast development and building