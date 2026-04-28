import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const playlistId = searchParams.get("id")
  if (!playlistId) return Response.json({ error: "No playlist ID" }, { status: 400 })

  const accessToken = session.accessToken
  console.log("=== PLAYLIST DEBUG ===")
  console.log("Playlist ID:", playlistId)
  console.log("Token (first 40):", accessToken?.slice(0, 40))

  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  console.log("HTTP Status:", response.status)
  const data = await response.json()
  console.log("Response:", JSON.stringify(data).slice(0, 400))

  if (data.error) {
    return Response.json({ 
      tracks: [], topArtists: [], duration: "0m", 
      totalTracks: 0, error: data.error.message 
    })
  }

  const tracks = (data.items || [])
  .filter(i => (i.track || i.item)?.name)
  .map(i => i.track || i.item)

  const artistCount = {}
  tracks.forEach(t => t.artists?.forEach(a => {
    artistCount[a.name] = (artistCount[a.name] || 0) + 1
  }))
  const topArtists = Object.entries(artistCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const totalMs = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0)
  const totalMinutes = Math.floor(totalMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return Response.json({ tracks, topArtists, duration, totalTracks: tracks.length })
}