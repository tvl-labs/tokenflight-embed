Guide through a version bump and release preparation for a package.

Ask the user which package to release (swap, adapter-privy, adapter-appkit, or adapter-thirdweb) and the version bump type (patch, minor, or major) if not already specified.

Steps:
1. Read the current version from the target package's `package.json`
2. Calculate the new version based on the bump type (semver)
3. Update the `version` field in the package's `package.json`
4. Run `npx turbo run build --force` to verify the build succeeds
5. Run `pnpm test` to verify tests pass
6. Summarize the changes and remind the user to commit and tag
