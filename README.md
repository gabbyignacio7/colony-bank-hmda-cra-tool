# Colony Bank HMDA/CRA ETL Automation Tool

A web-based ETL automation tool for HMDA (Home Mortgage Disclosure Act) and CRA (Community Reinvestment Act) compliance reporting. Transforms monthly loan data processing from a 100+ hour manual process to under 30 minutes with automated validation.

## Features

- **Multi-Source Data Import**: Processes LaserPro, Encompass, and Supplemental exports (.xlsx, .xls, .csv)
- **Automated ETL Pipeline**: Filters, transforms, merges, and validates loan records
- **CRA Wiz Export**: Generates compliant 128-column output ready for regulatory submission
- **Real-Time Validation**: 14+ automated validation rules catch errors before submission
- **Client-Side Processing**: Sensitive loan data never leaves the browser
- **Mail Merge Export**: Excel output formatted for Word templates

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| UI Components | shadcn/ui (Radix primitives) |
| State Management | TanStack React Query |
| Routing | Wouter |
| Backend | Node.js, Express |
| Build | Vite 7, esbuild |
| Database | PostgreSQL + Drizzle ORM (optional) |

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher

## Getting Started

```bash
# Clone the repository
git clone git@github.com:deepseeai/colony-bank-hmda-tool.git
cd colony-bank-hmda-tool

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5000

**Password:** `ColonyBank2024!`

## Project Structure

```
colony-bank-hmda-tool/
├── attached_assets/            # Development assets & test data
│   ├── *.xlsx, *.csv           # Sample exports and expected outputs
│   ├── *.mp4                   # Tutorial video
│   └── *.zip                   # Bundled assets
├── client/                     # Frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── lib/                # Core business logic
│   │   │   ├── etl-engine.ts   # ETL processing engine
│   │   │   ├── cra-wiz-transform.ts  # CRA Wiz format conversion
│   │   │   └── verification.ts # Validation rules
│   │   ├── pages/              # Page components
│   │   └── hooks/              # Custom React hooks
│   └── public/
│       ├── test_data/          # Sample test files
│       └── assets/             # Static assets (learning center)
├── server/                     # Express backend
│   ├── index.ts                # Server entry point
│   ├── routes.ts               # API routes
│   └── storage.ts              # Data storage layer
├── shared/                     # Shared types and schemas
│   └── schema.ts               # Database schema (Drizzle)
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## Test Files

Sample files for testing are in `client/public/test_data/`:

| File | Purpose |
|------|---------|
| `01_LaserPro_Export.xlsx` | Input A - Core loan origination data |
| `02_Encompass_Export.xlsx` | Input B - Borrower details and property info |
| `03_Supplemental_Export.xlsx` | Input C - Demographics data |
| `08_Sample_Loan_Text.txt` | Document Intelligence test file |

## Workflow

1. **Data Sources** - Upload LaserPro, Encompass, and Supplemental exports
2. **ETL Processing** - Automated filtering, transformation, and merging
3. **Review & Scrub** - Review validation errors and correct issues
4. **Export** - Download CRA Wiz-ready file and mail merge data

## Key Design Decisions

- **Client-Side Processing**: File parsing runs in the browser to keep sensitive loan data local
- **Password Protection**: Server-validated authentication before tool access
- **Audit Trail**: Processing sessions logged with timestamps and validation results
- **Multi-Phase Workflow**: Guided process ensures data quality at each step

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `GITHUB_PAGES_BASE` | Base path for GitHub Pages | `/` |

## License

MIT