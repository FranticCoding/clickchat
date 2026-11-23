# ClickChat

A Snapchat-style social app: accounts, friend requests, chat, photo messages, stories, a camera with a filter/draw/caption editor, profiles, streaks, and voice and video calls.

Built with plain HTML, CSS and JavaScript on Vercel, with Upstash Redis as the database. No framework, no bundler, no npm dependencies.

> Made with Claude.

## Features

- **Accounts:** sign up and log in with a username and password. Passwords are salted and hashed with scrypt, and sessions use signed 30-day tokens.
- **Friends:** search by username, send, accept and decline requests.
- **Chat:** text and photo messages between friends, plus 🔥 streaks for consecutive days of messaging.
- **Stories:** photo stories visible to friends for 24 hours, with a full-screen viewer, seen/unseen rings, captions, and replies that land in chat.
- **Camera and editor:** live camera, library upload, six filters, drawing, a draggable caption, and send to your story or a friend.
- **Profiles:** display name, bio and profile photo.
- **Calls:** one-to-one voice and video calls over WebRTC.

## Tech stack

| Layer | Choice |
| --- | --- |
| Hosting | Vercel (static files and Node serverless functions) |
| Database | Upstash Redis, via the Vercel Marketplace (REST API) |
| Frontend | Vanilla JavaScript, HTML, CSS |
| Realtime | Polling for chat and call signaling |
| Calls | WebRTC with Google STUN servers |

## Project structure

```
index.html     Small shell: loads app.html, then camera.js and call.js
app.html       Main app: UI, auth, friends, chat, stories, profile, logo
camera.js      Live camera and editor (filters, drawing, captions)
call.js        Voice and video calls
api/index.js   Accounts, friends, chat, stories, profiles
api/img.js     Serves stored images
api/call.js    Call signaling
package.json
```

## Setup

1. Push this repo to GitHub and import it in Vercel. Use no framework preset and no build command.
2. In the Vercel project, open **Storage** and add the **Upstash Redis** integration. Connect it to this project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. Add the environment variable `AUTH_SECRET` with a long random string, at least 32 characters. Generate one with `openssl rand -base64 48`.
4. Deploy. If you want friends to use the app without a Vercel login, turn off **Deployment Protection** under Project Settings.

### Environment variables

| Name | Purpose |
| --- | --- |
| `KV_REST_API_URL` | Upstash Redis REST URL (set by the integration) |
| `KV_REST_API_TOKEN` | Upstash Redis REST token (set by the integration) |
| `AUTH_SECRET` | Secret used to sign login tokens. Keep it private. |

Changing `AUTH_SECRET` logs everyone out.

### Run locally

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

Open `http://localhost:3000`. Camera and microphone access work on `localhost` and on HTTPS, but not on plain HTTP over a network address.

## How it works

**Auth.** `api/index.js` stores a salted scrypt hash per user and returns an HMAC-signed token. Every request sends the token, and the server checks it before doing anything.

**Data.** Everything is stored in Redis:

| Key | Type | Holds |
| --- | --- | --- |
| `pw:<user>` | string | salt and password hash |
| `prof:<user>` | hash | display name, bio, photo id |
| `users` | sorted set | usernames, for prefix search |
| `fr:<user>` | set | friends |
| `in:<user>` / `out:<user>` | set | incoming and sent requests |
| `chat:<a>~<b>` | list | messages (JSON) |
| `sk:<a>~<b>` | hash | streak count and last day |
| `st:<user>` | list | story items |
| `img:<id>` | string | base64 JPEG (stories 25 h, chat 30 days, profile photos permanent) |
| `ring:<user>`, `ci:<id>`, `ans:<id>`, `ice:<id>:<role>`, `end:<id>` | various | call signaling, short-lived |

**Images.** The browser shrinks photos before upload. The server stores them in Redis and `api/img.js` serves them with long cache headers. Image ids are random and unguessable.

**Chat.** The client polls `poll` with the number of messages it already has, and the server returns only the new ones.

**Calls.** `api/call.js` passes WebRTC offers, answers and ICE candidates through Redis. The audio and video itself goes directly between the two devices.

## Known limits

- **No push and no ring sound.** Chat and calls use polling, so the app must be open and visible to receive a message or call. An incoming call can take up to 5 seconds to appear.
- **Calls use STUN only.** Some strict networks need a TURN relay to connect. Add TURN credentials to the `ICE` config in `call.js` if you need it.
- **Redis free-tier limits.** Polling uses commands. Heavy use can exhaust a free plan.
- **Streak days are counted in UTC.**
- **Photos are compressed,** and Redis request size limits cap how large they can be.
- **Not built yet:** password reset, group chat, group calls, screen sharing, drawing or filters on chat photos taken outside the camera editor.

## Security notes

- Never commit `AUTH_SECRET` or the Redis token. Both live in Vercel environment variables.
- Photos are not encrypted at rest. They are only reachable through unguessable ids.
- There is no rate limiting on login. Add it before running this at scale.

## Contributing

Issues and pull requests are welcome.

## License

Add a license before sharing publicly, for example MIT.
