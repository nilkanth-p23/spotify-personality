import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()

  const profile = await prisma.profile.upsert({
    where: { spotifyId: body.spotifyId },
    update: {
      personalityType: body.personalityType,
      personalityDesc: body.personalityDesc,
      topGenres: body.topGenres,
      topArtists: body.topArtists,
      topTracks: body.topTracks,
      diversityScore: body.diversityScore,
      accentColor: body.accentColor,
      emoji: body.emoji,
    },
    create: {
      username: body.username,
      spotifyId: body.spotifyId,
      personalityType: body.personalityType,
      personalityDesc: body.personalityDesc,
      topGenres: body.topGenres,
      topArtists: body.topArtists,
      topTracks: body.topTracks,
      diversityScore: body.diversityScore,
      accentColor: body.accentColor,
      emoji: body.emoji,
    },
  })

  return Response.json({ id: profile.id })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return Response.json({ error: "No id provided" }, { status: 400 })
  }

  const profile = await prisma.profile.findUnique({
    where: { id },
  })

  if (!profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 })
  }

  return Response.json(profile)
}