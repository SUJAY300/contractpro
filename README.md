# ContractPro 📜
### Blockchain-Based Government Procurement & Milestone Payment System

Built on **Ethereum Sepolia** blockchain with **Supabase** backend.

---

## 🚀 Deploy to Vercel (Recommended — Free)

### Step 1 — Push to GitHub
1. Create a free account at [github.com](https://github.com)
2. Click **"New Repository"** → name it `contractpro` → click **"Create"**
3. Upload all these files to the repository

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → sign up free with GitHub
2. Click **"Add New Project"**
3. Select your `contractpro` repository
4. Framework: **Vite** (auto-detected)
5. Click **"Deploy"**
6. Done! Your app is live at `contractpro.vercel.app` 🎉

---

## 🌐 Deploy to Netlify (Alternative — Free)

1. Go to [netlify.com](https://netlify.com) → sign up free
2. Click **"Add new site"** → **"Import from Git"**
3. Connect GitHub → select `contractpro`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **"Deploy"**

---

## 🔧 Local Development

```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## 🔗 Blockchain Details

| Item | Value |
|------|-------|
| Network | Ethereum Sepolia Testnet |
| Chain ID | 11155111 |
| Contract | `0x265280f7a2356c429604882133E75C4c95fa9Af2` |
| Explorer | [sepolia.etherscan.io](https://sepolia.etherscan.io/address/0x265280f7a2356c429604882133E75C4c95fa9Af2) |

---

## 👥 Demo Login Credentials

| Role | Email | OTP |
|------|-------|-----|
| Government Authority | gov@contractpro.in | (shown on screen) |
| Contractor | contractor@contractpro.in | (shown on screen) |
| Inspector | inspector@contractpro.in | (shown on screen) |
| Auditor | auditor@contractpro.in | (shown on screen) |

---

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Blockchain**: Ethereum Sepolia (Solidity 0.8.20)
- **Authentication**: OTP-based (no MetaMask for users)
- **Wallets**: Custodial (auto-generated, encrypted server-side)

---

## 📁 Project Structure

```
contractpro/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Full application
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── vercel.json           # Vercel SPA routing
├── netlify.toml          # Netlify SPA routing
└── package.json
```

---

Built with ❤️ for transparent government procurement.
