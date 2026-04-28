import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route.js"

async function fetchSpotifyData(endpoint, accessToken) {
  const response = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return response.json()
}

export async function GET(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const accessToken = session.accessToken

  // Fetch all data in parallel (at the same time, faster!)
  const [topArtists, topTracks, recentTracks] = await Promise.all([
    fetchSpotifyData("me/top/artists?limit=10&time_range=medium_term", accessToken),
    fetchSpotifyData("me/top/tracks?limit=10&time_range=medium_term", accessToken),
    fetchSpotifyData("me/player/recently-played?limit=20", accessToken),
  ])

  return Response.json({
    topArtists: topArtists.items,
    topTracks: topTracks.items,
    recentTracks: recentTracks.items,
  })
}