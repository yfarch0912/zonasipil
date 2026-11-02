# Deployment Guide — GitHub Pages

STRUKTURA v1 is a static site. The only sanctioned production target is the
GitHub Pages site of `yfarch0912/software-perhitungan-struktur`.

- **URL:** https://yfarch0912.github.io/software-perhitungan-struktur/
- **Vite base:** `/software-perhitungan-struktur/` (config/vite.config.ts) —
  must equal the repository name for a project site.
- **Workflow:** `.github/workflows/pages.yml` — on push to `main` or
  `feature/struktura-engineering-platform` (and manual dispatch): npm ci →
  npm test → npm run build → upload `dist/` → deploy-pages.

## One-time enablement (repository owner, in GitHub UI)
1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   (Until this is set, the workflow's deploy step cannot publish — the
   workflow file alone does not enable Pages.)
2. Merge/push the branch, watch **Actions → Deploy STRUKTURA to GitHub Pages**.
3. Open the URL above; hard-refresh once (Pages CDN) and verify the dashboard
   loads and the editor opens a sample.

## Local development
```
npm install
npm run dev      # http://localhost:5173/software-perhitungan-struktur/
npm test         # vitest: benchmarks + unit tests
npm run build    # tsc + production build to dist/
npm run preview  # serve dist locally
```

## Rollback
Re-run the workflow from a previous commit (Actions → workflow → Run
workflow on that ref), or revert the offending commit and push. Pages keeps
no server state; user projects live in visitors' browsers, unaffected.
