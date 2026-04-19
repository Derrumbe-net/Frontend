# Derrumbe.net – Frontend

This is the frontend of the **Derrumbe.net** unified platform built with **React + Vite**.  
It currently contains the landing page, navigation bar, and placeholder pages for all sections of the platform.

---

## Local Dev Setup

Follow these steps to run the project locally.

### 1️. Clone the Repository

Make sure you have Git installed.  
Clone the repo and navigate to the frontend folder:

```bash
git clone https://github.com/Derrumbe-net/Derrumbe.net.git
cd Derrumbe.net/frontend
```

### 2️. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) ≥ 18 installed (npm comes with Node).  
Then run:

```bash
npm install
```

### 3️. Run the Dev Server

Start the Vite dev server:

```bash
npm run dev
```

### 4️. Open the App in Your Browser

Go to:

```
http://localhost:5173
```

You should see the landing page with the navigation bar and placeholder pages.

---

## Project Structure

```
Derrumbe.net/
├── backend/             # (future backend code / PHP APIs)
└── frontend/
    ├── public/          # Static public assets
    ├── src/
    │   ├── components/  # Shared components (Navbar, etc.)
    │   ├── pages/       # Pages (Landing, Sobre Nosotros, etc.)
    │   └── assets/      # Images, logos
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Notes

- If you get an error like `vite is not recognized`, ensure Node.js and npm are correctly installed and added to your PATH.
- If assets (like the logo) don’t appear, check that `src/assets/` is present in your local clone.

---