import { PROTOCOL } from '../../data'

export function SplitViz() {
  return (
    <div className="teach-card">
      <h3 className="teach-card__title">One camera held out</h3>
      <div className="split-row">
        <div className="split-col">
          <p className="meta split-col__head">Pretrain and probe labels</p>
          <div className="split-chips">
            {PROTOCOL.trainSites.map((id) => (
              <span key={id} className="chip chip--train">
                camera {id}
              </span>
            ))}
          </div>
        </div>
        <div className="split-arrow" aria-hidden="true">
          →
        </div>
        <div className="split-col">
          <p className="meta split-col__head">Score the probe here</p>
          <div className="split-chips">
            <span className="chip chip--held">camera {PROTOCOL.testSite}</span>
          </div>
        </div>
      </div>
      <p className="meta" style={{ margin: '0.75rem 0 0', textTransform: 'none', letterSpacing: 0 }}>
        Camera {PROTOCOL.testSite} never appears in the SSL pool or in the probe’s labeled rows. Same-site
        accuracy is the debug column. The number I report is the hold-out.
      </p>
    </div>
  )
}
