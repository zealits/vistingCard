# Visiting Card

A full-stack visiting card application with a React frontend and Node.js/Express backend. Create and manage digital visiting cards with image upload via Cloudinary and data stored in MongoDB.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Material UI (MUI), React Router, Axios, react-easy-crop
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), Multer, Cloudinary

## Project Structure

```
visitingCard/
├── frontend/     # React + Vite app
├── server/       # Express API
└── README.md
```

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

## Setup

### 1. Backend (server)

```bash
cd server
npm install
```

Create a `.env` file in `server/` with:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Frontend

```bash
cd frontend
npm install
```

Configure the API base URL in the frontend (e.g. in env or axios config) to point to your backend (e.g. `http://localhost:5070`).

## Run

**Backend:**

```bash
cd server
npm run dev
```

**Frontend:**

```bash
cd frontend
npm run dev
```

Open the app in the browser at the URL shown by Vite (usually `http://localhost:5173`).

## Scripts

| Location   | Command        | Description              |
|-----------|----------------|--------------------------|
| `server/` | `npm run dev`  | Start API with nodemon   |
| `frontend/` | `npm run dev` | Start Vite dev server    |
| `frontend/` | `npm run build` | Production build       |
| `frontend/` | `npm run preview` | Preview production build |

## License

ISC
