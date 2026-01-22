# Contributing to Colony Bank HMDA/CRA Tool

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please be respectful and professional in all interactions. We're building software that handles sensitive financial data, so accuracy and attention to detail are paramount.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/colony-bank-hmda-cra-tool.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(etl): add support for tilde-delimited files`
- `fix(parser): handle empty rows in LaserPro export`
- `docs(readme): update installation instructions`

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- etl-utils.test.ts
```

### Code Style

This project uses ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format
```

## Pull Request Process

1. Ensure all tests pass: `npm run test:ci`
2. Ensure no linting errors: `npm run lint`
3. Update documentation if needed
4. Fill out the PR template completely
5. Request review from a maintainer

### PR Requirements

- [ ] All CI checks pass
- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] No breaking changes (or documented if unavoidable)

## Working with ETL Code

### Field Mappings

When adding or modifying field mappings:

1. Update `client/src/lib/etl/field-maps.ts`
2. Add corresponding variations to `FIELD_VARIATIONS`
3. Add tests for new mappings
4. Test with real sample files if available

### Parser Changes

When modifying parsers:

1. Test with multiple file formats
2. Verify delimiter detection works correctly
3. Check edge cases (empty rows, special characters)
4. Update `detectDelimiter` if adding new delimiter support

### Transform Changes

When modifying transform logic:

1. Verify output matches CRA Wiz 128-column format
2. Check that no data is lost in transformation
3. Test with edge cases (missing fields, null values, zeros)

## Reporting Issues

Use the issue templates provided:

- **Bug Report**: For bugs or unexpected behavior
- **Feature Request**: For new feature suggestions

Include as much detail as possible:
- Steps to reproduce
- Expected vs actual behavior
- Sample data (anonymized)
- Screenshots if applicable

## Questions?

Open a discussion or issue if you have questions about contributing.
