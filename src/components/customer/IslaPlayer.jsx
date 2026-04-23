// ================================================================
// IslaPlayer.jsx — Customer-facing ambient music player
// Reads music_source + music_playlist from Supabase app_settings
// Minimal UI — a small bar at the bottom, above the tab bar
// Auto-starts muted, unmutes on first user interaction
// ================================================================
import { useState, useEffect, useRef } from 'react'

const IBIZA_RADIO_URL = 'https://streaming.ibizaglobalradio.com/ibizagr.mp3'

const C = {
  bg:     'rgba(10,25,35,0.96)',
  border: 'rgba(255,255,255,0.1)',
  accent: '#C4683A',
  muted:  'rgba(255,255,255,0.45)',
  green:  '#7EE8A2',
}
const F = { sans:'DM Sans,sans-serif' }

export default function IslaPlayer() {
  const audioRef            = useRef(null)
  const [settings, setSettings]   = useState(null)       // null = loading
  const [playing, setPlaying]     = useState(false)
  const [muted, setMuted]         = useState(true)        // start muted for autoplay
  const [volume, setVolume]       = useState(0.4)
  const [trackIdx, setTrackIdx]   = useState(0)
  const [showBar, setShowBar]     = useState(false)
  const [minimised, setMinimised] = useState(false)
  const [currentTitle, setCurrentTitle] = useState('')

  // Load settings from Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase
          .from('app_settings')
          .select('key,value')
          .in('key', ['music_source','music_playlist','music_player_enabled','music_volume'])

        if (!data?.length) return

        const map = {}
        data.forEach(({ key, value }) => { map[key] = value })

        // If player disabled, don't show at all
        if (map.music_player_enabled === 'false') return

        let playlist = []
        try { playlist = JSON.parse(map.music_playlist || '[]') } catch {}

        const vol = parseInt(map.music_volume || '40') / 100
        setVolume(vol)
        setSettings({
          source:   map.music_source || 'radio',
          playlist,
          volume:   vol,
        })
        setShowBar(true)
      } catch {
        // Supabase not set up yet — don't show player
      }
    }
    load()
  }, [])

  // Wire audio when settings load
  useEffect(() => {
    if (!settings || !audioRef.current) return
    const audio = audioRef.current

    audio.volume = muted ? 0 : volume
    audio.loop   = settings.source === 'playlist' && settings.playlist.length === 1

    const src = getSource()
    if (audio.src !== src) {
      audio.src = src
      audio.load()
    }
    setCurrentTitle(getCurrentTitle())
  }, [settings, trackIdx])

  const getSource = () => {
    if (!settings) return ''
    if (settings.source === 'radio') return IBIZA_RADIO_URL
    const track = settings.playlist[trackIdx]
    return track?.url || ''
  }

  const getCurrentTitle = () => {
    if (!settings) return ''
    if (settings.source === 'radio') return 'Ibiza Global Radio 📻'
    const track = settings.playlist[trackIdx]
    return track ? track.title + (track.artist ? ' — ' + track.artist : '') : ''
  }

  const play = async () => {
    if (!audioRef.current) return
    try {
      audioRef.current.volume = volume
      setMuted(false)
      await audioRef.current.play()
      setPlaying(true)
    } catch {}
  }

  const pause = () => {
    audioRef.current?.pause()
    setPlaying(false)
  }

  const togglePlay = () => playing ? pause() : play()

  const toggleMute = () => {
    if (!audioRef.current) return
    if (muted) {
      audioRef.current.volume = volume
      setMuted(false)
      if (!playing) play()
    } else {
      audioRef.current.volume = 0
      setMuted(true)
    }
  }

  const nextTrack = () => {
    if (!settings?.playlist?.length) return
    const next = (trackIdx + 1) % settings.playlist.length
    setTrackIdx(next)
    setTimeout(() => audioRef.current?.play().catch(()=>{}), 100)
  }

  const prevTrack = () => {
    if (!settings?.playlist?.length) return
    const prev = (trackIdx - 1 + settings.playlist.length) % settings.playlist.length
    setTrackIdx(prev)
    setTimeout(() => audioRef.current?.play().catch(()=>{}), 100)
  }

  const handleEnded = () => {
    if (settings?.source === 'playlist' && settings.playlist.length > 1) {
      nextTrack()
    }
  }

  if (!showBar || !settings) return null

  const isPlaylist = settings.source === 'playlist'
  const hasPlaylist = isPlaylist && settings.playlist.length > 0

  // Minimised state — just a small floating button
  if (minimised) return (
    <>
      <audio ref={audioRef} onEnded={handleEnded} preload="none" />
      <button onClick={() => setMinimised(false)}
        style={{ position:'fixed', bottom:80, right:14, zIndex:200, width:40, height:40, borderRadius:'50%', background:'rgba(10,25,35,0.95)', border:'0.5px solid rgba(255,255,255,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.5)', backdropFilter:'blur(12px)' }}>
        <span style={{ fontSize:18 }}>🎵</span>
        {playing && (
          <div style={{ position:'absolute', top:0, right:0, width:10, height:10, borderRadius:'50%', background:C.green, border:'2px solid #0A1923', animation:'playerPulse 1.5s ease-in-out infinite' }}/>
        )}
      </button>
    </>
  )

  return (
    <>
      <audio ref={audioRef} onEnded={handleEnded} preload="none" />

      {/* Player bar — sits just above tab bar (bottom: 68px) */}
      <div style={{
        position: 'fixed', bottom: 68, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto',
        background: C.bg,
        borderTop: '0.5px solid ' + C.border,
        backdropFilter: 'blur(20px)',
        zIndex: 100,
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Source icon */}
        <div style={{ fontSize:18, flexShrink:0 }}>
          {isPlaylist ? '🎧' : '📻'}
        </div>

        {/* Track info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:F.sans }}>
            {currentTitle || (isPlaylist ? 'Isla Playlist' : 'Ibiza Global Radio')}
          </div>
          <div style={{ fontSize:10, color:C.muted, fontFamily:F.sans, display:'flex', alignItems:'center', gap:5 }}>
            {playing && !muted ? (
              <>
                <span style={{ display:'flex', gap:2, alignItems:'flex-end', height:10 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ width:2, background:C.green, borderRadius:1, animationName:['barBounce1','barBounce2','barBounce3'][i-1], animationDuration:'0.8s', animationTimingFunction:'ease-in-out', animationIterationCount:'infinite', animationDelay:i*0.15+'s' }}/>
                  ))}
                </span>
                Playing
              </>
            ) : muted ? 'Muted' : 'Paused'}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          {/* Prev — playlist only */}
          {hasPlaylist && settings.playlist.length > 1 && (
            <button onClick={prevTrack}
              style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.07)', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ⏮
            </button>
          )}

          {/* Play/pause */}
          <button onClick={togglePlay}
            style={{ width:34, height:34, borderRadius:'50%', background:playing?'rgba(196,104,58,0.3)':C.accent, border:'none', color:'white', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}>
            {playing ? '⏸' : '▶'}
          </button>

          {/* Next — playlist only */}
          {hasPlaylist && settings.playlist.length > 1 && (
            <button onClick={nextTrack}
              style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.07)', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ⏭
            </button>
          )}

          {/* Mute toggle */}
          <button onClick={toggleMute}
            style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.07)', border:'none', color:muted?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {muted ? '🔇' : '🔊'}
          </button>

          {/* Minimise */}
          <button onClick={() => setMinimised(true)}
            style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.07)', border:'none', color:C.muted, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>
      </div>

      <style>{`
        @keyframes playerPulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes barBounce1{0%,100%{height:3px}50%{height:8px}}
        @keyframes barBounce2{0%,100%{height:6px}50%{height:3px}}
        @keyframes barBounce3{0%,100%{height:4px}50%{height:9px}}
      `}</style>
    </>
  )
}
