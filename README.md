# ClickChat

A Snapchat-style chat app: accounts, friend requests, chat, photo messages, stories, a camera with a caption/draw/filter editor, profiles, streaks and voice/video calls.

No framework and no build step. Static files plus three Vercel serverless functions.

## Stack
- **Hosting:** Vercel (static files + Node functions in `api/`)
- **Database:** Upstash Redis via the Vercel Marketplace (REST API)
- **Frontend:** vanilla JS. `index.html` loads `app.html`, then `camera.js` and `call.js`
- **Calls:** WebRTC (Google STUN), signaling through `api/call.js`

## Files
- `app.html`: main app (UI, chat, stories, friends, profile, logo)
- `camera.js`: live camera and editor (filters, drawing, caption)
- `call.js`: voice and video calls
- `api/index.js`: accounts, friends, chat, stories, profiles
- `api/img.js`: serves stored images
- `api/call.js`: call signaling

## Setup
1. Push this repo to GitHub and import it in Vercel (no framework, no build command).
2. In the Vercel project, add the **Upstash Redis** integration (Storage tab). It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. Add an environment variable `AUTH_SECRET` with a long random string (at least 32 characters).
4. Turn off Deployment Protection (Vercel Authentication) if you want friends to use it without a Vercel login.

## Known limits
- Chat and calls use polling, so there is no push and no ring sound. The app must be open and visible to receive a call.
- Calls use STUN only. Some strict networks need a TURN server.
- Redis free-tier command limits apply.
