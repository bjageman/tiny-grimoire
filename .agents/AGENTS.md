# AGENTS.md

This file defines how AI coding agents should work in this repository. Follow these instructions before proposing, generating, or modifying code.

## Purpose

- Act like a careful junior engineer with strong execution speed.
- Prefer small, reviewable changes over broad refactors.
- Optimize for correctness, maintainability, testability, and clear diffs.
- Open draft pull requests for substantial changes unless explicitly told otherwise.
- Do not treat generated code as correct until it has been validated.

## Core rules

- Make the smallest change that fully solves the task.
- Read nearby files and existing patterns before editing.
- Match existing architecture and conventions unless asked to change them.
- Keep edits scoped to the requested work; avoid opportunistic rewrites.
- Do not invent requirements, APIs, configuration, or dependencies.
- Ask for approval before making risky or high-blast-radius changes.

## Commands

Replace the commands below with the exact commands for this repo. Use exact runnable commands with flags.

```bash
# Install dependencies
npm install

# Run the app locally
npm run dev

# Lint
npm run lint

# Typecheck
npx tsc -b

# Run full test suite
npm test

# Run a single test file or focused tests
npx vitest <file-name>

# Build
npm run build
```

## Testing

Testing quality is a first-class requirement.

- Add or update automated tests for every behavior change unless the change is docs-only or pure configuration.
- Prefer focused unit tests for logic changes and integration tests for cross-module behavior.
- Reproduce reported bugs with a failing test first when practical, then fix the bug, then verify the test passes.
- Do not remove tests just to make the suite pass.
- Do not weaken assertions, reduce coverage, or skip tests without explicit approval.
- Run the smallest relevant test scope during iteration, then run the full required checks before finishing.
- If tests cannot be run locally, state that clearly in the PR or handoff notes.
- When adding code, prefer designs that are easy to test without brittle mocking.
- Cover happy path, edge cases, and likely failure modes.

## PR expectations

- Do not create a PR unless the user explicitly asks to do so.
- Do not merge the pull request unless the user explicitly tells you to do so.
- Prefer draft PRs for AI-generated work until validation is complete. Human review is required before merge.
- Keep PRs small enough to review comfortably.
- Include a short summary of what changed, why it changed, and how it was validated.
- List assumptions, known risks, and follow-up work when relevant.
- Separate unrelated changes into different PRs.
- Do not mix formatting-only edits with logic changes unless requested.

## Project structure

Document the real structure of this repository here. Keep it brief and practical.

```text
src/        # application code and unit tests (*.test.ts)
public/     # static assets (icons, images, favicon.svg)
scripts/    # development or CI helpers
```

- Add new code in the most relevant existing module rather than creating new top-level directories.
- Put tests near the established testing location and follow the repository's naming conventions.

## Code style

- Follow existing naming, file organization, and import conventions.
- Prefer clear, explicit code over clever or compressed code.
- Keep functions and modules focused on one responsibility.
- Use descriptive names; avoid single-letter variables except in narrow local contexts.
- Preserve backward compatibility unless the task explicitly allows breaking changes.
- Update comments only when they add real value or are made inaccurate by the code change.

## Line length

Be mindful of line length in all files.

- Keep lines within the repository's configured formatter or linter limit.
- If no limit is configured, prefer a soft limit of 100 characters for code and 80 to 100 characters for prose/comments.
- Break long chains, argument lists, strings, and conditionals across lines cleanly.
- Do not reduce readability just to satisfy line length; restructure code when needed.

## Git workflow

- Use branch names that reflect the change, such as `feat/...`, `fix/...`, or `chore/...`.
- Use clear commit messages that explain intent.
- Before marking work ready, run linting, typechecking, tests, and build steps required by this repo.
- Do not push directly to protected branches.
- Do not force-push over human-authored work without approval.

## Boundaries

### Always do

- Read relevant files before editing.
- Follow the repository's established patterns.
- Add or update tests for behavior changes.
- Prefer minimal diffs and easy-to-review PRs.
- Call out uncertainty instead of guessing.

### Ask first

- Adding or removing dependencies.
- Changing public APIs, database schemas, or migration history.
- Modifying CI, deployment, infrastructure, auth, security, or secrets handling.
- Large refactors, file moves, or cross-cutting renames.
- Editing generated files if the source-of-truth workflow is unclear.

### Never do

- Commit secrets, tokens, or credentials.
- Bypass tests, disable checks, or fake validation.
- Push directly to `main`, `master`, or other protected branches.
- Delete failing tests without explicit approval.
- Rewrite large areas of the codebase outside the task scope.

## Security and safety

- Treat all AI-generated code as untrusted until reviewed and tested.
- Be extra careful with authentication, authorization, input validation, file access, shell execution, and data deletion.
- Prefer safe defaults and least-privilege approaches.
- Surface risky code paths clearly in review notes.

## Handoff notes

When finishing work, include:

- What changed.
- Why it changed.
- What tests or checks were run.
- Any assumptions, limitations, or follow-up items.

## Maintenance

- Keep this file concise, specific, and current.
- Update this file when commands, workflows, architecture, or standards change.
- Link to existing docs instead of duplicating long instructions.
