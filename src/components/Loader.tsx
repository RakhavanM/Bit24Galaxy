export function Loader({ progress }: { progress: number }) {
  return (
    <div className="loader-screen" aria-live="polite">
      <div className="loader-mark"><span>BIT24</span><i>GALAXY</i></div>
      <div className="loader-line"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
      <div className="loader-meta"><span>INITIALIZING ASSET ATLAS</span><b>{Math.round(progress)}%</b></div>
    </div>
  )
}

