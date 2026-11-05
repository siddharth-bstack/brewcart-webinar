# BrewCart – Webinar demo

- `website/` – static demo store (BrewCart). `?v=2` renames ids/classes to simulate a UI redesign (locators change).
- `automation/` – Playwright (JS) checkout workflow + BrowserStack Automate config (`selfHeal: true`).
- `.github/workflows/pages.yml` – deploys `website/` to GitHub Pages on push to `main`.

## Publish to GitHub Pages
1. Create an empty repo on GitHub (e.g. `brewcart-webinar`).
2. `git remote add origin https://github.com/<you>/brewcart-webinar.git`
3. `git branch -M main && git push -u origin main`
4. Repo -> Settings -> Pages -> Source: **GitHub Actions**. Site: `https://<you>.github.io/brewcart-webinar/`

## Run locally
```
cd website && python3 -m http.server 8123
cd automation && npm install
BASE_URL="http://localhost:8123/index.html" npm test
```

## Run on BrowserStack Automate
Credentials come from `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` env vars (never stored in files).

Against the public Pages site (set `browserstackLocal: false` in `automation/browserstack.yml`):
```
cd automation
BUILD_NUMBER=1 BASE_URL="https://<you>.github.io/brewcart-webinar/" npm run test:bstack      # baseline, passes
BUILD_NUMBER=2 BASE_URL="https://<you>.github.io/brewcart-webinar/?v=2" npm run test:bstack  # locators changed -> self-heal
```
Against localhost keep `browserstackLocal: true` and serve `website/` on port 8123.

## Self-healing status
- v=1 baseline on Automate: **passed**.
- v=2 (ids renamed): **failed with timeout on `#open-cart`**, because healing was disabled for the session: the SDK log shows `Authentication Failed. Disabling Healing for this session` / `TCG auth failure`.
- **Pending:** enable AI Self-Heal for the BrowserStack account/plan, then re-run build 2 and confirm healed steps in the Automate session. Rehearse this before the webinar.

## Webinar flow for the self-heal moment
1. Run baseline (v=1) -> green.
2. Open `?v=2` in a browser: same UI, new ids (badge says "locators changed").
3. Re-run the same script, unchanged -> healed + green (once the feature is enabled).
