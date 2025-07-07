# ROMASHKA

## Why Two `package.json` and `node_modules`?

- **Root `package.json` and `node_modules`**: Used for project-level scripts, configuration, and dependency management (e.g., linting, formatting, deployment scripts, monorepo tooling).
- **`romashka/package.json` and `node_modules`**: Contains the actual app's dependencies, scripts, and build configuration. All app code, builds, and runtime dependencies are managed here.

**Best Practice:**
- This structure is common in monorepos or when you want to separate project tooling from app code. It keeps the app isolated and makes deployment, testing, and CI/CD more modular and maintainable. 