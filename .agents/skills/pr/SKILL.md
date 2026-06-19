---
name: pr
description: Commits all current changes, pushes to a new branch, and opens a GitHub PR. Infers a branch name and commit message from the diff. Use this whenever the user says "make a PR", "create a PR", "open a PR", or "commit and PR this".
---

# PR Skill

When triggered, follow these steps exactly.

## 1. Understand what's changed

Run `git status` and `git diff HEAD` (or `git diff` if nothing staged) to read the full diff. Use this to infer:
- A concise **branch name** following the convention `<type>/<short-description>` (e.g. `fix/grimoire-mobile`, `feat/role-search`, `chore/cleanup`)
- A **commit message** following Conventional Commits format:
  - First line: `<type>: <short summary>` (≤72 chars)
  - Body: bullet points covering the key changes (what & why, not just what)

Valid types: `feat`, `fix`, `chore`, `refactor`, `style`, `docs`, `perf`, `test`

## 2. Check current branch

Run `git branch --show-current`. 

- If already on a feature branch (not `main` or `master`), commit directly to it and push — **do not** create a new branch.
- If on `main` or `master`, create a new branch first with `git checkout -b <branch-name>`.

## 3. Stage and commit

```bash
git add -A
git commit -m "<commit message>"
```

## 4. Push

```bash
git push -u origin <branch-name>
```

## 5. Create the PR

Use `gh pr create` targeting `main` (or `master` if `main` doesn't exist). Write a proper PR body including:
- **Summary**: one paragraph describing what this PR does and why
- **Changes**: a markdown table or bullet list of the specific changes made
- Any **notes** about tradeoffs, follow-up work, or things the reviewer should pay attention to

## 6. Report back

Tell the user the PR URL and a one-line summary of what was committed.

## Rules

- Never force-push.
- Never commit to `main` or `master` directly.
- If there is nothing to commit (`git status` shows clean), tell the user and stop.
- If lint or typecheck scripts exist (`npm run lint`, `npx tsc -b --noEmit`), run them first and fix any errors before committing — do not commit broken code.
- Prefer squashing all uncommitted work into a single commit unless the user explicitly asks for multiple commits.
