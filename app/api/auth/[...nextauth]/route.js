import NextAuth from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

const SPOTIFY_REFRESH_URL = "https://accounts.spotify.com/api/token"

async function refreshAccessToken(token) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token.refreshToken,
  })

  const response = await fetch(SPOTIFY_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
      ).toString("base64"),
    },
    body: params,
  })

  const data = await response.json()

  if (!response.ok) {
    console.log("Refresh token error:", data)
    return { ...token, error: "RefreshTokenError" }
  }

  return {
    ...token,
    accessToken: data.access_token,
    accessTokenExpires: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token ?? token.refreshToken,
  }
}

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "user-top-read user-read-recently-played user-read-email playlist-read-private playlist-read-collaborative",
          redirect_uri: process.env.NEXTAUTH_URL + "/api/auth/callback/spotify",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // First sign in
      if (account) {
        console.log("New login - scopes:", account.scope)
        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + account.expires_in * 1000,
          scope: account.scope,
        }
      }

      // Token still valid
      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Token expired — refresh it
      console.log("Token expired, refreshing...")
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.scope = token.scope
      session.error = token.error
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }