# 🎵 Spotify Personality

Discover your music personality based on your Spotify listening history.

## Live Demo
[View Live App](https://spotify-personality-kappa.vercel.app/)

## Features
- 🔐 Login with Spotify OAuth
- 🎤 Analyzes your top artists, tracks & genres
- 🧠 Generates your unique music personality type
- 🎨 Beautiful dark UI with artist images
- 📋 Browse your playlists, top artists & tracks

## Tech Stack
- **Framework:** Next.js 14
- **Authentication:** NextAuth.js (Spotify OAuth)
- **API:** Spotify Web API
- **Deployment:** Vercel

## Getting Started

1. Clone the repo
   ```bash
   git clone https://github.com/YOURUSERNAME/spotify-personality.git
   cd spotify-personality
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create `.env.local` with your Spotify credentials
   ```bash
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   NEXTAUTH_URL=http://127.0.0.1:3000
   NEXTAUTH_SECRET=your_secret
   ```

4. Run locally
   ```bash
   npm run dev
   ```

## How It Works
1. User logs in with their Spotify account
2. App fetches top artists, tracks & recently played via Spotify API
3. Genres are analyzed and counted across all artists
4. A personality type is assigned based on dominant genres
5. Results displayed with artist images and a diversity score

## ⚠️ Access Notice
Due to [Spotify's Developer Terms of Service](https://developer.spotify.com/terms), this app is currently in **Development Mode**, which means only users manually added via Spotify's User Management can log in.

If you'd like access to try the app, feel free to reach out to me directly so I can add your Spotify email address.

To request access or learn more, contact me at: **nilkanthpatel23@gmail.com**
