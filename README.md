# Colony Bank HMDA/CRA ETL Automation Tool

[![CI](https://github.com/gabbyignacio7/colony-bank-hmda-cra-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/gabbyignacio7/colony-bank-hmda-cra-tool/actions/workflows/ci.yml)
[![Deploy](https://github.com/gabbyignacio7/colony-bank-hmda-cra-tool/actions/workflows/deploy.yml/badge.svg)](https://github.com/gabbyignacio7/colony-bank-hmda-cra-tool/actions/workflows/deploy.yml)

A web-based ETL automation tool for HMDA (Home Mortgage Disclosure Act) and CRA (Community Reinvestment Act) compliance reporting. Transforms monthly loan data processing from a 100+ hour manual process to under 30 minutes with automated validation.

## 🔗 Live Demo

**[https://gabbyignacio7.github.io/colony-bank-hmda-cra-tool/](https://gabbyignacio7.github.io/colony-bank-hmda-cra-tool/)**

## Features

- **Multi-Source Data Processing**: Import data from Encompass, LaserPro/Compliance Reporter, and supplemental files
- **Auto-Detection**: Automatically detects file formats and delimiters (pipe, tilde, tab, semicolon)
- **Smart Merging**: Merges data from multiple sources using ULI, Loan Number, or Address matching
- **Duplicate Detection**: Identifies and handles duplicate records across sources
- **CRA Wiz Export**: Generates properly formatted 128-column CRA Wiz compatible Excel files
- **Field Mapping**: Comprehensive field mapping for HMDA LAR format compliance
- **Validation**: Built-in data validation and auto-correction

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Installation

```bash
# Clone the repository
git clone https://github.com/gabbyignacio7/colony-bank-hmda-cra-tool.git
cd colony-bank-hmda-cra-tool

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
│   │   ├── pages/        # Page components
│   │   └── __tests__/    # Unit tests
│   └── public/           # Static assets
├── server/               # Backend server (dev only)
├── shared/               # Shared types and schemas
├── docs/                 # Documentation
└── package.json
```

## ETL Pipeline

The tool processes data through a modular ETL pipeline:

1. **Parse** - Read and parse input files (Encompass XLSX, LaserPro TXT)
2. **Normalize** - Map field names to standard HMDA format
3. **Merge** - Combine data from multiple sources
4. **Deduplicate** - Remove duplicate records
5. **Transform** - Convert to CRA Wiz 128-column format
6. **Validate** - Check data integrity and auto-correct issues
7. **Export** - Generate formatted Excel output

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

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Contributing Guide](docs/CONTRIBUTING.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [User Manual](client/public/USER_MANUAL.md)

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build**: Vite
- **Server**: Express.js
- **Testing**: Vitest, Testing Library
- **Linting**: ESLint, Prettier
- **CI/CD**: GitHub Actions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built for Colony Bank HMDA/CRA Compliance

**Password:** `ColonyBank2024!`
