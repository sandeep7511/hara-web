# HARA Web — React Frontend

A full hospital management interface built in React + Tailwind CSS,
connecting to the HARA Flask API.

## Local Development

```bash
cd hara-web
npm install
npm start
```
Opens at http://localhost:3000. Requires the Flask API running at http://localhost:5001.

## Deploy to GitHub Pages

### Step 1 — Update homepage in package.json
```json
"homepage": "https://YOUR_USERNAME.github.io/hara-web"
```

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial HARA web app"
git remote add origin https://github.com/sandeep7511/hara-web.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
Go to your repo → **Settings → Pages → Source → GitHub Actions**

The workflow at `.github/workflows/deploy.yml` will build and deploy automatically on every push to main.

### Step 4 — Connect to live API (optional)
The site needs a public API URL to show real data. Use ngrok to expose your local Flask API:
```bash
# Install ngrok from https://ngrok.com
ngrok http 5001
```
Copy the https URL (e.g. https://abc123.ngrok.io).

In GitHub repo → **Settings → Secrets → Actions → New secret**:
- Name: `REACT_APP_API_URL`
- Value: `https://abc123.ngrok.io/api`

Re-run the workflow and the deployed site will connect to your live data.

## Pages

| Page | Description |
|---|---|
| Dashboard | Live patient table, ward occupancy, staff chart |
| Triage | Patient intake with vitals, Gemini AI triage report |
| Ambulance | Smart dispatch with hospital scoring table |
| Imaging | Machine availability toggles, imaging requests |
| Network | Both hospitals overview, distance matrix |
| Agent Log | Full AI decision audit trail |
