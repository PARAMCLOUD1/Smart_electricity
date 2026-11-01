# Free static deployment

## Render static site

Primary Render URL: https://paramsmartelectricitysystem.onrender.com/

The URL contains the personalized name; the app retains its original VOLT / GRID branding. The previous `smart-electricity.onrender.com` deployment remains available for existing links.

The repository-root `render.yaml` declares a static site, not a paid web server. Use a new Render Blueprint with `https://github.com/PARAMCLOUD1/Smart_electricity`, or create a Static Site manually with root directory `smart-electricity`, build command `npm run build`, and publish directory `dist`. The application needs no environment variables, database, disk or start command. Render serves the built files on its provided onrender.com address. Account authorization is required before creating the service. Hash routes such as `/#algorithm-report` work without rewrite rules.

## Vercel (live)

https://smart-electricity-three.vercel.app/

The CLI project is linked locally. The site is deployed, but the automatic GitHub integration still requires authorization in Vercel. Manual redeployment works from `smart-electricity` using `npx vercel deploy --prod`. Keep `.vercel` ignored because it is local project metadata.

## GitHub Pages (current deployment)

Live site: https://paramcloud1.github.io/Smart_electricity/

The `main` branch contains source and documentation. The `gh-pages` branch contains only the output of `npm run build`, plus `.nojekyll` and `deployment.json`. GitHub Pages publishes the root of `gh-pages`. No database, server, domain purchase or API key is needed by the website. Source changes must be rebuilt and published to `gh-pages` before they appear on the live site. The deployment metadata identifies the published source commit.

Open `/#algorithm-report` on the live site to run the performance report. Themes and electricity records are stored separately for the hosted origin; localhost records are not automatically uploaded.

Use Cloudflare Pages Free with its provided pages.dev address. No purchased domain or database is needed.

1. Connect your repository to Pages.
2. Root directory: smart-electricity (blank if this folder is the repository root).
3. Build command: npm run build. Output directory: dist.
4. Deploy the static site without a Worker or backend.

Alternatively build locally and upload dist with Pages Direct Upload: https://developers.cloudflare.com/pages/get-started/direct-upload/
Free limits: https://developers.cloudflare.com/pages/platform/limits/

Vercel: choose smart-electricity as the root; vercel.json builds dist. Check Free/Hobby eligibility for your usage. Remove any old BACKEND_URL variable. If a paid Render service already exists, delete it in your hosting account to stop charges; editing code does not cancel it.

Data stays in each browser. Clearing browser storage removes records and reports. Export CSV before clearing it. Old database files are not used or imported.
