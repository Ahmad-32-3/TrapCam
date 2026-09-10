import { PIPELINE } from '../../data'

const W = 460
const BOX_W = 76
const BOX_H = 52
const GAP = 12

export function ArchChart() {
  const col = (i: number) => 10 + i * (BOX_W + GAP)

  return (
    <div className="teach-card">
      <h3 className="teach-card__title">Encoder, freeze, linear probe</h3>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} 110`}
        role="img"
        aria-labelledby="arch-title arch-desc"
      >
        <title id="arch-title">Self-supervised encoder, then a frozen linear probe</title>
        <desc id="arch-desc">
          Unlabeled train-site frames go into a rotation-pretext encoder. Weights freeze. A linear
          probe trains on train-site labels and is scored on a held-out camera.
        </desc>
        {PIPELINE.map((p, i) => {
          const x = col(i)
          const freeze = p.id === 'freeze'
          const test = p.id === 'test'
          const stroke = test ? 'var(--amber)' : freeze ? 'var(--fg-low)' : 'var(--good)'
          const wash = test
            ? 'color-mix(in srgb, var(--amber) 14%, var(--bg-raised))'
            : freeze
              ? 'var(--bg-sunk)'
              : 'color-mix(in srgb, var(--good) 12%, var(--bg-raised))'
          return (
            <g key={p.id} className="path-node" style={{ animationDelay: `${0.12 + i * 0.18}s` }}>
              {i > 0 ? (
                <line
                  x1={col(i - 1) + BOX_W}
                  y1={28 + BOX_H / 2}
                  x2={x}
                  y2={28 + BOX_H / 2}
                  stroke="var(--line-strong)"
                  strokeWidth="1.4"
                />
              ) : null}
              <rect x={x} y={28} width={BOX_W} height={BOX_H} rx="3" fill={wash} stroke={stroke} strokeWidth="1.4" />
              <text x={x + BOX_W / 2} y={48} textAnchor="middle" fill="var(--fg-hi)" fontSize="9.5" fontWeight="600">
                {p.label}
              </text>
              <text
                x={x + BOX_W / 2}
                y={64}
                textAnchor="middle"
                fill="var(--fg-low)"
                fontSize="8"
                fontFamily="var(--font-mono)"
              >
                {p.sub}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="meta" style={{ margin: '0.5rem 0 0', textTransform: 'none', letterSpacing: 0 }}>
        Labels enter only at the probe, and only from train cameras. Camera Q is the test.
      </p>
    </div>
  )
}
