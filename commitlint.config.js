// Conventional Commits, checked in CI on every PR (commits and PR title).
// - subject-case off: subjects name things like Z1…Z6, PR #36 or T11.
// - long body lines only warn: bodies may carry URLs.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'body-max-line-length': [1, 'always', 100],
  },
};
