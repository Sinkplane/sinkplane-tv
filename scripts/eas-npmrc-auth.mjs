// Runs on EAS build workers via the `eas-build-pre-install` npm script,
// before dependencies are installed. pnpm refuses to expand ${...} env vars
// in the project .npmrc, so the GitHub Packages token (an EAS environment
// variable named GITHUB_PACKAGES_TOKEN — see AGENTS.md) must be written to
// the user-level ~/.npmrc for @sinkplane/shared to resolve. No-op locally
// and on CI runners where the variable is not set.
import { appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const token = process.env.GITHUB_PACKAGES_TOKEN;

if (!token) {
  console.log('GITHUB_PACKAGES_TOKEN is not set; skipping GitHub Packages auth setup.');
} else {
  appendFileSync(join(homedir(), '.npmrc'), `//npm.pkg.github.com/:_authToken=${token}\n`);
  console.log('Added GitHub Packages auth token to ~/.npmrc.');
}
