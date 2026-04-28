import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

async function fetchSpotifyData(endpoint, accessToken) {
  const response = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return response.json()
}

const artistGenreMap = {
  "the weeknd": ["r&b", "pop", "synth-pop"],
  "drake": ["hip hop", "rap", "pop rap"],
  "don toliver": ["hip hop", "rap", "psychedelic trap"],
  "lil baby": ["hip hop", "rap", "trap"],
  "21 savage": ["hip hop", "rap", "trap"],
  "travis scott": ["hip hop", "rap", "psychedelic trap"],
  "future": ["hip hop", "rap", "trap"],
  "juice wrld": ["hip hop", "rap", "emo rap"],
  "post malone": ["pop", "hip hop", "rap"],
  "kendrick lamar": ["hip hop", "rap", "conscious hip hop"],
  "j. cole": ["hip hop", "rap", "conscious hip hop"],
  "bad bunny": ["latin", "reggaeton", "latin trap"],
  "taylor swift": ["pop", "country pop"],
  "billie eilish": ["pop", "indie pop", "electropop"],
  "ariana grande": ["pop", "r&b"],
  "dua lipa": ["pop", "dance pop"],
  "olivia rodrigo": ["pop", "pop rock"],
  "sza": ["r&b", "soul", "alternative r&b"],
  "frank ocean": ["r&b", "soul", "alternative r&b"],
  "kid cudi": ["hip hop", "rap", "alternative hip hop"],
  "tyler the creator": ["hip hop", "rap", "alternative hip hop"],
  "playboi carti": ["hip hop", "rap", "trap"],
  "gunna": ["hip hop", "rap", "trap"],
  "lil uzi vert": ["hip hop", "rap", "emo rap"],
  "roddy ricch": ["hip hop", "rap", "trap"],
  "polo g": ["hip hop", "rap", "trap"],
  "nba youngboy": ["hip hop", "rap", "trap"],
  "jack harlow": ["hip hop", "rap", "pop rap"],
  "pop smoke": ["hip hop", "rap", "drill"],
  "fivio foreign": ["hip hop", "rap", "drill"],
  "lil tjay": ["hip hop", "rap", "melodic rap"],
  "trippie redd": ["hip hop", "rap", "emo rap"],
  "asap rocky": ["hip hop", "rap", "cloud rap"],
  "nicki minaj": ["hip hop", "rap", "pop rap"],
  "cardi b": ["hip hop", "rap", "pop rap"],
  "megan thee stallion": ["hip hop", "rap", "trap"],
  "dababy": ["hip hop", "rap", "trap"],
  "summer walker": ["r&b", "soul"],
  "jhene aiko": ["r&b", "soul", "alternative r&b"],
  "bryson tiller": ["r&b", "soul", "trap soul"],
  "khalid": ["r&b", "pop"],
  "giveon": ["r&b", "soul"],
  "brent faiyaz": ["r&b", "soul", "alternative r&b"],
  "usher": ["r&b", "soul", "pop"],
  "chris brown": ["r&b", "pop"],
  "bruno mars": ["pop", "r&b", "funk"],
  "doja cat": ["pop", "r&b", "hip hop"],
  "harry styles": ["pop", "pop rock"],
  "ed sheeran": ["pop", "acoustic pop"],
  "sam smith": ["pop", "soul"],
  "glass animals": ["indie pop", "psychedelic pop"],
  "tame impala": ["rock", "psychedelic rock", "indie rock"],
  "arctic monkeys": ["rock", "indie rock"],
  "the 1975": ["indie pop", "alternative rock"],
  "lana del rey": ["indie pop", "dream pop"],
  "hozier": ["indie", "folk", "blues rock"],
  "bon iver": ["indie folk", "folk"],
  "j balvin": ["latin", "reggaeton"],
  "ozuna": ["latin", "reggaeton"],
  "maluma": ["latin", "reggaeton"],
  "karol g": ["latin", "reggaeton"],
  "arijit singh": ["bollywood", "indian pop", "filmi"],
  "ar rahman": ["bollywood", "indian classical", "world music"],
  "shreya ghoshal": ["bollywood", "indian pop", "filmi"],
  "atif aslam": ["bollywood", "indian pop", "filmi"],
  "badshah": ["bollywood", "hip hop", "bhangra"],
  "divine": ["hip hop", "rap", "desi hip hop"],
  "calvin harris": ["edm", "electro house", "dance pop"],
  "david guetta": ["edm", "electro house"],
  "marshmello": ["edm", "future bass"],
  "the chainsmokers": ["pop", "edm"],
}

export async function GET(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const accessToken = session.accessToken

  if (!accessToken) {
    return Response.json({ error: "No access token" }, { status: 401 })
  }

  const [topArtistsData, topTracksData, recentTracksData, playlistsData] = await Promise.all([
    fetchSpotifyData("me/top/artists?limit=10&time_range=medium_term", accessToken),
    fetchSpotifyData("me/top/tracks?limit=10&time_range=medium_term", accessToken),
    fetchSpotifyData("me/player/recently-played?limit=20", accessToken),
    fetchSpotifyData("me/playlists?limit=20", accessToken),
  ])

  // Add genres from our map if Spotify doesn't return them
  const topArtists = (topArtistsData.items || []).map(artist => ({
    ...artist,
    genres: (artist.genres && artist.genres.length > 0)
      ? artist.genres
      : (artistGenreMap[artist.name.toLowerCase()] || [])
  }))

  // Collect genres from all sources
  const allArtistNames = new Set()
  topArtists.forEach(a => allArtistNames.add(a.name.toLowerCase()))
  topTracksData.items?.forEach(t => t.artists?.forEach(a => allArtistNames.add(a.name.toLowerCase())))
  recentTracksData.items?.forEach(i => i.track?.artists?.forEach(a => allArtistNames.add(a.name.toLowerCase())))

  const allGenres = []
  allArtistNames.forEach(name => {
    const genres = artistGenreMap[name]
    if (genres) allGenres.push(...genres)
  })

  return Response.json({
    topArtists,
    topTracks: topTracksData.items || [],
    recentTracks: recentTracksData.items || [],
    playlists: playlistsData.items || [],
    allGenres,
  })
}