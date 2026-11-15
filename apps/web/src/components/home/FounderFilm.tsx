import { useEffect, useRef, useState } from "react"
import { Pause, Play, Volume2, VolumeX } from "lucide-react"

const FILM_URL = "/media/founder"
/** Studio passage. The original file stays intact. Clip: 1:30 → 2:59. */
const START_SECONDS = 90
const END_SECONDS = 179

type FounderFilmProps = {
  title: string
  line: string
  playLabel: string
  pauseLabel: string
  errorLabel: string
  soundOn: string
  soundOff: string
  watchLabel: string
}

export function FounderFilm({
  title,
  line,
  playLabel,
  pauseLabel,
  errorLabel,
  soundOn,
  soundOff,
  watchLabel,
}: FounderFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const primed = useRef(false)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    primed.current = false

    const prime = () => {
      if (primed.current || cancelled) return
      primed.current = true
      video.muted = true
      if (reduce) {
        video.pause()
        setPaused(true)
        return
      }
      void video.play().catch(() => setPaused(true))
    }

    const onReady = () => {
      if (cancelled) return
      if (reduce) video.pause()
      if (video.currentTime < START_SECONDS - 0.2 || video.currentTime >= END_SECONDS) {
        video.currentTime = START_SECONDS
      } else {
        prime()
      }
    }

    const onSeeked = () => {
      if (!primed.current) prime()
    }

    const onTime = () => {
      if (video.currentTime >= END_SECONDS) video.currentTime = START_SECONDS
    }

    const onPlay = () => {
      if (reduce && !primed.current) {
        video.pause()
        return
      }
      setPaused(false)
    }

    video.addEventListener("loadedmetadata", onReady)
    video.addEventListener("seeked", onSeeked)
    video.addEventListener("timeupdate", onTime)
    video.addEventListener("play", onPlay)
    video.src = FILM_URL

    return () => {
      cancelled = true
      video.removeEventListener("loadedmetadata", onReady)
      video.removeEventListener("seeked", onSeeked)
      video.removeEventListener("timeupdate", onTime)
      video.removeEventListener("play", onPlay)
      video.pause()
      video.removeAttribute("src")
      video.load()
    }
  }, [])

  function playMuted() {
    const video = videoRef.current
    if (!video) return
    setFailed(false)
    video.muted = true
    setMuted(true)
    if (video.currentTime < START_SECONDS || video.currentTime >= END_SECONDS) {
      video.currentTime = START_SECONDS
    }
    void video.play().catch(() => setFailed(true))
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) playMuted()
    else video.pause()
  }

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return (
    <figure className="yamoo-film w-full">
      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 p-2 lg:grid-cols-1 lg:gap-0 lg:p-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[0.9rem] bg-night lg:aspect-[16/10] lg:rounded-none">
          <video
            ref={videoRef}
            className="h-full w-full object-contain object-center scale-[1.25] transition-transform duration-300"
            autoPlay
            muted
            playsInline
            preload="metadata"
            aria-label={title}
            onPause={() => setPaused(true)}
            onError={() => setFailed(true)}
            onClick={togglePlay}
          />
          {paused ? (
            <button
              type="button"
              onClick={playMuted}
              className="absolute top-1/2 left-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory/95 text-night shadow-[0_8px_22px_rgb(0_0_0/0.35)] transition duration-200 hover:bg-ivory"
              aria-label={playLabel}
            >
              <Play aria-hidden="true" className="ml-0.5 h-6 w-6 fill-current" />
            </button>
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-[#000b18]/95 to-transparent px-3.5 pt-10 pb-3 lg:block">
            <div className="flex items-end justify-between gap-3">
              <figcaption className="text-[0.72rem] tracking-wide text-ivory">{line}</figcaption>
              <span className="shrink-0 text-[0.65rem] tabular-nums text-ivory/75">1:29</span>
            </div>
          </div>
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {paused ? null : (
              <button
                type="button"
                onClick={togglePlay}
                className="hidden h-8 w-8 place-items-center rounded-full bg-night/70 text-ivory transition duration-200 hover:text-gold lg:grid"
                aria-label={pauseLabel}
              >
                <Pause aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleSound}
              className="grid h-8 w-8 place-items-center rounded-full bg-gold text-night transition duration-200 hover:bg-gold-hover"
              aria-pressed={!muted}
              aria-label={muted ? soundOn : soundOff}
            >
              {muted ? <VolumeX aria-hidden="true" className="h-3.5 w-3.5" /> : <Volume2 aria-hidden="true" className="h-3.5 w-3.5" />}
            </button>
          </div>
          {failed ? <p className="absolute inset-x-2 bottom-10 text-center text-xs text-ivory">{errorLabel}</p> : null}
        </div>
        <div className="min-w-0 lg:hidden">
          <p className="font-display text-base leading-tight text-ivory">{watchLabel}</p>
          <p className="mt-1 text-xs text-muted">{title}</p>
          <button type="button" onClick={togglePlay} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
            {paused ? playLabel : pauseLabel}
          </button>
        </div>
      </div>
    </figure>
  )
}
