# Releasing

`main` is the source of truth. The package is published as
[`ms-loop-mcp-server`](https://www.npmjs.com/package/ms-loop-mcp-server).

## First publication

The first version is published interactively from a clean, validated checkout:

```bash
npm login
npm whoami
npm ci
npm run typecheck
npm test
npm run build
npm publish --access public
```

After the package exists, configure npm Trusted Publishing:

- Provider: GitHub Actions
- Organization or user: `vilsonrodrigues`
- Repository: `ms-loop-mcp-server`
- Workflow: `publish.yml`
- Allowed action: publish directly

No npm token is stored in GitHub. The workflow uses short-lived OIDC
credentials and runs only when a GitHub Release is published.

## Subsequent releases

1. Update the version in `package.json` and `package-lock.json`.
2. Move the changelog entries from `Unreleased` into the new version.
3. Run typecheck, tests, build, audit, and inspect `npm pack --dry-run`.
4. Commit and push `main`.
5. Publish a GitHub Release:

   ```bash
   gh release create vX.Y.Z \
     --repo vilsonrodrigues/ms-loop-mcp-server \
     --target main \
     --title "vX.Y.Z" \
     --generate-notes
   ```

6. Confirm the workflow succeeded and verify with:

   ```bash
   npm view ms-loop-mcp-server version
   ```

A package version cannot be overwritten. If a publish fails after npm accepted
the version, increment the version before retrying.
