# Free static deployment

Use Cloudflare Pages Free with its provided pages.dev address. No purchased domain or database is needed.

1. Connect your repository to Pages.
2. Root directory: smart-electricity (blank if this folder is the repository root).
3. Build command: npm run build. Output directory: dist.
4. Deploy the static site without a Worker or backend.

Alternatively build locally and upload dist with Pages Direct Upload: https://developers.cloudflare.com/pages/get-started/direct-upload/
Free limits: https://developers.cloudflare.com/pages/platform/limits/

Vercel: choose smart-electricity as the root; vercel.json builds dist. Check Free/Hobby eligibility for your usage. Remove any old BACKEND_URL variable. If a paid Render service already exists, delete it in your hosting account to stop charges; editing code does not cancel it.

Data stays in each browser. Clearing browser storage removes records and reports. Export CSV before clearing it. Old database files are not used or imported.
