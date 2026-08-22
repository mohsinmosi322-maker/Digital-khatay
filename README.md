# Digital Khata — Debit & Recovery Ledger

A professional, offline-first web application for managing customer debit accounts and payment recovery. Built with React 18 + Vite, Tailwind CSS, and Recharts. All data is stored in the browser (LocalStorage) — no backend required.

![Tech](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Customer list** with search, sort (name / pending / total / recent), and filter (all / pending / settled)
- **Date-wise ledger** per customer: Bill No, Amount (debit), Received, Received Date, running balance
- **Dashboard** with KPIs, monthly bar chart, recovery pie chart, and top outstanding customers
- **Excel / CSV import** (flexible column matching)
- **Export to CSV** (single customer or full export) + JSON backup
- **Dark mode** toggle
- **Print-friendly** ledger layout
- **Fully responsive** (mobile, tablet, desktop)
- **Offline** — works without internet after first load
- **Free hosting** on GitHub Pages

## Color Scheme

| Role        | Hex       | Usage                    |
|-------------|-----------|--------------------------|
| Primary     | `#185FA5` | Brand, debit amounts     |
| Success     | `#3B6D11` | Received amounts         |
| Danger      | `#E24B4A` | Pending / outstanding    |

## Quick Start (Local Development)

```bash
# Clone (or download) this repo
git clone https://github.com/YOUR_USERNAME/digital-khata.git
cd digital-khata

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build for Production

```bash
npm run build
```

Output is in the `dist/` folder.

## Deploy to GitHub Pages (FREE)

### 1. Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `digital-khata` (or any name)
3. Keep it public (required for free GitHub Pages)
4. Do **not** initialize with README (we already have one)

### 2. Push this project

```bash
cd digital-khata
git init
git add .
git commit -m "Initial commit: Digital Khata"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/digital-khata.git
git push -u origin main
```

### 3. Configure the base path

Open `vite.config.js` and set `base` to match your repo name:

```js
base: process.env.NODE_ENV === 'production' ? '/digital-khata/' : '/',
```

- If your repo is `https://github.com/USERNAME/digital-khata` → use `'/digital-khata/'`
- If you use a custom domain or `USERNAME.github.io` root repo → use `'/'`

### 4. Deploy

**Option A — gh-pages package (recommended)**

```bash
npm install -D gh-pages
npm run deploy
```

This builds the app and pushes the `dist` folder to the `gh-pages` branch.

**Option B — GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

Then enable Pages in **Settings → Pages → Source: GitHub Actions**.

### 5. Enable GitHub Pages

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch** → branch `gh-pages` / folder `/ (root)`  
   **or** Source: **GitHub Actions** (if using Option B)
3. Wait 1–2 minutes. Your app will be live at:

```
https://YOUR_USERNAME.github.io/digital-khata/
```

## Excel Import Format

Your spreadsheet should have a header row. Column names are matched flexibly (case-insensitive):

| Expected meaning | Accepted headers (examples)                          |
|------------------|------------------------------------------------------|
| Customer Name    | Customer Name, Customer, Name, Party, Party Name     |
| Date             | Date, Bill Date, Txn Date                            |
| Bill No          | Bill No, Bill, Invoice, Invoice No                   |
| Amount (Debit)   | Amount, Debit, Total, Bill Amount, DR                |
| Received         | Received, Payment, Credit, Paid, CR                  |
| Received Date    | Received Date, Payment Date, Paid Date               |

Multiple rows for the same customer are grouped automatically.

## Sample Data Structure (JSON)

```json
[
  {
    "id": "abc123",
    "name": "Ali Traders",
    "transactions": [
      {
        "id": "tx1",
        "date": "2026-01-15",
        "billNo": "INV-001",
        "amount": 50000,
        "received": 20000,
        "receivedDate": "2026-01-20"
      }
    ],
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-20T12:00:00.000Z"
  }
]
```

## Project Structure

```
digital-khata/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # Analytics + import/export
│   │   ├── Ledger.jsx         # Customer date-wise ledger
│   │   └── Sidebar.jsx        # Customer list + nav
│   ├── context/
│   │   └── AppContext.jsx     # Global state (LocalStorage)
│   ├── utils/
│   │   ├── excel.js           # Import / export helpers
│   │   └── storage.js         # LocalStorage + formatters
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css              # Tailwind + print styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start development server             |
| `npm run build`   | Production build → `dist/`           |
| `npm run preview` | Preview production build locally     |
| `npm run deploy`  | Build + publish to GitHub Pages      |

## Privacy & Data

- All data lives in **your browser’s LocalStorage**.
- Nothing is sent to any server.
- Clearing browser data will erase the ledger — use **Export CSV** or **Backup JSON** regularly.
- Works offline once loaded (PWA-ready structure; you can add a service worker later if desired).

## License

MIT — free for personal and commercial use.

---

Built for shopkeepers, wholesalers, and small businesses who need a simple, reliable khata system without monthly fees.
