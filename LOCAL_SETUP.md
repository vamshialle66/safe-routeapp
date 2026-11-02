# Running SafeRoute fully on your computer (VS Code)

Three pieces run locally. The MongoDB database is used **only by your friend's Express backend** — the SafeRoute web app never touches it.

```
┌─────────────────────┐      ┌──────────────────────────┐      ┌────────────┐
│  SafeRoute web app  │ ───▶ │  Friend's Express server  │ ───▶ │  MongoDB   │
│  this repo          │ HTTP │  safeRoute-main/backend   │      │ (Atlas)    │
│  localhost:8080     │      │  localhost:3000           │      │            │
└─────────────────────┘      └──────────────────────────┘      └────────────┘
```

## 1. Get the code

1. In Lovable, connect GitHub (+ menu next to the chat box → Project → GitHub). This creates a private copy of this project's code in your GitHub account.
2. On your computer: `git clone <your-repo-url>` then `cd <repo>`.

## 2. Run the SafeRoute web app

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:8080).

## 3. Run your friend's backend

```bash
cd safeRoute-main/backend
npm install
npm install cors
```

**CORS fix (required once):** at the top of `backend/server.js`, right after `const app = express();`, add:

```js
import cors from 'cors';
app.use(cors());
```

Without this the browser blocks every request to the server, even when it is running.

**Create `backend/.env`** (keep this file private — never paste it in chat, never commit it to Git):

```
PORT=3000
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/saferoute
```

- `GOOGLE_MAPS_API_KEY` — from Google Cloud Console, with **Routes API** and **Places API (New)** enabled.
- `MONGODB_URI` — only used once MongoDB is added (step 5). The backend currently has no database code, so this line is harmless until then.

Then start it:

```bash
npm start
```

## 4. Connect the two

In the web app: **Settings → Route engine → Server address** = `http://localhost:3000` → **Test & save**.
Plan a trip — results now come from your friend's server (badge shows **Live**). If you clear the box, the app uses its built-in engine (works fully only when published on Lovable) or falls back to sample data.

## 5. Adding MongoDB to the backend (it doesn't have it yet)

Your friend's backend is Express + Google Maps only — sample places live in `data.json`, and nothing is saved to a database. To add MongoDB for users / saved routes / trip history:

```bash
npm install mongoose
```

In `backend/server.js`:

```js
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
console.log('MongoDB connected');
```

Then define models as needed, e.g. `backend/models/SavedTrip.js`:

```js
import mongoose from 'mongoose';

const savedTripSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  origin: String,
  destination: String,
  travelMode: String,
  routes: Array,       // routes + stretch scores as returned by /location/segments
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('SavedTrip', savedTripSchema);
```

Keep MongoDB behind your own API routes (e.g. `POST /trips` to save, `GET /trips?userId=…` to list) — never expose the connection string to the browser. If you add accounts later, store a password **hash** (bcrypt), never the raw password.

## Security rules

- `.env` files stay on your machine. Add `.env` to `.gitignore` in every repo before your first commit.
- Your MongoDB Atlas cluster should allow connections only from your IP (Atlas → Network Access) while developing locally.
- Rotate the MongoDB password if it was ever pasted into a chat or committed anywhere.
