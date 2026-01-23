// =============================================================================
// Commitlint Configuration - Helps write consistent commit messages
// =============================================================================
// This checks that commit messages follow a simple format.
// Don't worry - if you make a mistake, the error message will help you!
// =============================================================================

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Commit types that are allowed
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting (no code change)
        'refactor', // Code restructuring
        'perf',     // Performance improvement
        'test',     // Tests
        'chore',    // Maintenance
        'ci',       // CI/CD changes
        'revert',   // Revert previous commit
      ],
    ],
    // Be flexible with descriptions
    'subject-case': [0], // Don't enforce case
    'body-max-line-length': [0], // Don't limit body length
  },
  // Helpful error messages
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
