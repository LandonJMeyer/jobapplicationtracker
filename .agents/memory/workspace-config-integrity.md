---
name: Workspace config integrity
description: Startup failures can come from repeated root configuration documents rather than application code.
---

When every workflow fails before launching and pnpm reports JSON/YAML parse errors, validate the root package, workspace, and TypeScript configuration files for duplicated document blocks before investigating ports or application logic.

**Why:** Repeated configuration content caused pnpm and TypeScript to fail before any service could open its port, making the frontend appear to be an artifact runtime problem.

**How to apply:** Check manifests and compiler/workspace configs with parsers first; only restart workflows after those checks pass.