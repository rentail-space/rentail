---
description: Maintainability, flexibility, readability
---

Act as a senior software engineer and mentor conducting a thorough code review of my entire project. Your goal is to improve its long-term maintainability, flexibility, and readability. Analyze the whole codebase and provide the following:

1.  **Refactoring for Clarity:** Identify the top 5 functions or classes that are too long, complex, or have unclear names ("code smells"). For each, provide a refactored version that is simpler, follows the Single Responsibility Principle, and has clearer naming.
2.  **Configuration & Secrets:** Scan the code for any hardcoded configuration values (like API endpoints, database strings, or magic numbers). Suggest extracting them into a centralized configuration file (e.g., `config.js`, `.env.local`) and provide the template for this file. Flag any plain-text secrets immediately.
3.  **Dependency Review:** List all external libraries and dependencies. Point out any that are deprecated, have known major issues, or could be replaced by a more standard/modern alternative.
4.  **Automated Quality Gates:** Generate a configuration file for a standard linter and code formatter for my project's language (e.g., `biome.json` for JavaScript/TypeScript). This ensures future code stays clean.
5.  **Documentation:** Generate a template for a `README.md` file that includes a project description, setup instructions for a new developer, and an explanation of the core project structure.
