// ================================================================
// MusicManager.jsx — Ops Dashboard music control
// Set music source: Ibiza Global Radio OR custom playlist
// Manage playlist tracks — add, reorder, remove
// Settings saved to Supabase app_settings table
// ================================================================
import { useState, useEffect } from 'react'

const C = {
  bg:      '#0D1117',
  surface: 'rgba(255,255,255,0.05)',
  border:  'rgba(255,255,255,0.1)',
  accent:  '#C4683A',
  green:   '#4CAF7D',
  gold:    '#C8A84B',
  muted:   'rgba(255,255,255,0.45)',
  radio:   'rgba(255,140,0,0.15)',
  radioBorder: 'rgba(255,140,0,0.4)',
}
const F = { serif:'DM Serif Display,serif', sans:'DM Sans,sans-serif' }

const IBIZA_RADIO_URL  = 'https://streaming.ibizaglobalradio.com/ibizagr.mp3'
const IBIZA_RADIO_WEB  = 'https://ibizaglobalradio.com'

const DEFAULT_PLAYLIST = [
  { id:'1', title:'Café del Mar (Classic Mix)', artist:'Various Artists', url:'', duration:'7:24' },
  { id:'2', title:'Ibiza Sunset Vol.3', artist:'DJ Pippi', url:'', duration:'6:11' },
  { id:'3', title:'Balearic Beats', artist:'Jose Padilla', url:'', duration:'8:02' },
]

export default function MusicManager() {
  const [source, setSource]       = useState('radio')  // 'radio' | 'playlist'
  const [playlist, setPlaylist]   = useState(DEFAULT_PLAYLIST)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [newTitle, setNewTitle]   = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [newUrl, setNewUrl]       = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const [dragging, setDragging]   = useState(null)
  const [playerEnabled, setPlayerEnabled] = useState(true)
  const [volume, setVolume]       = useState(40)

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data } = await supabase
        .from('app_settings')
        .select('key,value')
        .in('key', ['music_source','music_playlist','music_player_enabled','music_volume'])
      if (data?.length) {
        data.forEach(({ key, value }) => {
          if (key === 'music_source')          setSource(value)
          if (key === 'music_player_enabled')  setPlayerEnabled(value === 'true')
          if (key === 'music_volume')          setVolume(parseInt(value) || 40)
          if (key === 'music_playlist') {
            try { setPlaylist(JSON.parse(value)) } catch {}
          }
        })
      }
    } catch {}
    setLoading(false)
  }

  const save = async (key, value) => {
    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      await supabase.from('app_settings').upsert(
        { key, value: typeof value === 'object' ? JSON.stringify(value) : String(value), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    } catch { alert('Failed to save — check Supabase connection') }
    setSaving(false)
  }

  const setSourceAndSave = (s) => {
    setSource(s)
    save('music_source', s)
  }

  const togglePlayer = () => {
    const next = !playerEnabled
    setPlayerEnabled(next)
    save('music_player_enabled', next)
  }

  const saveVolume = (v) => {
    setVolume(v)
    save('music_volume', v)
  }

  const addTrack = () => {
    if (!newTitle.trim() || !newUrl.trim()) return
    const track = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      artist: newArtist.trim() || 'Unknown',
      url: newUrl.trim(),
      duration: '',
    }
    const next = [...playlist, track]
    setPlaylist(next)
    save('music_playlist', next)
    setNewTitle(''); setNewArtist(''); setNewUrl(''); setShowAdd(false)
  }

  const removeTrack = (id) => {
    const next = playlist.filter(t => t.id !== id)
    setPlaylist(next)
    save('music_playlist', next)
  }

  const moveTrack = (id, dir) => {
    const idx = playlist.findIndex(t => t.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === playlist.length - 1) return
    const next = [...playlist]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setPlaylist(next)
    save('music_playlist', next)
  }

  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:C.muted, fontFamily:F.sans }}>
      Loading music settings...
    </div>
  )

  return (
    <div style={{ padding:24, maxWidth:720, margin:'0 auto', fontFamily:F.sans }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:F.serif, fontSize:26, color:'white', marginBottom:4 }}>
          🎵 App Music
        </div>
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
          Choose what plays in the background for customers using the Isla Drop app.
          Changes go live within a few seconds.
        </div>
      </div>

      {/* Master toggle */}
      <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color:'white', marginBottom:2 }}>Music player</div>
          <div style={{ fontSize:12, color:C.muted }}>
            {playerEnabled ? 'On — music plays for customers' : 'Off — no music plays'}
          </div>
        </div>
        <button onClick={togglePlayer}
          style={{ width:52, height:28, borderRadius:14, background:playerEnabled?C.green:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'white', position:'absolute', top:3, left:playerEnabled?26:3, transition:'left 0.2s' }}/>
        </button>
      </div>

      {playerEnabled && <>

        {/* Volume */}
        <div style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:14, padding:'16px 20px', marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'white', marginBottom:12 }}>
            Default volume — {volume}%
          </div>
          <input type="range" min="0" max="100" value={volume}
            onChange={e => setVolume(parseInt(e.target.value))}
            onMouseUp={e => saveVolume(parseInt(e.target.value))}
            onTouchEnd={e => saveVolume(parseInt(e.target.value))}
            style={{ width:'100%', accentColor:C.accent, cursor:'pointer' }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted, marginTop:4 }}>
            <span>🔇 Silent</span><span>🔊 Full</span>
          </div>
        </div>

        {/* Source selection */}
        <div style={{ fontSize:13, color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>
          Music source
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>

          {/* Ibiza Global Radio */}
          <button onClick={() => setSourceAndSave('radio')}
            style={{ padding:20, background:source==='radio'?C.radio:C.surface, border:'1.5px solid '+(source==='radio'?C.radioBorder:C.border), borderRadius:16, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📻</div>
            <div style={{ fontSize:15, fontWeight:700, color:'white', marginBottom:4 }}>
              Ibiza Global Radio
            </div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.5, marginBottom:10 }}>
              Live stream from Ibiza's premier radio station. Real Ibiza energy, 24/7.
            </div>
            {source === 'radio' && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,140,0,0.2)', border:'0.5px solid rgba(255,140,0,0.5)', borderRadius:20, padding:'3px 10px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#FF8C00', animation:'musicPulse 1.5s ease-in-out infinite' }}/>
                <span style={{ fontSize:11, color:'#FFA040', fontWeight:600 }}>LIVE</span>
              </div>
            )}
          </button>

          {/* Custom Playlist */}
          <button onClick={() => setSourceAndSave('playlist')}
            style={{ padding:20, background:source==='playlist'?'rgba(196,104,58,0.15)':C.surface, border:'1.5px solid '+(source==='playlist'?'rgba(196,104,58,0.5)':C.border), borderRadius:16, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🎧</div>
            <div style={{ fontSize:15, fontWeight:700, color:'white', marginBottom:4 }}>
              Isla Playlist
            </div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.5, marginBottom:10 }}>
              Your curated tracks. Add direct audio URLs or SoundCloud/Mixcloud links.
            </div>
            {source === 'playlist' && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(196,104,58,0.2)', border:'0.5px solid rgba(196,104,58,0.4)', borderRadius:20, padding:'3px 10px' }}>
                <span style={{ fontSize:11, color:'#E8A070', fontWeight:600 }}>▶ PLAYING</span>
              </div>
            )}
          </button>
        </div>

        {/* Radio info */}
        {source === 'radio' && (
          <div style={{ background:'rgba(255,140,0,0.08)', border:'0.5px solid rgba(255,140,0,0.25)', borderRadius:14, padding:'16px 20px', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <span style={{ fontSize:28 }}>📻</span>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:'white' }}>Ibiza Global Radio</div>
                <div style={{ fontSize:12, color:'rgba(255,140,0,0.8)' }}>ibizaglobalradio.com · Live 24/7</div>
              </div>
              <a href={IBIZA_RADIO_WEB} target="_blank" rel="noopener noreferrer"
                style={{ marginLeft:'auto', padding:'7px 14px', background:'rgba(255,140,0,0.2)', border:'0.5px solid rgba(255,140,0,0.4)', borderRadius:20, color:'#FFA040', fontSize:12, fontWeight:600, textDecoration:'none' }}>
                Visit →
              </a>
            </div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
              Streams the live Ibiza Global Radio broadcast directly into the customer app.
              The station plays house, Balearic and electronic music 24 hours a day from Ibiza.
              No additional setup needed — just select this option and it goes live.
            </div>
          </div>
        )}

        {/* Playlist manager */}
        {source === 'playlist' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'white' }}>
                Playlist · {playlist.length} track{playlist.length !== 1 ? 's' : ''}
              </div>
              <button onClick={() => setShowAdd(p => !p)}
                style={{ padding:'7px 16px', background:C.accent, border:'none', borderRadius:20, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                + Add track
              </button>
            </div>

            {/* Add track form */}
            {showAdd && (
              <div style={{ background:'rgba(196,104,58,0.08)', border:'0.5px solid rgba(196,104,58,0.3)', borderRadius:14, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'white', marginBottom:12 }}>New track</div>
                <input value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                  placeholder="Track title *"
                  style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:9, color:'white', fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:8 }}
                />
                <input value={newArtist} onChange={e=>setNewArtist(e.target.value)}
                  placeholder="Artist / DJ name"
                  style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:9, color:'white', fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:8 }}
                />
                <input value={newUrl} onChange={e=>setNewUrl(e.target.value)}
                  placeholder="Audio URL — direct .mp3 link or stream URL *"
                  style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:9, color:'white', fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:4 }}
                />
                <div style={{ fontSize:11, color:C.muted, marginBottom:12 }}>
                  Tip: Use a direct .mp3 URL, or a SoundCloud/Mixcloud stream URL. Tracks must be publicly accessible.
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={addTrack}
                    disabled={!newTitle.trim() || !newUrl.trim()}
                    style={{ flex:1, padding:'10px', background:(!newTitle.trim()||!newUrl.trim())?'rgba(196,104,58,0.3)':C.accent, border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:(!newTitle.trim()||!newUrl.trim())?'default':'pointer' }}>
                    Add to playlist
                  </button>
                  <button onClick={()=>setShowAdd(false)}
                    style={{ padding:'10px 16px', background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Track list */}
            {playlist.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 0', color:C.muted, fontSize:14 }}>
                No tracks yet — add your first track above
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {playlist.map((track, idx) => (
                <div key={track.id}
                  style={{ background:C.surface, border:'0.5px solid '+C.border, borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                  {/* Order number */}
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:C.muted, flexShrink:0 }}>
                    {idx + 1}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                      {track.artist}{track.duration ? ' · '+track.duration : ''}
                    </div>
                    {track.url && (
                      <div style={{ fontSize:10, color:'rgba(126,232,162,0.6)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {track.url.slice(0,50)}{track.url.length>50?'...':''}
                      </div>
                    )}
                  </div>
                  {/* Controls */}
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button onClick={() => moveTrack(track.id, 'up')} disabled={idx===0}
                      title="Move up"
                      style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', color:idx===0?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.6)', cursor:idx===0?'default':'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      ↑
                    </button>
                    <button onClick={() => moveTrack(track.id, 'down')} disabled={idx===playlist.length-1}
                      title="Move down"
                      style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,0.07)', border:'0.5px solid rgba(255,255,255,0.12)', color:idx===playlist.length-1?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.6)', cursor:idx===playlist.length-1?'default':'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      ↓
                    </button>
                    <button onClick={() => removeTrack(track.id)}
                      title="Remove"
                      style={{ width:28, height:28, borderRadius:7, background:'rgba(200,50,50,0.12)', border:'0.5px solid rgba(200,50,50,0.3)', color:'rgba(220,80,80,0.8)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </>}

      {saving && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'rgba(13,53,69,0.95)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 16px', fontSize:12, color:C.muted }}>
          Saving...
        </div>
      )}

      <style>{`@keyframes musicPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}`}</style>
    </div>
  )
}
