"use client"
import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

const capitalize = str => str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

export default function Home() {
  const { data: session } = useSession()
  const [personality, setPersonality] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [rawData, setRawData] = useState(null)
  const [activePage, setActivePage] = useState("home")
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistStats, setPlaylistStats] = useState(null)
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  // Auto-fetch Spotify data when user logs in
  useEffect(() => {
    if (session && !rawData) {
      fetchData()
    }
  }, [session])

  async function fetchData() {
  setDataLoading(true)
  try {
    const res = await fetch("/api/spotify")
    const text = await res.text()
    console.log("API response:", text)
    if (text) {
      const data = JSON.parse(text)
      setRawData(data)
    }
  } catch (err) {
    console.error("Fetch error:", err)
  }
  setDataLoading(false)
}

async function openPlaylist(playlist) {
  setSelectedPlaylist(playlist)
  setPlaylistStats(null)
  setPlaylistLoading(true)
  try {
    const res = await fetch(`/api/playlist?id=${playlist.id}`)
    const data = await res.json()
    setPlaylistStats(data)
  } catch (err) {
    console.error("Playlist fetch error:", err)
  }
  setPlaylistLoading(false)
}

  async function analyzePersonality() {
  setLoading(true)
  try {
    let data = rawData
    if (!data) {
      const res = await fetch("/api/spotify")
      const text = await res.text()
      if (!text || text.trim() === "") {
        console.error("API returned empty response")
        setLoading(false)
        return
      }
      data = JSON.parse(text)
      setRawData(data)
    }

    const genres = data.allGenres?.length > 0
      ? data.allGenres
      : data.topArtists?.flatMap(artist => artist.genres || []) || []

    const genreCount = {}
    genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1
    })

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre)

    const topArtists = data.topArtists?.slice(0, 5).map(a => a.name) || []
    const topTracks = data.topTracks?.slice(0, 5).map(t => `${t.name} by ${t.artists[0].name}`) || []
    const uniqueGenres = new Set(genres)
    const diversityScore = Math.min(Math.round((uniqueGenres.size / 5) * 100), 100)

    const primaryGenre = topGenres[0] || ""
    let personalityType, personalityDesc, accentColor, emoji

    if (primaryGenre.includes("pop")) {
      personalityType = "The Trendsetter"; personalityDesc = "You love what's current and have your finger on the pulse of popular culture."; accentColor = "#f72585"; emoji = "🌟"
    } else if (primaryGenre.includes("hip hop") || primaryGenre.includes("rap")) {
      personalityType = "The Storyteller"; personalityDesc = "You connect deeply with lyrics and rhythm. You appreciate authenticity and flow."; accentColor = "#7209b7"; emoji = "🎤"
    } else if (primaryGenre.includes("rock") || primaryGenre.includes("metal")) {
      personalityType = "The Rebel"; personalityDesc = "You love energy and intensity. Music is your outlet and your passion."; accentColor = "#e63946"; emoji = "🎸"
    } else if (primaryGenre.includes("jazz") || primaryGenre.includes("classical")) {
      personalityType = "The Sophisticate"; personalityDesc = "You have refined taste and appreciate complexity and musical craftsmanship."; accentColor = "#2a9d8f"; emoji = "🎼"
    } else if (primaryGenre.includes("electronic") || primaryGenre.includes("edm")) {
      personalityType = "The Explorer"; personalityDesc = "You love pushing boundaries and experiencing new sonic landscapes."; accentColor = "#4cc9f0"; emoji = "⚡"
    } else if (primaryGenre.includes("r&b") || primaryGenre.includes("soul")) {
      personalityType = "The Feeler"; personalityDesc = "You connect deeply with emotion in music. You feel everything intensely."; accentColor = "#ff6b6b"; emoji = "❤️"
    } else if (primaryGenre.includes("bollywood") || primaryGenre.includes("filmi") || primaryGenre.includes("indian")) {
      personalityType = "The Romantic"; personalityDesc = "You're drawn to music that tells stories of love, drama, and deep emotion."; accentColor = "#ff9500"; emoji = "🎬"
    } else if (primaryGenre.includes("indie") || primaryGenre.includes("alternative")) {
      personalityType = "The Individualist"; personalityDesc = "You forge your own path and love discovering artists before they're mainstream."; accentColor = "#06d6a0"; emoji = "🌿"
    } else {
      personalityType = "The Eclectic"; personalityDesc = "Your taste knows no boundaries. You find beauty in all kinds of music."; accentColor = "#ffd166"; emoji = "🎵"
    }

    setPersonality({ personalityType, personalityDesc, topGenres, topArtists, topTracks, diversityScore, accentColor, emoji })
  } catch (err) {
    console.error("Analysis error:", err)
  }
  setLoading(false)
}

  if (!session) {
    return (
      <div className="login-page">
        <div className="bg-circle bg-circle-1" />
        <div className="bg-circle bg-circle-2" />
        <div className="login-content">
          <h1 className="login-title">SPOTIFY<br/><span>PERSONALITY</span></h1>
          <p className="login-subtitle">Discover who you are through your music</p>
          <button className="login-btn" onClick={() => signIn("spotify")}>
            <svg className="spotify-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Login with Spotify
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-inner">
          <div className="logo">SPOTIFY PERSONALITY</div>
          <div className="nav-links">
            {["home", "artists", "tracks", "playlists", "about"].map(page => (
              <button
                key={page}
                className={`nav-link ${activePage === page ? "nav-link-active" : ""}`}
                onClick={() => setActivePage(page)}
              >
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </button>
            ))}
          </div>
          <div className="nav-right">
            <span className="nav-user">{session.user.name}</span>
            <button className="signout-btn" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </nav>

      <div className="page-content">

        {/* HOME */}
        {activePage === "home" && (
          <div className="center">
            {!personality ? (
              <div className="analyze-section">
                <h1 className="analyze-title">WHO ARE<br/>YOU?</h1>
                <p className="analyze-sub">We'll analyze your listening history to find out</p>
                <button className="analyze-btn" onClick={analyzePersonality} disabled={loading}>
                  {loading ? "Analyzing your music..." : "Analyze My Personality"}
                </button>
              </div>
            ) : (
              <>
                <div className="personality-card" style={{ borderColor: personality.accentColor + "33" }}>
                  <span className="personality-emoji">{personality.emoji}</span>
                  <h2 className="personality-type" style={{ color: personality.accentColor }}>
                    {personality.personalityType}
                  </h2>
                  <p className="personality-desc">{personality.personalityDesc}</p>
                  <div className="diversity-badge">
                    🎯 Music Diversity Score: &nbsp;<strong style={{ color: personality.accentColor }}>{personality.diversityScore}%</strong>
                  </div>
                </div>
                <div className="grid">
                  <div className="card">
                    <div className="card-title">Top Genres</div>
                    {personality.topGenres.length > 0 ? personality.topGenres.map((genre, i) => (
                      <div className="item" key={i}>
                        <span className="item-num">{i + 1}</span>
                        <div className="genre-dot" style={{ background: personality.accentColor }} />
                        <span className="item-text">{capitalize(genre)}</span>
                      </div>
                    )) : <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>No genre data</span>}
                  </div>
                  <div className="card">
                    <div className="card-title">Top Artists</div>
                    {personality.topArtists.map((artist, i) => (
                      <div className="item" key={i}>
                        <span className="item-num">{i + 1}</span>
                        <span className="item-text">{artist}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card grid-full">
                    <div className="card-title">Top Tracks</div>
                    {personality.topTracks.map((track, i) => (
                      <div className="item" key={i}>
                        <span className="item-num">{i + 1}</span>
                        <span className="item-text">{track}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="actions">
                  <button className="btn-secondary" onClick={() => setPersonality(null)}>Analyze Again</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ARTISTS */}
        {activePage === "artists" && (
          <div className="center">
            <div className="page-header">
              <h2 className="page-title">Your Top Artists</h2>
              <p className="page-sub">The artists you've been listening to most</p>
            </div>
            {dataLoading ? (
              <div className="empty-state"><p>Loading your artists...</p></div>
            ) : (
              <div className="artists-grid">
                {rawData?.topArtists?.slice(0, 10).map((artist, i) => (
                  <div className="artist-card" key={i}>
                    <div className="artist-rank">#{i + 1}</div>
                    {artist.images?.[0]?.url ? (
                      <img src={artist.images[0].url} alt={artist.name} className="artist-img" />
                    ) : (
                      <div className="artist-img-placeholder">🎵</div>
                    )}
                    <div className="artist-info">
                      <div className="artist-name">{artist.name}</div>
                      <div className="artist-genres">
                        {(artistGenreMap[artist.name.toLowerCase()]?.slice(0, 2) || []).map((g, j) => (
                          <span className="genre-tag" key={j}>{capitalize(g)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRACKS */}
        {activePage === "tracks" && (
          <div className="center">
            <div className="page-header">
              <h2 className="page-title">Your Top Tracks</h2>
              <p className="page-sub">Songs you've had on repeat lately</p>
            </div>
            {dataLoading ? (
              <div className="empty-state"><p>Loading your tracks...</p></div>
            ) : (
              <div className="tracks-list">
                {rawData?.topTracks?.slice(0, 10).map((track, i) => (
                  <div className="track-row" key={i}>
                    <span className="track-num">{i + 1}</span>
                    {track.album?.images?.[0]?.url ? (
                      <img src={track.album.images[0].url} alt={track.name} className="track-img" />
                    ) : (
                      <div className="track-img-placeholder">🎵</div>
                    )}
                    <div className="track-info">
                      <div className="track-name">{track.name}</div>
                      <div className="track-artist">{track.artists?.map(a => a.name).join(", ")}</div>
                    </div>
                    <div className="track-album">{track.album?.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLAYLISTS */}
{activePage === "playlists" && (
  <div className="center">
    {selectedPlaylist ? (
      // PLAYLIST DETAIL VIEW
      <>
        <div className="page-header" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button className="btn-secondary" onClick={() => setSelectedPlaylist(null)}>← Back</button>
          <div>
            <h2 className="page-title">{selectedPlaylist.name}</h2>
            <p className="page-sub">{selectedPlaylist.tracks?.total} tracks</p>
          </div>
        </div>

        {playlistLoading ? (
          <div className="empty-state"><p>Loading playlist stats...</p></div>
        ) : playlistStats?.error ? (
          <div className="card" style={{ textAlign: "center", padding: "48px" }}>
            <p style={{ fontSize: "40px", marginBottom: "16px" }}>🔒</p>
            <p style={{ color: "white", fontSize: "16px", marginBottom: "8px" }}>
              This playlist can't be accessed
          </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
            Spotify restricts API access to curated and algorithmic playlists.<br/>
            Try clicking a playlist you created yourself.
          </p>
        </div>
      ) : playlistStats ? (
          <>
            {/* Stats Row */}
            <div className="grid" style={{ marginBottom: "24px" }}>
              <div className="card" style={{ textAlign: "center" }}>
                <div className="card-title">Total Tracks</div>
                <div style={{ fontSize: "48px", fontFamily: "'Bebas Neue', sans-serif", color: "white" }}>
                  {playlistStats.totalTracks}
                </div>
              </div>
              <div className="card" style={{ textAlign: "center" }}>
                <div className="card-title">Total Duration</div>
                <div style={{ fontSize: "48px", fontFamily: "'Bebas Neue', sans-serif", color: "white" }}>
                  {playlistStats.duration}
                </div>
              </div>
              <div className="card grid-full">
                <div className="card-title">Top Artists in This Playlist</div>
                {playlistStats.topArtists.map((artist, i) => (
                  <div className="item" key={i}>
                    <span className="item-num">{i + 1}</span>
                    <span className="item-text" style={{ flex: 1 }}>{artist.name}</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                      {artist.count} {artist.count === 1 ? "track" : "tracks"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Track List */}
            <div className="card">
              <div className="card-title">All Tracks</div>
              {playlistStats.tracks.map((track, i) => (
                <div className="item" key={i}>
                  <span className="item-num">{i + 1}</span>
                  {track.album?.images?.[0]?.url && (
                    <img src={track.album.images[0].url} alt={track.name} className="track-img" />
                  )}
                  <div className="track-info">
                    <div className="track-name">{track.name}</div>
                    <div className="track-artist">{track.artists?.map(a => a.name).join(", ")}</div>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                    {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </>
    ) : (
      // PLAYLIST GRID
      <>
        <div className="page-header">
          <h2 className="page-title">Your Playlists</h2>
          <p className="page-sub">{rawData?.playlists?.length || 0} playlists in your library</p>
        </div>
        {dataLoading ? (
          <div className="empty-state"><p>Loading your playlists...</p></div>
        ) : (
          <div className="artists-grid">
            {rawData?.playlists?.map((playlist, i) => (
              <div
                className="artist-card"
                key={i}
                onClick={() => openPlaylist(playlist)}
                style={{ cursor: "pointer" }}
              >
                {playlist.images?.[0]?.url ? (
                  <img src={playlist.images[0].url} alt={playlist.name} className="artist-img" style={{ borderRadius: "8px" }} />
                ) : (
                  <div className="artist-img-placeholder">🎵</div>
                )}
                <div className="artist-info">
                  <div className="artist-name">{playlist.name}</div>
                  <div className="artist-genres">
                    <span className="genre-tag">{playlist.tracks?.total} tracks</span>
                    <span className="genre-tag">{playlist.public ? "Public" : "Private"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </div>
)}

        {/* ABOUT */}
        {activePage === "about" && (
          <div className="center">
            <div className="about-page">
              <div className="page-header">
                <h2 className="page-title">About</h2>
              </div>
              <div className="about-card">
                <h3>🎵 What is Spotify Personality?</h3>
                <p>Spotify Personality analyzes your listening history to reveal your unique music personality type. By looking at your top artists, tracks, and genres, we create a profile that reflects who you are as a listener.</p>
              </div>
              <div className="about-card">
                <h3>🔍 How does it work?</h3>
                <p>We connect to Spotify's API to fetch your top artists and tracks from the last 6 months. We then analyze the genres you listen to most and map them to one of 8 personality types — from The Storyteller to The Rebel.</p>
              </div>
              <div className="about-card">
                <h3>🔒 Is my data safe?</h3>
                <p>Yes! We only request read-only access to your listening history. We never store your personal data permanently, and you can revoke access at any time from your Spotify account settings.</p>
              </div>
              <div className="about-card">
                <h3>⚡ Tech Stack</h3>
                <p>Built with Next.js 14, NextAuth for Spotify OAuth, and the Spotify Web API. Deployed on Vercel.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Genre map used for display in artists page
const artistGenreMap = {
  "the weeknd": ["R&B", "Synth-Pop"],
  "drake": ["Hip Hop", "Rap"],
  "don toliver": ["Hip Hop", "Psychedelic Trap"],
  "lil baby": ["Hip Hop", "Trap"],
  "21 savage": ["Hip Hop", "Trap"],
  "travis scott": ["Hip Hop", "Psychedelic Trap"],
  "future": ["Hip Hop", "Trap"],
  "juice wrld": ["Emo Rap", "Hip Hop"],
  "post malone": ["Pop", "Hip Hop"],
  "kendrick lamar": ["Conscious Hip Hop", "Rap"],
  "bad bunny": ["Reggaeton", "Latin Trap"],
  "taylor swift": ["Pop", "Country Pop"],
  "billie eilish": ["Indie Pop", "Electropop"],
  "ariana grande": ["Pop", "R&B"],
  "dua lipa": ["Pop", "Dance Pop"],
  "arijit singh": ["Bollywood", "Indian Pop"],
  "vishal-shekhar": ["Bollywood", "Filmi"],
  "shashwat sachdev": ["Bollywood", "Indian Pop"],
  "ar rahman": ["Bollywood", "World Music"],
  "shreya ghoshal": ["Bollywood", "Indian Pop"],
}