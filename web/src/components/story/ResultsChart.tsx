import { METRICS } from '../../data'

const W = 420
const H = 240
const PAD = { l: 44, r: 16, t: 16, b: 48 }

type Row = { key: string; label: string; value: number; color: string }

export function ResultsChart() {
  const rows: Row[] = [
    { key: 'held', label: 'Held-out site', value: METRICS.successPct, color: 'var(--chart-probe)' },
    { key: 'same', label: 'Same-site', value: METRICS.sameSitePct, color: 'var(--chart-same)' },
    { key: 'rand', label: 'Random encoder', value: METRICS.randomEncoderPct, color: 'var(--chart-random)' },
    { key: 'chance', label: 'Chance', value: METRICS.chancePct, color: 'var(--chart-chance)' },
  ]
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b
  const barW = plotW / (rows.length * 1.6)
  const x = (i: number) => PAD.l + (i + 0.5) * (plotW / rows.length) - barW / 2
  const y = (v: number) => PAD.t + plotH - (v / 100) * plotH
  const floorY = y(85)

  return (
    <div className="chart-wrap">
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Held-out site probe ${METRICS.successPct} percent versus same-site ${METRICS.sameSitePct.toFixed(1)} percent, random encoder ${METRICS.randomEncoderPct} percent, and chance ${METRICS.chancePct.toFixed(1)} percent.`}
      >
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={floorY}
          y2={floorY}
          stroke="var(--bad)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text x={W - PAD.r} y={floorY - 6} textAnchor="end" fontSize="10" fill="var(--bad)" fontFamily="var(--font-mono)">
          floor 85
        </text>
        {rows.map((r, i) => (
          <g key={r.key}>
            <rect
              className="bar-grow"
              x={x(i)}
              y={y(r.value)}
              width={barW}
              height={Math.max(plotH - (y(r.value) - PAD.t), 0)}
              fill={r.color}
              rx="2"
            />
            <text
              x={x(i) + barW / 2}
              y={y(r.value) - 6}
              textAnchor="middle"
              fontSize="11"
              fill="var(--fg-hi)"
              fontFamily="var(--font-mono)"
            >
              {r.value.toFixed(r.value % 1 ? 1 : 0)}
            </text>
            <text
              x={x(i) + barW / 2}
              y={H - 14}
              textAnchor="middle"
              fontSize="10"
              fill="var(--chart-label)"
              fontFamily="var(--font-mono)"
            >
              {r.label}
            </text>
          </g>
        ))}
      </svg>
      <ul className="legend">
        <li>
          <span className="swatch" style={{ background: 'var(--chart-probe)', borderColor: 'var(--chart-probe)' }} />
          held-out (headline)
        </li>
        <li>
          <span className="swatch" style={{ background: 'var(--chart-same)', borderColor: 'var(--chart-same)' }} />
          same-site (debug)
        </li>
      </ul>
    </div>
  )
}
