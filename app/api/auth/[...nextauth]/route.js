import NextAuth from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "user-top-read user-read-recently-played user-read-email",
          redirect_uri: "http://127.0.0.1:3000/api/auth/callback/spotify",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }