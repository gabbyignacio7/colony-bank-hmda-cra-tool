# Colony Bank HMDA/CRA ETL Automation Tool

**Built by [DeepSee.ai](https://deepsee.ai)**

**[Live Demo](https://deepseeai.github.io/colony-bank-hmda-tool/)**

A web-based ETL automation tool for HMDA (Home Mortgage Disclosure Act) and CRA (Community Reinvestment Act) compliance reporting. Transforms monthly loan data processing from a 100+ hour manual process to under 30 minutes with automated validation.

## Overview

This tool automates the tedious manual workflow of preparing HMDA and CRA data for CRAWiz SaaS import. It eliminates the need for manual VLOOKUP formulas and column header conversions by automatically:

- Parsing exports from **LaserPro/Compliance Reporter** and **Encompass**
- Merging supplemental data (APR, Rate Lock Date, Lender, Processor, Post Closer, Borrower Names)
- Transforming data to the **126-column CRAWiz-compatible format**
- Detecting and handling duplicate records by ULI

## Features

### Data Sources Supported
| Source | Format | Description |
|--------|--------|-------------|
| **Compliance Reporter** | Pipe-delimited TXT | HMDA LAR export via LaserPro |
| **Encompass HMDA Export** | Excel (Post 2019) | Primary HMDA data from Encompass |
| **Encompass Additional Fields** | Excel | Supplemental data (names, staff, branch) |

### Automated VLOOKUP Replacement
The tool automatically merges these fields from the Additional Fields file by matching on ULI/ApplNumb:

| Field | Output Column |
|-------|---------------|
| APR | `APR` |
| Rate Lock Date | `Rate_Lock_Date` |
| Loan Officer | `Lender` |
| Processor | `AA_Processor` |
| Post Closer | `LDP_PostCloser` |
| Borrower First Name | `FirstName` |
| Borrower Last Name | `LastName` |
| Co-Borrower Names | `Coa_FirstName`, `Coa_LastName` |
| Branch Number | `Branch` |
| Branch Name | `Branch_Name` |

### Key Capabilities
- **Auto-Detection**: Automatically detects file formats and delimiters (pipe, tilde, tab, semicolon)
- **Smart Merging**: Merges data using ULI, Loan Number, or Address+City matching
- **Duplicate Detection**: Identifies duplicate records across sources
- **126-Column Output**: Generates CRAWiz-compatible format with exact column order
- **Field Mapping**: 200+ field name variations mapped to standard output columns
- **Validation**: Built-in HMDA code validation and auto-correction
- **Branch VLOOKUP**: Automatic branch name lookup from branch number

## Output Schema

The tool generates a **126-column** output file matching the CRAWiz import format:

```
Branch_Name, Branch, LEI, ULI, LastName, FirstName, Coa_LastName, Coa_FirstName,
Lender, AA_Processor, LDP_PostCloser, ErrorMadeBy, ApplDate, LoanType, Purpose,
ConstructionMethod, OccupancyType, LoanAmountInDollars, Preapproval, Action,
ActionDate, Address, City, State_abrv, Zip, County_5, Tract_11, Ethnicity_1-5,
EthnicityOther, Coa_Ethnicity_1-5, Coa_EthnicityOther, Ethnicity_Determinant,
Coa_Ethnicity_Determinant, Race_1-5, Race1_Other, Race27_Other, Race44_Other,
CoaRace_1-5, CoaRace1_Other, CoaRace27_Other, CoaRace44_Other, Race_Determinant,
CoaRace_Determinant, Sex, CoaSex, Sex_Determinant, CoaSex_Determinant, Age,
Coa_Age, Income, Purchaser, Rate_Spread, HOEPA_Status, Lien_Status, CreditScore,
Coa_CreditScore, CreditModel, CreditModelOther, Coa_CreditModel, Coa_CreditModelOther,
Denial1-4, DenialOther, TotalLoanCosts, TotalPtsAndFees, OrigFees, DiscountPts,
LenderCredts, InterestRate, APR, Rate_Lock_Date, PPPTerm, DTIRatio, DSC, CLTV,
Loan_Term, Loan_Term_Months, IntroRatePeriod, BalloonPMT, IOPMT, NegAM, NonAmortz,
PropertyValue, MHSecPropType, MHLandPropInt, TotalUnits, MFAHU, APPMethod,
PayableInst, NMLSRID, AUSystem1-5, AUSystemOther, AUSResult1-5, AUSResultOther,
REVMTG, OpenLOC, BUSCML, EditStatus, EditCkComments, Comments
```

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Installation

```bash
# Clone the repository
git clone https://github.com/deepseeai/colony-bank-hmda-tool.git
cd colony-bank-hmda-tool

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Build

```bash
# Build for production
npm run build

# Build client only (for GitHub Pages)
npm run build:client
```

## ETL Pipeline

The tool processes data through a modular ETL pipeline:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  LaserPro/      │     │   Encompass     │     │   Encompass     │
│  Compliance     │     │   HMDA Export   │     │   Additional    │
│  Reporter TXT   │     │   (Excel)       │     │   Fields        │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       │
    ┌────────────────────────────────────┐               │
    │         1. PARSE                   │               │
    │    Auto-detect format/delimiter    │               │
    └────────────────┬───────────────────┘               │
                     ▼                                   │
    ┌────────────────────────────────────┐               │
    │         2. NORMALIZE               │               │
    │    Map 200+ field variations       │               │
    └────────────────┬───────────────────┘               │
                     ▼                                   ▼
    ┌────────────────────────────────────────────────────────┐
    │                    3. MERGE                            │
    │    Join by ULI/ApplNumb (replaces manual VLOOKUP)     │
    │    Add: APR, Lender, Processor, PostCloser, Names     │
    └────────────────────────┬───────────────────────────────┘
                             ▼
    ┌────────────────────────────────────┐
    │         4. DEDUPLICATE             │
    │    Remove duplicate ULIs           │
    └────────────────┬───────────────────┘
                     ▼
    ┌────────────────────────────────────┐
    │         5. TRANSFORM               │
    │    Convert to 126-column format    │
    │    Branch VLOOKUP, date conversion │
    └────────────────┬───────────────────┘
                     ▼
    ┌────────────────────────────────────┐
    │         6. VALIDATE                │
    │    HMDA code validation            │
    │    Auto-correct common issues      │
    └────────────────┬───────────────────┘
                     ▼
    ┌────────────────────────────────────┐
    │         7. EXPORT                  │
    │    Generate Excel/CSV output       │
    │    CRAWiz-compatible format        │
    └────────────────────────────────────┘
```

## Project Structure

```
colony-bank-hmda-tool/
├── .github/              # GitHub Actions workflows and templates
│   ├── workflows/
│   │   ├── ci.yml        # Continuous Integration
│   │   ├── deploy.yml    # GitHub Pages deployment
│   │   ├── auto-fix.yml  # Auto-format PRs
│   │   └── release.yml   # Release automation
│   └── ISSUE_TEMPLATE/
├── client/               # Frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Core libraries
│   │   │   └── etl/      # ETL processing modules
│   │   │       ├── field-maps.ts   # 126-column schema & field mappings
│   │   │       ├── parsers.ts      # File parsers
│   │   │       ├── merge.ts        # Data merging (VLOOKUP replacement)
│   │   │       ├── transform.ts    # Data transformation
│   │   │       └── utils.ts        # Utility functions
│   │   ├── pages/        # Page components
│   │   └── __tests__/    # Unit tests
│   └── public/           # Static assets & test data
├── server/               # Backend server (dev only)
├── shared/               # Shared types and schemas
├── docs/                 # Documentation
└── package.json
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:client` | Build client only |
| `npm test` | Run tests in watch mode |
| `npm run test:ci` | Run tests once (CI) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run typecheck` | TypeScript type checking |

## HMDA Workflow Integration

This tool integrates with the existing HMDA Scrub Procedures:

### Before (Manual Process)
1. Export from LaserPro → Compliance Reporter → Text file
2. Export from Encompass → Excel file
3. Manually convert column headers to CRAWiz format
4. Create VLOOKUP formulas to add APR, Lender, Processor, etc.
5. Copy/paste merged data
6. Save as Tab Delimited

### After (With This Tool)
1. Upload LaserPro/Compliance Reporter export
2. Upload Encompass HMDA export
3. Upload Encompass Additional Fields
4. Click "Process" → Automatically merged & formatted
5. Download CRAWiz-ready file

**Time Savings:** 30-60 minutes of manual work reduced to < 5 minutes

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Contributing Guide](docs/CONTRIBUTING.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [User Manual](client/public/USER_MANUAL.md)

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Build**: Vite
- **Server**: Express.js
- **Excel Processing**: SheetJS (xlsx)
- **Testing**: Vitest, Testing Library
- **Linting**: ESLint, Prettier
- **CI/CD**: GitHub Actions

## License

This project is proprietary software built for Colony Bank by DeepSee.ai.

---

**Built by [DeepSee.ai](https://deepsee.ai)** | Colony Bank HMDA/CRA Compliance
