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

  async function downloadCard() {
    const html2canvas = (await import("html2canvas")).default
    const card = document.getElementById("personality-card")
    const canvas = await html2canvas(card, {
      backgroundColor: null,
      scale: 2,
    })
    const link = document.createElement("a")
    link.download = "my-music-personality.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
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
                {/* PERSONALITY RESULT CARD */}
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

                {/* SHAREABLE CARD */}
                <div
                  id="personality-card"
                  style={{
                    background: `linear-gradient(135deg, #0f0f0f 0%, ${personality.accentColor}22 100%)`,
                    border: `1px solid ${personality.accentColor}44`,
                    borderRadius: "20px",
                    padding: "40px",
                    maxWidth: "480px",
                    margin: "0 auto 16px",
                    textAlign: "center",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <p style={{ fontSize: "48px", marginBottom: "8px" }}>{personality.emoji}</p>
                  <p style={{ fontSize: "12px", letterSpacing: "3px", color: personality.accentColor, textTransform: "uppercase", marginBottom: "8px" }}>
                    Your Music Personality
                  </p>
                  <h2 style={{ fontSize: "32px", fontFamily: "'Bebas Neue', sans-serif", color: "white", marginBottom: "8px" }}>
                    {personality.personalityType}
                  </h2>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginBottom: "24px", lineHeight: "1.5" }}>
                    {personality.personalityDesc}
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                    {personality.topGenres.map((genre, i) => (
                      <span key={i} style={{
                        background: `${personality.accentColor}22`,
                        border: `1px solid ${personality.accentColor}44`,
                        borderRadius: "20px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        color: personality.accentColor,
                      }}>
                        {capitalize(genre)}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px" }}>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>TOP ARTIST</p>
                      <p style={{ fontSize: "14px", color: "white", fontWeight: "600" }}>{personality.topArtists[0]}</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px" }}>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>DIVERSITY</p>
                      <p style={{ fontSize: "14px", color: "white", fontWeight: "600" }}>{personality.diversityScore}%</p>
                    </div>
                  </div>

                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", letterSpacing: "1px" }}>
                    Spotify Personality
                  </p>
                </div>

                {/* DOWNLOAD BUTTON */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <button className="btn-primary" onClick={downloadCard}>
                    📥 Download Card
                  </button>
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
  "kid cudi": ["hip hop", "rap", "alternative hip hop"],
  "tyler the creator": ["hip hop", "rap", "alternative hip hop"],
  "jackharlow": ["hip hop", "rap", "pop rap"],
  "lil durk": ["hip hop", "rap", "trap"],
  "lil wayne": ["hip hop", "rap", "trap"],
  "eminem": ["hip hop", "rap", "hardcore hip hop"],
  "kanye west": ["hip hop", "rap", "alternative hip hop"],
  "jay-z": ["hip hop", "rap", "east coast hip hop"],
  "nas": ["hip hop", "rap", "east coast hip hop"],
  "biggie smalls": ["hip hop", "rap", "east coast hip hop"],
  "notorious b.i.g.": ["hip hop", "rap", "east coast hip hop"],
  "tupac": ["hip hop", "rap", "west coast hip hop"],
  "2pac": ["hip hop", "rap", "west coast hip hop"],
  "snoop dogg": ["hip hop", "rap", "west coast hip hop"],
  "dr. dre": ["hip hop", "rap", "west coast hip hop"],
  "ice cube": ["hip hop", "rap", "gangsta rap"],
  "chance the rapper": ["hip hop", "rap", "conscious hip hop"],
  "childish gambino": ["hip hop", "rap", "alternative hip hop"],
  "joey bada$$": ["hip hop", "rap", "boom bap"],
  "flatbush zombies": ["hip hop", "rap", "alternative hip hop"],
  "denzel curry": ["hip hop", "rap", "alternative hip hop"],
  "jpegmafia": ["hip hop", "rap", "experimental hip hop"],
  "danny brown": ["hip hop", "rap", "alternative hip hop"],
  "schoolboy q": ["hip hop", "rap", "west coast hip hop"],
  "ab-soul": ["hip hop", "rap", "conscious hip hop"],
  "mac miller": ["hip hop", "rap", "alternative hip hop"],
  "logic": ["hip hop", "rap", "conscious hip hop"],
  "wiz khalifa": ["hip hop", "rap", "pop rap"],
  "big sean": ["hip hop", "rap", "pop rap"],
  "meek mill": ["hip hop", "rap", "trap"],
  "rick ross": ["hip hop", "rap", "trap"],
  "lil kim": ["hip hop", "rap", "east coast hip hop"],
  "missy elliott": ["hip hop", "rap", "r&b"],
  "lauryn hill": ["hip hop", "rap", "r&b"],
  "fugees": ["hip hop", "rap", "r&b"],
  "wu-tang clan": ["hip hop", "rap", "east coast hip hop"],
  "method man": ["hip hop", "rap", "east coast hip hop"],
  "raekwon": ["hip hop", "rap", "east coast hip hop"],
  "ghostface killah": ["hip hop", "rap", "east coast hip hop"],
  "a$ap mob": ["hip hop", "rap", "cloud rap"],
  "a$ap ferg": ["hip hop", "rap", "trap"],
  "a$ap ant": ["hip hop", "rap", "trap"],
  "young thug": ["hip hop", "rap", "trap"],
  "yfn lucci": ["hip hop", "rap", "trap"],
  "moneybagg yo": ["hip hop", "rap", "trap"],
  "42 dugg": ["hip hop", "rap", "trap"],
  "EST gee": ["hip hop", "rap", "trap"],
  "pooh shiesty": ["hip hop", "rap", "trap"],
  "big30": ["hip hop", "rap", "trap"],
  "rylo rodriguez": ["hip hop", "rap", "melodic rap"],
  "nardo wick": ["hip hop", "rap", "trap"],
  "dd osama": ["hip hop", "rap", "drill"],
  "kyle richh": ["hip hop", "rap", "drill"],
  "notti osama": ["hip hop", "rap", "drill"],
  "sha ek": ["hip hop", "rap", "drill"],
  "chief keef": ["hip hop", "rap", "drill"],
  "g herbo": ["hip hop", "rap", "drill"],
  "polo capo": ["hip hop", "rap", "drill"],
  "king von": ["hip hop", "rap", "drill"],
  "lil durk": ["hip hop", "rap", "trap"],
  "quando rondo": ["hip hop", "rap", "trap"],
  "lil loaded": ["hip hop", "rap", "trap"],
  "yung bleu": ["hip hop", "rap", "melodic rap"],
  "saucy santana": ["hip hop", "rap", "trap"],
  "gloss up": ["hip hop", "rap", "trap"],
  "glorilla": ["hip hop", "rap", "trap"],
  "sexyy red": ["hip hop", "rap", "trap"],
  "ice spice": ["hip hop", "rap", "drill"],
  "doja cat": ["pop", "r&b", "hip hop"],
  "lizzo": ["pop", "r&b", "hip hop"],
  "saweetie": ["hip hop", "rap", "pop rap"],
  "city girls": ["hip hop", "rap", "trap"],
  "mulatto": ["hip hop", "rap", "trap"],
  "latto": ["hip hop", "rap", "trap"],
  "flo milli": ["hip hop", "rap", "trap"],
  "doechii": ["hip hop", "rap", "alternative hip hop"],
  "lil nas x": ["pop", "hip hop", "country rap"],
  "cordae": ["hip hop", "rap", "conscious hip hop"],
  "bas": ["hip hop", "rap", "conscious hip hop"],
  "earthgang": ["hip hop", "rap", "alternative hip hop"],
  "j.i.d": ["hip hop", "rap", "alternative hip hop"],
  "6lack": ["r&b", "hip hop", "alternative r&b"],
  "ari lennox": ["r&b", "soul", "neo soul"],
  "smino": ["r&b", "hip hop", "alternative r&b"],
  "lucky daye": ["r&b", "soul"],
  "mustard": ["hip hop", "rap", "trap"],
  "metro boomin": ["hip hop", "rap", "trap"],
  "southside": ["hip hop", "rap", "trap"],
  "murda beatz": ["hip hop", "rap", "trap"],
  "pi'erre bourne": ["hip hop", "rap", "psychedelic trap"],
  "nle choppa": ["hip hop", "rap", "trap"],
  "polo g": ["hip hop", "rap", "melodic rap"],
  "calboy": ["hip hop", "rap", "melodic rap"],
  "lakeyah": ["hip hop", "rap", "trap"],
  "young nudy": ["hip hop", "rap", "trap"],
  "21 lil harold": ["hip hop", "rap", "trap"],
  "baby drill": ["hip hop", "rap", "drill"],
  "central cee": ["hip hop", "rap", "uk rap"],
  "dave": ["hip hop", "rap", "uk rap"],
  "stormzy": ["hip hop", "rap", "uk rap"],
  "slowthai": ["hip hop", "rap", "uk rap"],
  "little simz": ["hip hop", "rap", "uk rap"],
  "aitch": ["hip hop", "rap", "uk rap"],
  "digga d": ["hip hop", "rap", "uk drill"],
  "headie one": ["hip hop", "rap", "uk drill"],
  "unknown t": ["hip hop", "rap", "uk drill"],
  "m1llionz": ["hip hop", "rap", "uk drill"],
  "russ millions": ["hip hop", "rap", "uk drill"],
  "tion wayne": ["hip hop", "rap", "uk rap"],
  "skepta": ["hip hop", "rap", "grime"],
  "wiley": ["hip hop", "rap", "grime"],
  "dizzee rascal": ["hip hop", "rap", "grime"],
  "giggs": ["hip hop", "rap", "uk rap"],
  "french montana": ["hip hop", "rap", "pop rap"],
  "wale": ["hip hop", "rap", "conscious hip hop"],
  "kid ink": ["hip hop", "rap", "pop rap"],
  "machine gun kelly": ["hip hop", "rap", "pop punk"],
  "iann dior": ["hip hop", "rap", "emo rap"],
  "nothing,nowhere.": ["hip hop", "rap", "emo rap"],
  "poorstacy": ["hip hop", "rap", "emo rap"],
  "unotheactivist": ["hip hop", "rap", "trap"],
  "quavo": ["hip hop", "rap", "trap"],
  "takeoff": ["hip hop", "rap", "trap"],
  "offset": ["hip hop", "rap", "trap"],
  "migos": ["hip hop", "rap", "trap"],
  "2 chainz": ["hip hop", "rap", "trap"],
  "gucci mane": ["hip hop", "rap", "trap"],
  "waka flocka flame": ["hip hop", "rap", "trap"],
  "fetty wap": ["hip hop", "rap", "trap"],
  "trinidad james": ["hip hop", "rap", "trap"],
  "iggy azalea": ["hip hop", "rap", "pop rap"],
  "swae lee": ["hip hop", "rap", "pop rap"],
  "slim jxmmi": ["hip hop", "rap", "trap"],
  "rae sremmurd": ["hip hop", "rap", "trap"],
  "young dolph": ["hip hop", "rap", "trap"],
  "key glock": ["hip hop", "rap", "trap"],
  "paper route empire": ["hip hop", "rap", "trap"],
  "mozzy": ["hip hop", "rap", "west coast hip hop"],
  "too short": ["hip hop", "rap", "west coast hip hop"],
  "e-40": ["hip hop", "rap", "west coast hip hop"],
  "mac dre": ["hip hop", "rap", "west coast hip hop"],
  "g-eazy": ["hip hop", "rap", "pop rap"],
  "iamsu!": ["hip hop", "rap", "pop rap"],
  "sage the gemini": ["hip hop", "rap", "pop rap"],
  "ty dolla $ign": ["r&b", "hip hop", "pop"],
  "jeremih": ["r&b", "hip hop"],
  "tory lanez": ["hip hop", "rap", "r&b"],
  "p-lo": ["hip hop", "rap", "pop rap"],
  "keak da sneak": ["hip hop", "rap", "west coast hip hop"],
  "b-legit": ["hip hop", "rap", "west coast hip hop"],

  // --- R&B / SOUL ---
  "summer walker": ["r&b", "soul"],
  "jhene aiko": ["r&b", "soul", "alternative r&b"],
  "bryson tiller": ["r&b", "soul", "trap soul"],
  "khalid": ["r&b", "pop"],
  "giveon": ["r&b", "soul"],
  "brent faiyaz": ["r&b", "soul", "alternative r&b"],
  "usher": ["r&b", "soul", "pop"],
  "chris brown": ["r&b", "pop"],
  "bruno mars": ["pop", "r&b", "funk"],
  "sza": ["r&b", "soul", "alternative r&b"],
  "frank ocean": ["r&b", "soul", "alternative r&b"],
  "beyonce": ["pop", "r&b", "soul"],
  "rihanna": ["pop", "r&b", "dancehall"],
  "alicia keys": ["r&b", "soul", "pop"],
  "john legend": ["r&b", "soul", "pop"],
  "mariah carey": ["pop", "r&b", "soul"],
  "whitney houston": ["pop", "r&b", "soul"],
  "janet jackson": ["pop", "r&b", "soul"],
  "michael jackson": ["pop", "r&b", "soul"],
  "prince": ["pop", "r&b", "funk"],
  "stevie wonder": ["r&b", "soul", "funk"],
  "aretha franklin": ["soul", "r&b", "gospel"],
  "marvin gaye": ["soul", "r&b", "funk"],
  "al green": ["soul", "r&b"],
  "otis redding": ["soul", "r&b"],
  "sam cooke": ["soul", "r&b", "gospel"],
  "ray charles": ["soul", "r&b", "jazz"],
  "james brown": ["soul", "funk", "r&b"],
  "diana ross": ["soul", "pop", "r&b"],
  "the temptations": ["soul", "r&b", "motown"],
  "four tops": ["soul", "r&b", "motown"],
  "smokey robinson": ["soul", "r&b", "motown"],
  "gladys knight": ["soul", "r&b"],
  "chaka khan": ["soul", "r&b", "funk"],
  "patti labelle": ["soul", "r&b", "gospel"],
  "tina turner": ["rock", "soul", "r&b"],
  "mary j. blige": ["r&b", "soul", "hip hop"],
  "erykah badu": ["r&b", "neo soul", "soul"],
  "d'angelo": ["r&b", "neo soul", "funk"],
  "maxwell": ["r&b", "neo soul"],
  "musiq soulchild": ["r&b", "neo soul"],
  "india.arie": ["r&b", "neo soul"],
  "jill scott": ["r&b", "neo soul", "soul"],
  "angie stone": ["r&b", "soul"],
  "anthony hamilton": ["r&b", "soul", "gospel"],
  "ledisi": ["r&b", "soul"],
  "tweets": ["r&b", "soul"],
  "keyshia cole": ["r&b", "soul"],
  "brandy": ["r&b", "soul", "pop"],
  "monica": ["r&b", "soul", "pop"],
  "destiny's child": ["pop", "r&b"],
  "tlc": ["r&b", "pop", "hip hop"],
  "en vogue": ["r&b", "soul"],
  "xscape": ["r&b", "soul"],
  "112": ["r&b", "soul"],
  "boyz ii men": ["r&b", "soul"],
  "new edition": ["r&b", "pop"],
  "new kids on the block": ["pop", "r&b"],
  "bb&q band": ["r&b", "soul"],
  "bobby brown": ["r&b", "pop"],
  "johnny gill": ["r&b", "soul"],
  "ralph tresvant": ["r&b", "pop"],
  "r. kelly": ["r&b", "soul", "pop"],
  "aaliyah": ["r&b", "pop", "soul"],
  "tweet": ["r&b", "soul"],
  "ashanti": ["r&b", "pop"],
  "ciara": ["r&b", "pop", "dance"],
  "mya": ["r&b", "pop"],
  "amerie": ["r&b", "pop"],
  "tweet": ["r&b", "soul"],
  "neo": ["r&b", "soul", "pop"],
  "mario": ["r&b", "pop"],
  "omarion": ["r&b", "pop"],
  "b2k": ["r&b", "pop"],
  "pretty ricky": ["r&b", "pop"],
  "pleasure p": ["r&b", "pop"],
  "trey songz": ["r&b", "pop"],
  "jason derulo": ["pop", "r&b", "dance"],
  "tank": ["r&b", "soul"],
  "ginuwine": ["r&b", "pop"],
  "joe": ["r&b", "soul"],
  "jaheim": ["r&b", "soul"],
  "lyfe jennings": ["r&b", "soul"],
  "raheem devaughn": ["r&b", "soul", "neo soul"],
  "eric benet": ["r&b", "soul"],
  "mario winans": ["r&b", "soul"],
  "case": ["r&b", "soul"],
  "donell jones": ["r&b", "soul"],
  "el debarge": ["r&b", "pop"],
  "tevin campbell": ["r&b", "pop"],
  "troop": ["r&b", "soul"],
  "h-town": ["r&b", "soul"],
  "dru hill": ["r&b", "soul"],
  "silk": ["r&b", "soul"],
  "intro": ["r&b", "soul"],
  "next": ["r&b", "pop"],
  "profyle": ["r&b", "soul"],
  "allure": ["r&b", "pop"],
  "total": ["r&b", "pop"],
  "3lw": ["r&b", "pop"],
  "blaque": ["r&b", "pop"],
  "j holiday": ["r&b", "soul"],
  "pleasure p": ["r&b", "pop"],
  "august alsina": ["r&b", "pop"],
  "partynextdoor": ["r&b", "hip hop"],
  "ro james": ["r&b", "soul"],
  "dvsn": ["r&b", "soul"],
  "daniel caesar": ["r&b", "soul", "alternative r&b"],
  "h.e.r.": ["r&b", "soul"],
  "ann marie": ["r&b", "soul"],
  "kehlani": ["r&b", "pop", "alternative r&b"],
  "ella mai": ["r&b", "soul"],
  "normani": ["pop", "r&b", "dance"],
  "tinashe": ["r&b", "pop", "dance"],
  "kiana lede": ["r&b", "pop"],
  "snoh aalegra": ["r&b", "soul"],
  "masego": ["r&b", "jazz", "soul"],
  "kofi siriboe": ["r&b", "soul"],
  "sudan archives": ["r&b", "experimental", "soul"],
  "serpentwithfeet": ["r&b", "experimental", "soul"],
  "hiatus kaiyote": ["r&b", "neo soul", "jazz"],
  "anderson .paak": ["r&b", "hip hop", "funk"],
  "bootsy collins": ["funk", "r&b"],
  "rick james": ["funk", "r&b", "soul"],
  "george clinton": ["funk", "r&b"],
  "parliament": ["funk", "r&b"],
  "funkadelic": ["funk", "r&b", "psychedelic"],
  "earth wind & fire": ["funk", "r&b", "soul"],
  "the commodores": ["funk", "r&b", "soul"],
  "kool and the gang": ["funk", "r&b", "soul"],
  "tower of power": ["funk", "r&b", "soul"],
  "sly and the family stone": ["funk", "r&b", "soul"],
  "sylvester": ["r&b", "soul", "disco"],
  "donna summer": ["disco", "pop", "r&b"],
  "the jacksons": ["pop", "r&b", "soul"],

  // --- POP ---
  "taylor swift": ["pop", "country pop"],
  "billie eilish": ["pop", "indie pop", "electropop"],
  "ariana grande": ["pop", "r&b"],
  "dua lipa": ["pop", "dance pop"],
  "olivia rodrigo": ["pop", "pop rock"],
  "harry styles": ["pop", "pop rock"],
  "ed sheeran": ["pop", "acoustic pop"],
  "sam smith": ["pop", "soul"],
  "lady gaga": ["pop", "dance pop", "electropop"],
  "katy perry": ["pop", "dance pop"],
  "selena gomez": ["pop", "dance pop"],
  "justin bieber": ["pop", "r&b"],
  "shawn mendes": ["pop", "acoustic pop"],
  "camila cabello": ["pop", "latin pop"],
  "halsey": ["pop", "alternative pop", "electropop"],
  "sia": ["pop", "dance pop"],
  "p!nk": ["pop", "pop rock"],
  "britney spears": ["pop", "dance pop"],
  "christina aguilera": ["pop", "r&b"],
  "adele": ["pop", "soul"],
  "lorde": ["pop", "indie pop", "electropop"],
  "lana del rey": ["indie pop", "dream pop"],
  "charlie puth": ["pop", "r&b"],
  "niall horan": ["pop", "acoustic pop"],
  "one direction": ["pop"],
  "little mix": ["pop", "r&b"],
  "fifth harmony": ["pop", "r&b"],
  "the pussycat dolls": ["pop", "r&b", "dance"],
  "spice girls": ["pop", "dance pop"],
  "backstreet boys": ["pop"],
  "nsync": ["pop"],
  "boyzone": ["pop"],
  "westlife": ["pop"],
  "take that": ["pop"],
  "jonas brothers": ["pop", "pop rock"],
  "miley cyrus": ["pop", "pop rock"],
  "demi lovato": ["pop", "pop rock"],
  "kesha": ["pop", "electropop"],
  "meghan trainor": ["pop"],
  "bebe rexha": ["pop", "pop rock"],
  "anne-marie": ["pop"],
  "jess glynne": ["pop", "soul"],
  "ella henderson": ["pop", "soul"],
  "ava max": ["pop", "electropop"],
  "sabrina carpenter": ["pop"],
  "gracie abrams": ["pop", "indie pop"],
  "conan gray": ["pop", "indie pop"],
  "stephen sanchez": ["pop"],
  "jvke": ["pop"],
  "gayle": ["pop", "pop rock"],
  "tate mcrae": ["pop"],
  "laufey": ["pop", "jazz", "indie pop"],
  "clairo": ["indie pop", "bedroom pop"],
  "girl in red": ["indie pop", "bedroom pop"],
  "remi wolf": ["indie pop", "funk"],
  "beabadoobee": ["indie pop", "indie rock"],
  "benee": ["indie pop", "dream pop"],
  "mxmtoon": ["indie pop", "bedroom pop"],
  "phoebe bridgers": ["indie folk", "indie rock"],
  "lucy dacus": ["indie rock", "indie folk"],
  "boygenius": ["indie rock", "indie folk"],
  "julien baker": ["indie folk", "indie rock"],
  "snail mail": ["indie rock", "indie pop"],
  "soccer mommy": ["indie rock", "indie pop"],
  "alex g": ["indie rock", "indie pop"],
  "illuminati hotties": ["indie rock", "indie pop"],
  "muna": ["indie pop", "synth pop"],
  "wet leg": ["indie rock", "indie pop"],
  "dry cleaning": ["indie rock", "post punk"],
  "shame": ["indie rock", "post punk"],
  "fontaines d.c.": ["indie rock", "post punk"],
  "squid": ["indie rock", "post punk"],
  "black country new road": ["indie rock", "post punk"],
  "black midi": ["indie rock", "experimental rock"],
  "caroline polachek": ["indie pop", "art pop"],
  "charli xcx": ["pop", "electropop", "hyperpop"],
  "sophie": ["electronic", "hyperpop"],
  "100 gecs": ["hyperpop", "electronic"],
  "dorian electra": ["hyperpop", "electronic"],
  "slayyyter": ["pop", "hyperpop"],
  "kim petras": ["pop", "electropop"],
  "carly rae jepsen": ["pop", "electropop"],
  "troye sivan": ["pop", "indie pop"],
  "years & years": ["pop", "electropop"],
  "zara larsson": ["pop", "r&b"],
  "tove lo": ["pop", "electropop"],
  "MØ": ["pop", "electropop"],
  "sigrid": ["pop", "electropop"],
  "aurora": ["indie pop", "art pop"],
  "astrid s": ["pop", "electropop"],
  "dagny": ["pop", "electropop"],
  "alma": ["pop", "electropop"],
  "leo ieiri": ["j-pop", "pop"],
  "aimyon": ["j-pop", "pop"],
  "yoasobi": ["j-pop", "pop"],
  "official hige dandism": ["j-pop", "pop rock"],
  "king gnu": ["j-pop", "alternative rock"],
  "kenshi yonezu": ["j-pop", "pop"],
  "lisa": ["k-pop", "pop"],
  "blackpink": ["k-pop", "pop"],
  "bts": ["k-pop", "pop"],
  "twice": ["k-pop", "pop"],
  "exo": ["k-pop", "pop"],
  "shinee": ["k-pop", "pop"],
  "seventeen": ["k-pop", "pop"],
  "nct 127": ["k-pop", "pop"],
  "stray kids": ["k-pop", "pop"],
  "aespa": ["k-pop", "pop"],
  "itzy": ["k-pop", "pop"],
  "red velvet": ["k-pop", "pop"],
  "ive": ["k-pop", "pop"],
  "newjeans": ["k-pop", "pop"],
  "le sserafim": ["k-pop", "pop"],
  "txt": ["k-pop", "pop"],
  "enhypen": ["k-pop", "pop"],
  "ateez": ["k-pop", "pop"],
  "monsta x": ["k-pop", "pop"],
  "got7": ["k-pop", "pop"],
  "super junior": ["k-pop", "pop"],
  "wonder girls": ["k-pop", "pop"],
  "2ne1": ["k-pop", "pop"],
  "2pm": ["k-pop", "pop"],
  "bigbang": ["k-pop", "pop"],
  "psy": ["k-pop", "pop"],
  "g-dragon": ["k-pop", "hip hop"],
  "taeyang": ["k-pop", "r&b"],
  "cl": ["k-pop", "hip hop"],
  "jay park": ["k-pop", "hip hop", "r&b"],
  "zico": ["k-pop", "hip hop"],

  // --- ROCK / ALTERNATIVE ---
  "tame impala": ["rock", "psychedelic rock", "indie rock"],
  "arctic monkeys": ["rock", "indie rock"],
  "the 1975": ["indie pop", "alternative rock"],
  "hozier": ["indie", "folk", "blues rock"],
  "bon iver": ["indie folk", "folk"],
  "glass animals": ["indie pop", "psychedelic pop"],
  "the national": ["indie rock", "alternative rock"],
  "radiohead": ["alternative rock", "art rock", "experimental rock"],
  "thom yorke": ["alternative rock", "electronic"],
  "coldplay": ["alternative rock", "pop rock"],
  "u2": ["rock", "alternative rock", "pop rock"],
  "the rolling stones": ["rock", "blues rock"],
  "the beatles": ["rock", "pop rock"],
  "led zeppelin": ["rock", "hard rock", "blues rock"],
  "pink floyd": ["rock", "progressive rock", "psychedelic rock"],
  "the doors": ["rock", "psychedelic rock"],
  "the who": ["rock", "hard rock"],
  "nirvana": ["grunge", "alternative rock"],
  "pearl jam": ["grunge", "alternative rock"],
  "soundgarden": ["grunge", "alternative rock"],
  "alice in chains": ["grunge", "alternative rock"],
  "stone temple pilots": ["grunge", "alternative rock"],
  "foo fighters": ["alternative rock", "hard rock"],
  "weezer": ["alternative rock", "pop rock"],
  "green day": ["punk rock", "pop punk"],
  "blink-182": ["punk rock", "pop punk"],
  "sum 41": ["punk rock", "pop punk"],
  "my chemical romance": ["emo", "alternative rock"],
  "fall out boy": ["emo", "pop punk"],
  "panic! at the disco": ["pop rock", "alternative rock"],
  "paramore": ["pop punk", "alternative rock"],
  "twenty one pilots": ["alternative rock", "indie pop"],
  "imagine dragons": ["alternative rock", "pop rock"],
  "one republic": ["pop rock", "alternative rock"],
  "bastille": ["indie pop", "alternative pop"],
  "the killers": ["alternative rock", "indie rock"],
  "death cab for cutie": ["indie rock", "alternative rock"],
  "modest mouse": ["indie rock", "alternative rock"],
  "the postal service": ["indie pop", "electronic"],
  "built to spill": ["indie rock", "alternative rock"],
  "pavement": ["indie rock", "alternative rock"],
  "dinosaur jr.": ["indie rock", "alternative rock"],
  "sonic youth": ["alternative rock", "noise rock"],
  "pixies": ["alternative rock", "indie rock"],
  "the smiths": ["alternative rock", "indie rock"],
  "morrissey": ["alternative rock", "indie rock"],
  "the cure": ["alternative rock", "post punk", "gothic rock"],
  "joy division": ["post punk", "alternative rock"],
  "new order": ["post punk", "synth pop", "electronic"],
  "depeche mode": ["synth pop", "alternative rock", "electronic"],
  "the chainsmokers": ["pop", "edm"],
  "nine inch nails": ["industrial rock", "alternative rock"],
  "marilyn manson": ["industrial rock", "alternative rock"],
  "tool": ["progressive rock", "alternative rock"],
  "a perfect circle": ["alternative rock", "progressive rock"],
  "deftones": ["alternative metal", "alternative rock"],
  "incubus": ["alternative rock", "funk metal"],
  "rage against the machine": ["alternative metal", "rap rock"],
  "system of a down": ["alternative metal", "progressive rock"],
  "linkin park": ["nu-metal", "alternative rock"],
  "slipknot": ["heavy metal", "nu-metal"],
  "korn": ["nu-metal", "alternative metal"],
  "limp bizkit": ["nu-metal", "rap rock"],
  "papa roach": ["alternative metal", "pop punk"],
  "three days grace": ["alternative metal", "post-grunge"],
  "breaking benjamin": ["alternative metal", "post-grunge"],
  "chevelle": ["alternative metal", "post-grunge"],
  "shinedown": ["hard rock", "alternative metal"],
  "halestorm": ["hard rock", "alternative metal"],
  "evanescence": ["alternative metal", "gothic rock"],
  "within temptation": ["symphonic metal", "gothic metal"],
  "nightwish": ["symphonic metal", "gothic metal"],
  "epica": ["symphonic metal", "gothic metal"],
  "metallica": ["heavy metal", "thrash metal"],
  "megadeth": ["thrash metal", "heavy metal"],
  "slayer": ["thrash metal", "heavy metal"],
  "anthrax": ["thrash metal", "heavy metal"],
  "iron maiden": ["heavy metal"],
  "black sabbath": ["heavy metal", "hard rock"],
  "ozzy osbourne": ["heavy metal", "hard rock"],
  "judas priest": ["heavy metal"],
  "ac/dc": ["hard rock", "rock"],
  "guns n' roses": ["hard rock", "rock"],
  "aerosmith": ["hard rock", "rock"],
  "kiss": ["hard rock", "glam metal"],
  "def leppard": ["hard rock", "glam metal"],
  "bon jovi": ["hard rock", "pop rock"],
  "van halen": ["hard rock", "rock"],
  "motley crue": ["hard rock", "glam metal"],
  "poison": ["glam metal", "hard rock"],
  "ratt": ["glam metal", "hard rock"],
  "warrant": ["glam metal", "hard rock"],
  "whitesnake": ["hard rock", "glam metal"],
  "deep purple": ["hard rock", "progressive rock"],
  "rush": ["progressive rock", "hard rock"],
  "yes": ["progressive rock"],
  "genesis": ["progressive rock", "pop rock"],
  "peter gabriel": ["art rock", "pop"],
  "phil collins": ["pop rock", "soft rock"],
  "elton john": ["pop rock", "soft rock"],
  "david bowie": ["glam rock", "art rock", "pop"],
  "queen": ["rock", "pop rock", "glam rock"],
  "fleetwood mac": ["soft rock", "pop rock"],
  "stevie nicks": ["soft rock", "pop rock"],
  "the eagles": ["soft rock", "country rock"],
  "tom petty": ["rock", "heartland rock"],
  "bruce springsteen": ["rock", "heartland rock"],
  "bob dylan": ["folk rock", "folk"],
  "neil young": ["folk rock", "rock"],
  "joni mitchell": ["folk", "folk rock"],
  "simon & garfunkel": ["folk", "folk rock"],
  "james taylor": ["soft rock", "folk"],
  "carole king": ["soft rock", "folk"],
  "carly simon": ["soft rock", "pop"],
  "cat stevens": ["folk", "soft rock"],
  "gordon lightfoot": ["folk", "country"],
  "harry nilsson": ["pop", "soft rock"],
  "randy newman": ["soft rock", "pop"],
  "jackson browne": ["soft rock", "folk rock"],
  "warren zevon": ["rock", "soft rock"],
  "the beach boys": ["pop rock", "psychedelic rock"],
  "the byrds": ["folk rock", "psychedelic rock"],
  "the mamas & the papas": ["folk rock", "pop rock"],
  "buffalo springfield": ["folk rock", "country rock"],
  "crosby stills nash & young": ["folk rock", "country rock"],
  "the band": ["rock", "country rock"],
  "creedence clearwater revival": ["rock", "country rock"],
  "lynyrd skynyrd": ["southern rock", "rock"],
  "the allman brothers band": ["southern rock", "blues rock"],
  "zz top": ["blues rock", "hard rock"],
  "steely dan": ["jazz rock", "soft rock"],
  "little feat": ["rock", "country rock"],
  "grateful dead": ["psychedelic rock", "rock"],
  "jefferson airplane": ["psychedelic rock", "rock"],
  "janis joplin": ["blues rock", "psychedelic rock"],
  "jimi hendrix": ["psychedelic rock", "blues rock"],
  "cream": ["blues rock", "psychedelic rock"],
  "the kinks": ["rock", "pop rock"],
  "the animals": ["rock", "blues rock"],
  "the yardbirds": ["rock", "blues rock"],
  "the small faces": ["mod rock", "psychedelic rock"],
  "the jam": ["punk rock", "mod rock"],
  "the clash": ["punk rock", "new wave"],
  "the sex pistols": ["punk rock"],
  "the ramones": ["punk rock"],
  "buzzcocks": ["punk rock", "new wave"],
  "wire": ["punk rock", "new wave"],
  "television": ["punk rock", "new wave"],
  "talking heads": ["new wave", "art rock"],
  "blondie": ["new wave", "punk rock"],
  "the police": ["new wave", "reggae rock"],
  "sting": ["pop rock", "jazz", "reggae rock"],
  "echo & the bunnymen": ["post punk", "new wave"],
  "the sisters of mercy": ["gothic rock", "post punk"],
  "bauhaus": ["gothic rock", "post punk"],
  "siouxsie and the banshees": ["post punk", "gothic rock"],
  "cocteau twins": ["dream pop", "shoegaze"],
  "my bloody valentine": ["shoegaze", "alternative rock"],
  "slowdive": ["shoegaze", "dream pop"],
  "ride": ["shoegaze", "alternative rock"],
  "lush": ["shoegaze", "dream pop"],
  "mazzy star": ["dream pop", "shoegaze"],
  "beach house": ["dream pop", "indie pop"],
  "beach fossils": ["dream pop", "indie rock"],
  "still woozy": ["indie pop", "bedroom pop"],
  "rex orange county": ["indie pop", "bedroom pop"],
  "cavetown": ["indie pop", "bedroom pop"],
  "dominic fike": ["indie pop", "pop rock"],
  "wallows": ["indie rock", "indie pop"],
  "the wrecks": ["indie rock", "pop rock"],
  "cage the elephant": ["alternative rock", "indie rock"],
  "portugal. the man": ["indie rock", "alternative rock"],
  "of monsters and men": ["indie folk", "indie rock"],
  "mumford & sons": ["folk rock", "indie folk"],
  "the lumineers": ["folk rock", "indie folk"],
  "fleet foxes": ["indie folk", "folk"],
  "iron & wine": ["indie folk", "folk"],
  "sufjan stevens": ["indie folk", "chamber pop"],
  "nick drake": ["folk", "acoustic"],
  "vashti bunyan": ["folk", "acoustic"],
  "bert jansch": ["folk", "acoustic"],
  "john fahey": ["folk", "fingerpicking"],
  "leo kottke": ["folk", "fingerpicking"],
  "jack johnson": ["acoustic pop", "soft rock"],
  "ben harper": ["rock", "acoustic pop", "folk"],
  "xavier rudd": ["folk", "acoustic pop"],
  "john mayer": ["pop rock", "blues rock", "acoustic pop"],
  "dave matthews band": ["rock", "jam band"],
  "phish": ["rock", "jam band"],
  "widespread panic": ["rock", "jam band", "southern rock"],
  "tedeschi trucks band": ["blues rock", "soul", "jam band"],
  "gary clark jr.": ["blues rock", "soul"],
  "joe bonamassa": ["blues rock"],
  "eric clapton": ["blues rock", "rock"],
  "bb king": ["blues", "blues rock"],
  "muddy waters": ["blues"],
  "robert johnson": ["blues"],
  "howlin' wolf": ["blues"],
  "john lee hooker": ["blues"],
  "lead belly": ["blues", "folk"],

  // --- ELECTRONIC / EDM ---
  "calvin harris": ["edm", "electro house", "dance pop"],
  "david guetta": ["edm", "electro house"],
  "marshmello": ["edm", "future bass"],
  "the chainsmokers": ["pop", "edm"],
  "deadmau5": ["edm", "progressive house"],
  "tiesto": ["edm", "trance", "progressive house"],
  "armin van buuren": ["edm", "trance"],
  "paul van dyk": ["edm", "trance"],
  "above & beyond": ["edm", "trance"],
  "ferry corsten": ["edm", "trance"],
  "sasha": ["edm", "progressive house"],
  "john digweed": ["edm", "progressive house"],
  "carl cox": ["edm", "techno"],
  "richie hawtin": ["techno", "minimal techno"],
  "jeff mills": ["techno"],
  "robert hood": ["techno", "minimal techno"],
  "aphex twin": ["electronic", "ambient", "idm"],
  "autechre": ["electronic", "idm"],
  "boards of canada": ["electronic", "ambient"],
  "burial": ["electronic", "dubstep", "ambient"],
  "four tet": ["electronic", "ambient"],
  "james blake": ["electronic", "r&b", "soul"],
  "bon iver": ["indie folk", "folk", "electronic"],
  "flume": ["electronic", "future bass"],
  "odesza": ["electronic", "indie electronic"],
  "tycho": ["electronic", "ambient", "chillwave"],
  "bonobo": ["electronic", "downtempo", "jazz"],
  "nicolas jaar": ["electronic", "ambient", "minimal"],
  "bicep": ["electronic", "house"],
  "floating points": ["electronic", "jazz", "ambient"],
  "jon hopkins": ["electronic", "ambient"],
  "nils frahm": ["electronic", "classical", "ambient"],
  "max richter": ["classical", "ambient", "electronic"],
  "ólafur arnalds": ["electronic", "classical", "ambient"],
  "moderat": ["electronic", "ambient"],
  "modeselektor": ["electronic", "techno"],
  "skrillex": ["edm", "dubstep"],
  "diplo": ["edm", "electronic", "hip hop"],
  "zedd": ["edm", "electro house"],
  "martin garrix": ["edm", "progressive house"],
  "hardwell": ["edm", "progressive house"],
  "nervo": ["edm", "electro house"],
  "w&w": ["edm", "trance"],
  "afrojack": ["edm", "electro house"],
  "steve aoki": ["edm", "electro house"],
  "knife party": ["edm", "electro house", "dubstep"],
  "flux pavilion": ["edm", "dubstep"],
  "excision": ["edm", "dubstep"],
  "zomboy": ["edm", "dubstep"],
  "virtual riot": ["edm", "dubstep"],
  "illenium": ["edm", "future bass"],
  "san holo": ["edm", "future bass"],
  "griz": ["edm", "funk", "future bass"],
  "gramatik": ["edm", "hip hop", "funk"],
  "pretty lights": ["edm", "hip hop", "funk"],
  "big gigantic": ["edm", "funk", "jazz"],
  "rezz": ["edm", "techno"],
  "tchami": ["edm", "deep house", "future house"],
  "malaa": ["edm", "tech house"],
  "fisher": ["edm", "tech house"],
  "chris lake": ["edm", "tech house"],
  "black coffee": ["edm", "afro house"],
  "peggy gou": ["edm", "house", "techno"],
  "disclosure": ["edm", "house", "electronic"],
  "jamie xx": ["electronic", "house"],
  "caribou": ["electronic", "psychedelic pop"],
  "LCD soundsystem": ["electronic", "dance punk"],
  "daft punk": ["electronic", "house", "disco"],
  "justice": ["electronic", "electro house"],
  "gesaffelstein": ["electronic", "techno", "industrial"],
  "kavinsky": ["electronic", "synthwave"],
  "perturbator": ["electronic", "synthwave"],
  "gunship": ["electronic", "synthwave"],
  "carpenter brut": ["electronic", "synthwave"],
  "fm-84": ["electronic", "synthwave"],
  "the midnight": ["electronic", "synthwave"],
  "washed out": ["chillwave", "indie pop"],
  "neon indian": ["chillwave", "indie pop"],
  "toro y moi": ["chillwave", "indie pop", "funk"],
  "m83": ["electronic", "shoegaze", "ambient"],
  "empire of the sun": ["electronic", "indie pop"],
  "passion pit": ["indie pop", "electropop"],
  "mgmt": ["psychedelic pop", "indie pop"],
  "animal collective": ["experimental pop", "psychedelic pop"],
  "panda bear": ["experimental pop", "electronic"],
  "ariel pink": ["lo-fi", "indie pop"],
  "cass mccombs": ["indie rock", "folk"],
  "the microphones": ["indie folk", "lo-fi"],
  "mount eerie": ["indie folk", "ambient"],

  // --- LATIN ---
  "bad bunny": ["latin", "reggaeton", "latin trap"],
  "j balvin": ["latin", "reggaeton"],
  "ozuna": ["latin", "reggaeton"],
  "maluma": ["latin", "reggaeton"],
  "karol g": ["latin", "reggaeton"],
  "rauw alejandro": ["latin", "reggaeton", "r&b"],
  "anuel aa": ["latin", "trap latino", "reggaeton"],
  "myke towers": ["latin", "trap latino", "reggaeton"],
  "jhay cortez": ["latin", "reggaeton", "r&b"],
  "lunay": ["latin", "reggaeton"],
  "sech": ["latin", "reggaeton"],
  "dalex": ["latin", "reggaeton"],
  "wisin & yandel": ["latin", "reggaeton"],
  "don omar": ["latin", "reggaeton"],
  "daddy yankee": ["latin", "reggaeton"],
  "pitbull": ["latin", "dance pop", "hip hop"],
  "marc anthony": ["latin", "salsa"],
  "jennifer lopez": ["pop", "latin", "r&b"],
  "shakira": ["pop", "latin", "rock"],
  "ricky martin": ["pop", "latin"],
  "enrique iglesias": ["pop", "latin"],
  "alejandro sanz": ["latin pop", "flamenco"],
  "juanes": ["latin rock", "latin pop"],
  "carlos vives": ["latin", "vallenato"],
  "silvestre dangond": ["latin", "vallenato"],
  "carlos rivera": ["latin pop"],
  "christian nodal": ["regional mexican", "latin"],
  "eslabon armado": ["regional mexican", "latin"],
  "natanael cano": ["regional mexican", "latin"],
  "peso pluma": ["regional mexican", "latin"],
  "banda ms": ["regional mexican", "latin"],
  "los bukis": ["regional mexican", "latin pop"],
  "los tigres del norte": ["regional mexican"],
  "vicente fernandez": ["regional mexican", "ranchera"],
  "joan sebastian": ["regional mexican", "ranchera"],
  "marco antonio solis": ["latin pop", "regional mexican"],
  "luis miguel": ["latin pop"],
  "julio iglesias": ["latin pop"],
  "jose jose": ["latin pop", "ballad"],
  "camilo": ["latin pop"],
  "sebastián yatra": ["latin pop"],
  "paulo londra": ["latin pop", "latin trap"],
  "bizarrap": ["latin", "hip hop"],
  "la rosalia": ["latin", "flamenco pop"],
  "c. tangana": ["latin", "hip hop"],
  "residente": ["latin", "hip hop"],
  "calle 13": ["latin", "hip hop", "reggaeton"],
  "tego calderon": ["latin", "reggaeton"],
  "ivy queen": ["latin", "reggaeton"],
  "glory": ["latin", "reggaeton"],
  "nicky jam": ["latin", "reggaeton"],
  "plan b": ["latin", "reggaeton"],
  "wisin": ["latin", "reggaeton"],
  "yandel": ["latin", "reggaeton"],
  "arcangel": ["latin", "trap latino", "reggaeton"],
  "de la ghetto": ["latin", "reggaeton"],
  "alexio": ["latin", "reggaeton"],
  "kevin roldan": ["latin", "reggaeton"],
  "reykon": ["latin", "reggaeton"],
  "mr. black": ["latin", "reggaeton"],
  "cosculluela": ["latin", "reggaeton"],
  "ñengo flow": ["latin", "reggaeton"],
  "farruko": ["latin", "reggaeton"],
  "zion & lennox": ["latin", "reggaeton"],

  // --- BOLLYWOOD / INDIAN ---
  "arijit singh": ["bollywood", "indian pop", "filmi"],
  "ar rahman": ["bollywood", "indian classical", "world music"],
  "shreya ghoshal": ["bollywood", "indian pop", "filmi"],
  "atif aslam": ["bollywood", "indian pop", "filmi"],
  "badshah": ["bollywood", "hip hop", "bhangra"],
  "divine": ["hip hop", "rap", "desi hip hop"],
  "sonu nigam": ["bollywood", "indian pop", "filmi"],
  "kumar sanu": ["bollywood", "filmi"],
  "udit narayan": ["bollywood", "filmi"],
  "lata mangeshkar": ["bollywood", "classical", "filmi"],
  "asha bhosle": ["bollywood", "filmi"],
  "kishore kumar": ["bollywood", "filmi"],
  "mohammad rafi": ["bollywood", "filmi"],
  "mukesh": ["bollywood", "filmi"],
  "hemant kumar": ["bollywood", "filmi"],
  "manna dey": ["bollywood", "filmi"],
  "s.p. balasubrahmanyam": ["bollywood", "filmi"],
  "hariharan": ["indian classical", "bollywood", "ghazal"],
  "jagjit singh": ["ghazal"],
  "ghulam ali": ["ghazal"],
  "mehdi hassan": ["ghazal"],
  "nusrat fateh ali khan": ["qawwali", "world music"],
  "rahat fateh ali khan": ["bollywood", "qawwali", "filmi"],
  "abida parveen": ["qawwali", "sufi", "world music"],
  "coke studio": ["world music", "fusion"],
  "ali zafar": ["bollywood", "pop", "rock"],
  "adnan sami": ["bollywood", "pop"],
  "himesh reshammiya": ["bollywood", "filmi", "pop"],
  "vishal-shekhar": ["bollywood", "filmi"],
  "shankar ehsaan loy": ["bollywood", "filmi", "pop"],
  "amit trivedi": ["bollywood", "indie", "alternative"],
  "mohit chauhan": ["bollywood", "indie", "rock"],
  "shafqat amanat ali": ["bollywood", "qawwali", "pop"],
  "sunidhi chauhan": ["bollywood", "filmi", "pop"],
  "alka yagnik": ["bollywood", "filmi"],
  "kavita krishnamurthy": ["bollywood", "filmi"],
  "asha bhosle": ["bollywood", "filmi"],
  "usha uthup": ["bollywood", "jazz", "soul"],
  "kailash kher": ["bollywood", "sufi", "folk"],
  "lucky ali": ["indian pop", "rock"],
  "shaan": ["bollywood", "pop"],
  "k.k.": ["bollywood", "pop"],
  "daler mehndi": ["bhangra", "pop"],
  "gurdas maan": ["punjabi folk", "pop"],
  "jazzy b": ["bhangra", "pop"],
  "sukhbir": ["bhangra", "pop"],
  "malkit singh": ["bhangra", "folk"],
  "ap dhillon": ["punjabi pop", "r&b"],
  "sidhu moosewala": ["punjabi pop", "rap"],
  "shubh": ["punjabi pop", "r&b"],
  "gurnam bhullar": ["punjabi folk", "pop"],
  "jordan sandhu": ["punjabi pop"],
  "mankirt aulakh": ["punjabi pop", "bhangra"],
  "ammy virk": ["punjabi pop", "bollywood"],
  "harrdy sandhu": ["punjabi pop", "bollywood"],
  "diljit dosanjh": ["punjabi pop", "bollywood"],
  "guru randhawa": ["punjabi pop", "bollywood"],
  "tony kakkar": ["bollywood", "pop"],
  "neha kakkar": ["bollywood", "pop"],
  "honey singh": ["bhangra", "hip hop", "bollywood"],
  "yo yo honey singh": ["bhangra", "hip hop", "bollywood"],
  "raftaar": ["hip hop", "rap", "desi hip hop"],
  "nucleya": ["electronic", "bass music", "indian fusion"],
  "ritviz": ["electronic", "indie pop", "indian fusion"],
  "when chai met toast": ["indie pop", "indie folk"],
  "prateek kuhad": ["indie folk", "indie pop"],
  "the local train": ["indie rock", "alternative"],
  "indian ocean": ["indie rock", "fusion", "folk"],
  "parikrama": ["rock"],
  "strings": ["pop rock", "alternative"],
  "vital signs": ["pop rock"],
  "junoon": ["rock", "sufi"],
  "fuzon": ["pop rock", "sufi"],
  "noori": ["rock", "alternative"],
  "call": ["rock", "pop rock"],
  "EP": ["pop rock"],
  "khuda aur mohabbat ost": ["bollywood", "filmi"],

  // --- JAZZ ---
  "miles davis": ["jazz", "modal jazz", "cool jazz"],
  "john coltrane": ["jazz", "modal jazz", "avant-garde jazz"],
  "thelonious monk": ["jazz", "bebop"],
  "charlie parker": ["jazz", "bebop"],
  "dizzy gillespie": ["jazz", "bebop"],
  "duke ellington": ["jazz", "swing"],
  "louis armstrong": ["jazz", "dixieland"],
  "billie holiday": ["jazz", "blues"],
  "ella fitzgerald": ["jazz", "pop"],
  "sarah vaughan": ["jazz", "pop"],
  "nina simone": ["jazz", "soul", "blues"],
  "dave brubeck": ["jazz", "cool jazz"],
  "oscar peterson": ["jazz", "bebop"],
  "bill evans": ["jazz", "modal jazz"],
  "herbie hancock": ["jazz", "jazz fusion", "funk"],
  "chick corea": ["jazz", "jazz fusion"],
  "wayne shorter": ["jazz", "jazz fusion"],
  "pat metheny": ["jazz", "jazz fusion"],
  "john scofield": ["jazz", "jazz fusion"],
  "mike stern": ["jazz", "jazz fusion"],
  "norah jones": ["jazz", "pop", "acoustic pop"],
  "diana krall": ["jazz", "pop"],
  "michael buble": ["jazz", "pop"],
  "harry connick jr.": ["jazz", "pop"],
  "tony bennett": ["jazz", "pop"],
  "frank sinatra": ["jazz", "pop"],
  "dean martin": ["jazz", "pop"],
  "nat king cole": ["jazz", "pop"],
  "bing crosby": ["jazz", "pop"],
  "brad mehldau": ["jazz"],
  "esperanza spalding": ["jazz", "r&b"],
  "kamasi washington": ["jazz"],
  "thundercat": ["jazz", "r&b", "funk"],
  "jose james": ["jazz", "r&b", "soul"],
  "gregory porter": ["jazz", "soul"],
  "lalah hathaway": ["jazz", "r&b", "soul"],
  "kurt elling": ["jazz", "vocal jazz"],
  "cassandra wilson": ["jazz", "blues"],
  "dee dee bridgewater": ["jazz", "soul"],
  "dianne reeves": ["jazz", "soul"],
  "lisa simone": ["jazz", "soul"],
  "cécile mclorin salvant": ["jazz"],
  "somi": ["jazz", "world music", "r&b"],

  // --- COUNTRY ---
  "morgan wallen": ["country"],
  "luke combs": ["country"],
  "kane brown": ["country", "r&b"],
  "chris stapleton": ["country", "blues rock", "soul"],
  "tyler childers": ["country", "folk"],
  "sturgill simpson": ["country", "psychedelic country"],
  "jason isbell": ["country", "folk rock"],
  "zach bryan": ["country", "folk"],
  "hardy": ["country"],
  "cole swindell": ["country"],
  "dierks bentley": ["country"],
  "brad paisley": ["country"],
  "kenny chesney": ["country"],
  "tim mcgraw": ["country"],
  "faith hill": ["country", "pop"],
  "carrie underwood": ["country", "pop"],
  "miranda lambert": ["country"],
  "kacey musgraves": ["country", "indie pop"],
  "maren morris": ["country", "pop"],
  "kelsea ballerini": ["country", "pop"],
  "carly pearce": ["country"],
  "lainey wilson": ["country"],
  "ashley mcbryde": ["country"],
  "little big town": ["country"],
  "lady antebellum": ["country", "pop"],
  "lady a": ["country", "pop"],
  "rascal flatts": ["country"],
  "sugarland": ["country"],
  "zac brown band": ["country", "southern rock"],
  "florida georgia line": ["country", "country pop"],
  "old dominion": ["country"],
  "home free": ["country", "a cappella"],
  "pentatonix": ["pop", "a cappella"],
  "garth brooks": ["country"],
  "george strait": ["country"],
  "alan jackson": ["country"],
  "toby keith": ["country"],
  "kenny rogers": ["country"],
  "dolly parton": ["country", "pop"],
  "loretta lynn": ["country"],
  "patsy cline": ["country"],
  "tammy wynette": ["country"],
  "johnny cash": ["country", "folk", "rock"],
  "willie nelson": ["country", "outlaw country"],
  "waylon jennings": ["country", "outlaw country"],
  "merle haggard": ["country", "outlaw country"],
  "kris kristofferson": ["country", "folk"],
  "emmylou harris": ["country", "folk"],
  "linda ronstadt": ["country", "pop"],
  "crystal gayle": ["country", "pop"],
  "anne murray": ["country", "pop"],
  "reba mcentire": ["country"],
  "barbara mandrell": ["country"],
  "tanya tucker": ["country"],
  "dwight yoakam": ["country"],
  "travis tritt": ["country", "southern rock"],
  "clint black": ["country"],
  "vince gill": ["country"],
  "joe diffie": ["country"],
  "tracy lawrence": ["country"],
  "mark chesnutt": ["country"],
  "alabama": ["country"],
  "oak ridge boys": ["country"],
  "exile": ["country", "soft rock"],
  "restless heart": ["country"],
  "diamond rio": ["country"],
  "lonestar": ["country"],
  "shenandoah": ["country"],
  "sawyer brown": ["country"],
  "boystown gang": ["pop", "disco"],

  // --- CLASSICAL ---
  "yo-yo ma": ["classical", "cello"],
  "itzhak perlman": ["classical", "violin"],
  "lang lang": ["classical", "piano"],
  "yuja wang": ["classical", "piano"],
  "gustavo dudamel": ["classical", "conductor"],
  "anne-sophie mutter": ["classical", "violin"],
  "hilary hahn": ["classical", "violin"],
  "renée fleming": ["classical", "opera"],
  "andrea bocelli": ["classical", "pop", "opera"],
  "placido domingo": ["classical", "opera"],
  "luciano pavarotti": ["classical", "opera"],
  "maria callas": ["classical", "opera"],
  "kathleen battle": ["classical", "opera"],
  "cecilia bartoli": ["classical", "opera"],
  "bryn terfel": ["classical", "opera"],
  "thomas hampson": ["classical", "opera"],

  // --- GOSPEL ---
  "kirk franklin": ["gospel", "r&b", "hip hop"],
  "cece winans": ["gospel", "r&b"],
  "bebe winans": ["gospel", "r&b"],
  "donnie mcclurkin": ["gospel", "r&b"],
  "yolanda adams": ["gospel", "r&b"],
  "tamela mann": ["gospel"],
  "le'andria johnson": ["gospel"],
  "tye tribbett": ["gospel"],
  "israel houghton": ["gospel", "worship"],
  "hillsong united": ["worship", "christian"],
  "hillsong worship": ["worship", "christian"],
  "bethel music": ["worship", "christian"],
  "elevation worship": ["worship", "christian"],
  "chris tomlin": ["worship", "christian"],
  "lauren daigle": ["christian", "pop"],
  "for king & country": ["christian", "pop rock"],
  "crowder": ["christian", "alternative rock"],
  "switchfoot": ["christian", "alternative rock"],
  "newsboys": ["christian", "rock"],
  "skillet": ["christian", "hard rock"],
  "casting crowns": ["christian", "rock"],
  "mercy me": ["christian", "pop"],
  "third day": ["christian", "rock"],
  "audio adrenaline": ["christian", "rock"],

  // --- REGGAE / DANCEHALL ---
  "bob marley": ["reggae"],
  "peter tosh": ["reggae"],
  "bunny wailer": ["reggae"],
  "toots and the maytals": ["reggae", "ska"],
  "jimmy cliff": ["reggae"],
  "burning spear": ["reggae"],
  "steel pulse": ["reggae"],
  "lucky dube": ["reggae"],
  "shaggy": ["reggae", "dancehall", "pop"],
  "sean paul": ["dancehall", "pop"],
  "beenie man": ["dancehall"],
  "bounty killer": ["dancehall"],
  "vybz kartel": ["dancehall"],
  "mavado": ["dancehall"],
  "alkaline": ["dancehall"],
  "popcaan": ["dancehall"],
  "jah cure": ["reggae", "dancehall"],
  "chronixx": ["reggae"],
  "protoje": ["reggae"],
  "kabaka pyramid": ["reggae"],
  "koffee": ["reggae", "dancehall"],
  "buju banton": ["reggae", "dancehall"],
  "sizzla": ["reggae", "dancehall"],
  "capleton": ["reggae", "dancehall"],
  "damian marley": ["reggae", "hip hop"],
  "stephen marley": ["reggae"],
  "ziggy marley": ["reggae"],
  "lauryn hill": ["reggae", "r&b", "hip hop"],
  "wyclef jean": ["reggae", "hip hop", "pop"],
  "pras": ["hip hop", "reggae"],

  // --- AFROBEATS / AFROPOP ---
  "burna boy": ["afrobeats", "afropop", "dancehall"],
  "wizkid": ["afrobeats", "afropop"],
  "davido": ["afrobeats", "afropop"],
  "rema": ["afrobeats", "afropop"],
  "tems": ["afrobeats", "r&b"],
  "ayra starr": ["afrobeats", "r&b"],
  "asake": ["afrobeats", "fuji"],
  "fireboy dml": ["afrobeats", "r&b"],
  "omah lay": ["afrobeats", "r&b"],
  "ckay": ["afrobeats", "r&b"],
  "joeboy": ["afrobeats", "r&b"],
  "kizz daniel": ["afrobeats", "afropop"],
  "patoranking": ["afrobeats", "dancehall"],
  "tiwa savage": ["afrobeats", "r&b"],
  "yemi alade": ["afrobeats", "afropop"],
  "mr eazi": ["afrobeats", "afropop"],
  "oxlade": ["afrobeats", "r&b"],
  "150 racks": ["afrobeats"],
  "mavin records": ["afrobeats"],
  "p-square": ["afrobeats", "afropop"],
  "2baba": ["afrobeats", "afropop"],
  "fela kuti": ["afrobeats", "funk", "jazz"],
  "king sunny ade": ["juju", "afrobeats"],
  "angelique kidjo": ["afropop", "world music"],
  "youssou n'dour": ["world music", "mbalax"],
  "baaba maal": ["world music", "afropop"],
  "salif keita": ["world music", "afropop"],
  "ali farka toure": ["world music", "blues"],
  "toumani diabate": ["world music"],
  "oumou sangare": ["world music"],
  "rokia traore": ["world music"],
  "fatoumata diawara": ["world music", "afropop"],
  "amadou & mariam": ["world music", "afropop"],
  "tinariwen": ["world music", "desert blues"],
  "bombino": ["world music", "desert blues"],
  "master kg": ["afropop", "amapiano"],
  "dj maphorisa": ["amapiano", "afrobeats"],
  "kabza de small": ["amapiano"],
  "sun-el musician": ["amapiano", "afrobeats"],
  "focalistic": ["amapiano", "hip hop"],
  "nasty c": ["hip hop", "rap", "afropop"],
  "sjava": ["afropop"],
  "ladysmith black mambazo": ["world music", "isicathamiya"],
  "miriam makeba": ["world music", "afropop"],
  "hugh masekela": ["jazz", "world music", "afropop"],
}