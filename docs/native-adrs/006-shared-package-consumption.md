# ADR 006: Shared Package Consumption

- **Status:** Accepted for Phase 1
- **Context:** The native repo (`shoonaya-mobile`) must consume core domain logic from shared TypeScript packages (like `@sangam/panchang-engine` and `@sangam/pathshala-engine`) located in the web repo (`Sanatan Sangam/Shoonaya/packages`). Copying the source directly violates Phase 1 rules.
- **Decision:** Use an `npm pack` Tarball Workflow for Phase 1. 
- **Alternatives considered:**
  - **Local `file:` link:** Rejected because EAS Build only uploads the root project folder, causing builds to fail when referencing paths outside the native repo.
  - **Monorepo (Yarn/NPM Workspaces):** Rejected for Phase 1 as it requires significant restructuring and migrating git histories.
  - **Private NPM Registry:** Rejected for Phase 1 to avoid billing and CI authentication overhead.
- **Security/privacy impact:** Low. The tarball is internally built and committed to the native repo, avoiding runtime registry credentials. Review tarball contents with `npm pack --dry-run` before updating.
- **Store-compliance impact:** None.
- **Developer Workflow:**
  1. Modify code in the relevant shared package under `packages/`.
  2. Build the package from the web repo, for example `npm run build --workspace=@sangam/panchang-engine`.
  3. Run `npm pack` from the package directory.
  4. Move the generated `.tgz` into `shoonaya-mobile/vendor/`.
  5. Run `npm install ./vendor/<package-name-version>.tgz` in the native repo.
- **Versioning/Rollback:** Controlled via `git commit` in the native repo containing both the updated tarball and `package.json` lockfile.
- **Expo/Metro Implications:** Functions exactly like a standard remote NPM package, perfectly avoiding any Metro symlink/watchFolder bugs.
- **Risk of Duplicate Domain Logic:** Eliminates native duplication by fully importing compiled types/functions from the canonical shared package.
- **Verification plan:** Import a type from the shared package in a dedicated compile-time proof file, run native `npm run typecheck`, run `npx expo-doctor`, and later verify an EAS Build before release.
- **Open questions:** 
  - Should we automate the tarball generation and copy process using a local sync script?
