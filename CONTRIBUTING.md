# Contributing to Tiny Grimoire

Thank you for your interest in contributing! We welcome community contributions to help improve the grimoire and draft companion.

## Development Setup

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/bjageman/botc-grimoire-companion.git
   cd botc-grimoire-companion
   npm install
   ```

2. **Start the local development server**:
   ```bash
   npm run dev
   ```
   This will boot up Vite at `http://localhost:5173/`.

3. **Production validation**:
   To test a full production build locally:
   ```bash
   npm run build
   npm run preview
   ```

## Development Guidelines

- **TypeScript**: Always write strictly typed TypeScript code. Avoid `any` types where possible.
- **Code Style & Linting**: We use ESLint for linting. Verify your changes pass checks before submitting a PR:
  ```bash
  npm run lint
  ```
- **Responsive Theme Design**: Ensure UI elements look great in both Day (Light) and Night (Dark) modes. Check inputs, selections, modals, and lists in both views.

## Submitting Pull Requests

1. Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and commit using clean Conventional Commits format (e.g. `feat: add awesome feature` or `fix: clean up UI bug`).
3. Push to your branch and open a Pull Request targeting the `main` branch.
4. Ensure all GitHub status checks (ESLint, Type Check, Vite Build, Docker Build) pass successfully before asking to merge.
