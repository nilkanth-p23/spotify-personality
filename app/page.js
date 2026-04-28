"use client"
import { useSession, signIn, signOut } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()

  if (session) {
    return (
      <main>
        <h1>Welcome, {session.user.name}! 🎵</h1>
        <p>You're logged in with Spotify</p>
        <button onClick={() => signOut()}>Sign out</button>
      </main>
    )
  }

  return (
    <main>
      <h1>Spotify Personality</h1>
      <p>Discover your music personality based on your listening history</p>
      <button onClick={() => signIn("spotify")}>Login with Spotify</button>
    </main>
  )
}