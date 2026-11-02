# Deployment Guide (Vercel + Render)

This app uses TanStack Start + Nitro server output.  
Deploy by configuring environment variables in your hosting platform (not in committed `.env` files).

## 1) Required environment variables

Set these in both **Vercel** and **Render**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`
- `GOOGLE_MAPS_API_KEY`

Optional:

- `VITE_SAFEROUTE_API_URL` (only if routing requests should go to an external SafeRoute Express backend)

## 2) Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. In **Project Settings → Environment Variables**, add all required variables above for Production (and Preview if you need preview environments).
3. Set:
   - `NITRO_PRESET=vercel`
4. Build settings:
   - **Build Command**: `npm run build`
   - **Node.js version**: 20 or newer
5. Deploy.

## 3) Deploy on Render

Create a **Web Service** from this repository.

- **Runtime**: Node
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `node .output/server/index.mjs`
- **Environment variable**: `NITRO_PRESET=node-server`
- Add all required environment variables from section 1.

Deploy after saving settings.

## 4) Post-deploy verification checklist

After deployment, verify:

- Signed-out users are prompted correctly for authenticated live features.
- Signed-in auth works end-to-end with Supabase.
- Live route analysis succeeds for at least one route search.
- Nearby place search succeeds for at least one location.
- Community moderation/AI-backed server paths do not throw runtime errors.

If deployment fails, first re-check:

- Missing or incorrect environment variable values
- Wrong `NITRO_PRESET` for the target platform
