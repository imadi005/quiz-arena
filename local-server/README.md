# Quiz Arena — Local Server

Runs the whole quiz on one machine with **no internet and no AWS** — for a classroom LAN.

## What this replaces

The full product plan uses AWS (Cognito + DynamoDB + Lambda), but that needs internet access.
This is a small Node/Express server + JSON file that does the same job for a single-room event:

- Serves quiz questions to students (roll number only, no password)
- Tracks attempts per roll number (max 3, best score counts)
- Stores results in `data.json` and serves them as a leaderboard
- Serves the built frontend itself, so everything is one process on one port

## Running it on the day

On the machine acting as the server (a laptop, or the college server):

```bash
# one-time setup
cd local-server && npm install
cd ../frontend && npm install && npm run build

# start the server (serves API + the built frontend together)
cd ../local-server
npm start
```

Find that machine's LAN IP (`ipconfig getifaddr en0` on Mac, `hostname -I` on Linux, `ipconfig` on
Windows) and have students open `http://<that-ip>:4000` in a browser on the same WiFi/LAN — no
internet required, just a shared local network.

## Admin access

Since Cognito needs internet, the Admin tab also accepts a **local passcode** instead:

- Default passcode: `admin123`
- Change it by setting `VITE_LOCAL_ADMIN_PASSCODE` in `frontend/.env` before running `npm run build`

Anyone with that passcode can view the leaderboard and manage questions from `/admin`.

## Known limitations (this is a "for now" setup, not the production plan)

- `data.json` is the entire database — back it up before the event if the results matter.
- The `/api/admin/*` endpoints have no auth beyond the frontend passcode gate — fine for a trusted
  classroom LAN, not for a public network.
- Only one quiz (the shared question bank) runs at a time — there's no multi-quiz scheduling yet.
