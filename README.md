# CryptoFolio

Application web de gestion de portefeuille crypto. Permet de suivre ses actifs, visualiser l'evolution de son portefeuille et consulter les cours en temps reel.

## Demo

- **Frontend** : https://glowing-piroshki-57fdbf.netlify.app
- **Backend API** : https://cryptofolio-8qgg.onrender.com

## Fonctionnalites

- Ajout d'actifs crypto avec recherche en temps reel (API CoinGecko)
- Visualisation du cours de chaque crypto avant achat (graphique interactif)
- Tableau de bord avec valeur totale du portefeuille et P&L
- Graphique d'evolution du portefeuille
- Page marches avec le top 20 des cryptos (prix, variation 24h/7j, market cap, sparklines)
- Suppression d'actifs avec modal de confirmation
- Prix actualises en temps reel

## Architecture

Monorepo avec npm workspaces et Turborepo :

```text
.
├── client/          # Frontend Vue.js 3
│   ├── src/
│   │   ├── components/    # PortfolioChart, MarketTicker
│   │   ├── views/         # HomeView, PortfolioView, MarketView, AddAssetView
│   │   ├── stores/        # Pinia store (portfolio)
│   │   ├── services/      # API client, CoinGecko service
│   │   └── router/        # Vue Router config
│   └── ...
├── server/          # Backend Node.js / Fastify
│   ├── src/
│   │   ├── crypto/        # Asset schema + routes CRUD
│   │   ├── users/         # Auth routes, user routes
│   │   ├── plugins/       # JWT auth, Mongoose
│   │   ├── services/      # Mailer (Nodemailer)
│   │   └── utils/         # Hachage mot de passe (bcrypt)
│   └── ...
└── docker-compose.yml  # MongoDB local
```

## Stack technique

### Frontend
- **Vue.js 3** + Vite
- **Vue Router 5** (navigation)
- **Pinia 3** (state management)
- **Chart.js** (graphiques)
- **API CoinGecko** (prix en temps reel)

### Backend
- **Node.js** + **Fastify 5**
- **Mongoose 9** (MongoDB ODM)
- **@fastify/jwt** + **@fastify/cookie** (authentification)
- **bcryptjs** (hachage)
- **Nodemailer** (emails)

### Base de donnees
- **MongoDB** (local via Docker ou MongoDB Atlas en production)

## Prerequisites

- Node.js 20+ ou 22+
- Docker (pour MongoDB en local)

## Installation

```bash
# Cloner le repo
git clone https://github.com/ilan8chd/cryptofolio.git
cd cryptofolio

# Installer les dependances
npm install
```

## Lancement en developpement

### 1. Demarrer MongoDB (Docker)

```bash
docker compose up -d
```

### 2. Configurer les variables d'environnement

Copier le fichier d'exemple et le remplir :

```bash
cp server/.env-example server/.env.development.local
```

Contenu de `.env.development.local` :

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://root:password@localhost:35115/cryptofolio?authSource=admin
APP_BASE_URL="http://localhost:5173"
JWT_SECRET="dev-secret"
JWT_COOKIE_NAME="token"
```

### 3. Lancer l'application

```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173` et l'API sur `http://localhost:3000`.

## API Endpoints

### Assets (`/assets`)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/assets` | Liste tous les actifs |
| GET | `/assets/:id` | Recupere un actif |
| POST | `/assets` | Cree un actif |
| PUT | `/assets/:id` | Modifie un actif |
| DELETE | `/assets/:id` | Supprime un actif |

### Auth (`/auth`)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Connexion |
| POST | `/auth/resend-verification-email` | Renvoyer email de verification |

### Users (`/users`)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/users/verify-email` | Verification email |
| GET | `/users/me` | Profil utilisateur connecte |
| GET | `/users` | Liste des utilisateurs |
| DELETE | `/users/:id` | Supprimer un utilisateur |

## Deploiement

### Frontend (Netlify)
- Base directory : `client`
- Build command : `npm run build`
- Publish directory : `dist`
- Variable : `VITE_API_URL` = URL du backend Render

### Backend (Render)
- Root directory : `server`
- Build command : `npm install`
- Start command : `node src/index.js`
- Variables : `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_COOKIE_NAME`, `APP_BASE_URL`
