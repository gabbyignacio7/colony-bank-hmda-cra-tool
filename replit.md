# Colony Bank HMDA/CRA ETL Automation Tool

## Overview

This is a web-based ETL (Extract, Transform, Load) automation tool for Colony Bank's monthly HMDA (Home Mortgage Disclosure Act) and CRA (Community Reinvestment Act) compliance reporting. The tool processes loan data from multiple source systems (LaserPro, Encompass, and Supplemental exports), validates the data, and generates formatted outputs ready for CRA Wiz import and regulatory submission.

The application reduces what was previously a 100+ hour monthly manual process to under 10 hours with improved accuracy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter (lightweight React router)
- **UI Components**: Radix UI primitives wrapped with shadcn/ui styling

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api/` prefix
- **Authentication**: Simple password-based gate (server-validated)
- **Build**: esbuild for production bundling

### Data Processing
- **Excel Processing**: xlsx library for reading/writing Excel and CSV files
- **ETL Engine**: Custom client-side TypeScript engine (`client/src/lib/etl-engine.ts`)
- **Validation**: Schema-based validation with Zod
- **Transformations**: CRA Wiz format conversion with 128-column output specification

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM (configured but primarily uses in-memory storage)
- **Session Storage**: In-memory storage for audit logs during development
- **Schema Location**: `shared/schema.ts` defines the processing audit log table

### Key Design Decisions

1. **Client-Side Processing**: File parsing and ETL logic runs in the browser to avoid server file uploads for sensitive loan data
2. **Multi-Phase Workflow**: 
   - Phase 1: Data Sources (upload LaserPro, Encompass, Supplemental files)
   - Phase 2: ETL Processing (validation, transformation, merging)
   - Phase 3: Review and Export (CRA Wiz format output)
3. **Password Protection**: Server-validated authentication before accessing the tool
4. **Audit Trail**: Processing sessions logged with timestamps, record counts, and validation errors

## External Dependencies

### Core Libraries
- `xlsx`: Excel file reading/writing for .xlsx, .xls, and .csv formats
- `drizzle-orm` + `@neondatabase/serverless`: PostgreSQL ORM (Neon serverless driver)
- `@tanstack/react-query`: Async state management
- `zod`: Runtime type validation and schema definition

### UI Components
- Full shadcn/ui component suite (accordion, dialog, tabs, cards, etc.)
- `lucide-react`: Icon library
- `embla-carousel-react`: Carousel functionality
- `recharts`: Data visualization (via chart component)

### Build & Development
- Vite with React plugin
- Tailwind CSS v4 with `@tailwindcss/vite`
- TypeScript with strict mode
- `drizzle-kit`: Database migrations and schema management

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Asset mapping (dev only)
- `@replit/vite-plugin-dev-banner`: Development mode indicator