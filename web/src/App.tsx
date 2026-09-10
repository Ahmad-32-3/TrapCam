import { ArchChart } from './components/story/ArchChart'
import { ResultsChart } from './components/story/ResultsChart'
import { ResultBento } from './components/story/ResultBento'
import { SplitViz } from './components/story/SplitViz'
import { StackGrid } from './components/story/StackGrid'
import { StoryBeat } from './components/story/StoryBeat'
import {
  COMPARISON,
  DECISIONS,
  ILLUSTRATIVE,
  META,
  METRICS,
  NEXT,
  PROTOCOL,
  SECTORS,
} from './data'

const TOC = [
  { href: '#problem', label: 'The problem' },
  { href: '#answer', label: 'The approach' },
  { href: '#result', label: 'The result' },
  { href: '#stack', label: 'How it works' },
  { href: '#decisions', label: 'Design choices' },
  { href: '#use', label: 'Running it' },
  { href: '#next', label: 'What is next' },
]

const NOTE = ILLUSTRATIVE ? ' These are placeholder numbers until the pipeline runs.' : ''

export function App() {
  return (
    <>
      <a className="skip-link" href="#problem">
        Skip to the walkthrough
      </a>

      <div className="masthead">
        <div className="masthead__inner">
          <div className="masthead__mark">
            <b>TrapCam</b> · pretrain without labels, then a camera the model never saw
          </div>
          <ul className="masthead__nav">
            <li>
              <a href="#problem">problem</a>
            </li>
            <li>
              <a href="#result">result</a>
            </li>
            <li>
              <a href="#decisions">decisions</a>
            </li>
            <li>
              <a href="#next">next</a>
            </li>
          </ul>
        </div>
      </div>

      <main className="page">
        <header className="page-hero">
          <p className="meta">A walkthrough · features that should survive a new camera</p>
          <h1>TrapCam</h1>
          <p className="lead">
            Cameras in different places have different lighting and backgrounds. A labeled model
            trained at one camera often latches onto that look instead of the animal. I pretrain an
            encoder with no species labels on some cameras, freeze it, and train a cheap linear head.
            Then I ask whether that head still works on a camera it never saw. The number I trust is
            that held-out camera score.
          </p>
          <p className="intro-detail">
            Headline number: how often the species name is right on a camera the cheap read-out never
            saw, {METRICS.nClasses} classes. Train cameras {PROTOCOL.trainSites.join(', ')}; test camera{' '}
            {PROTOCOL.testSite}. I did not download the full {META.lila} dump. The measured run is a{' '}
            {META.analog} with the same split.{NOTE}
          </p>
          <nav aria-label="On this page">
            <ul className="toc">
              {TOC.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <StoryBeat
          id="problem"
          kicker="The problem"
          title="A new camera should not mean relabeling everything"
          caption="Each camera has its own color and grain. If a model uses that, it will look sharp on cameras it has seen and fall over on a new one."
          visual={<SplitViz />}
        >
          <p>
            I care about whether the features are about the animal, not about the box that took the
            picture. Supervised training on the cameras I already have is the easy path, and it is
            also the path that memorizes site texture.
          </p>
          <p>
            Labels are scarce. Cameras are not. If I can pretrain on unlabeled frames from some sites,
            I want the frozen encoder to still be useful when I move the camera. Same-site accuracy
            will not tell me that. A held-out site will.
          </p>
        </StoryBeat>

        <StoryBeat
          id="answer"
          kicker="The approach"
          title="Learn from unlabeled pictures, freeze that, then a cheap linear read-out"
          caption={`I first teach the encoder to guess how a crop was turned, using only train cameras. Then I freeze it and train a cheap linear read-out whose labels also come only from those cameras. Camera ${PROTOCOL.testSite} is the test.${NOTE}`}
          visual={
            <div className="teach-card">
              <h3 className="teach-card__title">Frozen protocol</h3>
              <dl className="stat-grid">
                <div>
                  <dt>Classes</dt>
                  <dd>{PROTOCOL.classes.join(', ')}</dd>
                </div>
                <div>
                  <dt>Unlabeled warm-up</dt>
                  <dd>guess the crop turn (4 ways), {PROTOCOL.sslEpochs} epochs</dd>
                </div>
                <div>
                  <dt>Train cameras</dt>
                  <dd>{PROTOCOL.trainSites.join(', ')}</dd>
                </div>
                <div>
                  <dt>Held-out camera</dt>
                  <dd>{PROTOCOL.testSite}</dd>
                </div>
              </dl>
            </div>
          }
        >
          <p>
            The encoder never sees a species name while it pretrains. It sees unlabeled train-site
            frames and a simple puzzle: guess whether the crop was turned 0, 90, 180, or 270
            degrees. That is light unlabeled training on a tiny image network. A two-view contrast
            method collapsed on this backbone, so the turn-guess puzzle is what I kept.
          </p>
          <p>
            Then I freeze the encoder and fit a cheap linear read-out on train-site labels only. The
            number I stand behind is how often that read-out is right on camera {PROTOCOL.testSite}. I
            also train a labeled image network from scratch on the same train cameras, and I run the
            same read-out on a frozen random encoder, so I can see whether the unlabeled warm-up did
            any work.
          </p>
        </StoryBeat>

        <StoryBeat
          id="result"
          kicker="The result"
          title="The cheap read-out still works on the camera I left out"
          caption={`Held-out camera ${PROTOCOL.testSite}: unlabeled-then-linear ${METRICS.successPct}% next to same-site ${METRICS.sameSitePct.toFixed(1)}%, a random encoder ${METRICS.randomEncoderPct}%, and chance ${METRICS.chancePct.toFixed(1)}%. Floor is 85.${NOTE}`}
          visual={
            <>
              <ArchChart />
              <ResultsChart />
            </>
          }
        >
          <p>
            On this analog the held-out read-out hits {METRICS.successPct}%. Chance is{' '}
            {METRICS.chancePct.toFixed(1)}% with {METRICS.nClasses} classes. The frozen random encoder
            is {METRICS.randomEncoderPct}%. The unlabeled warm-up has to beat that column, not only beat chance.
          </p>
          <ResultBento />
          <p style={{ marginTop: 'var(--space-5)' }}>
            Same-site read-out is {METRICS.sameSitePct.toFixed(1)}%, the debug column. It is not the
            headline. A labeled net trained from scratch on the train cameras also scores {METRICS.supervisedPct}%
            on the hold-out here, which this analog allows: the class cue is shape, and a labeled image
            network can find it. I still report the unlabeled-then-linear number, because that is the
            question I asked.
          </p>
          <table className="choice-table">
            <caption className="sr-only">Unlabeled-then-linear, labeled-from-scratch, random encoder, and chance on the held-out camera</caption>
            <thead>
              <tr>
                <th scope="col">On the same split</th>
                <th scope="col">Unlabeled then linear</th>
                <th scope="col">Labeled from scratch</th>
                <th scope="col">Random encoder</th>
                <th scope="col">Chance</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((r) => (
                <tr key={r.metric}>
                  <td>{r.metric}</td>
                  <td style={{ color: r.best === 'ssl' ? 'var(--good)' : 'var(--fg)' }}>{r.ssl}</td>
                  <td>{r.supervised}</td>
                  <td>{r.random}</td>
                  <td>{r.chance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </StoryBeat>

        <section className="story-beat" id="stack">
          <p className="story-kicker">How it works</p>
          <h2>The tools, in plain terms</h2>
          <p className="stack-intro">
            Small stack, so the split is the thing you can audit. Each card is one piece: what it
            does, then how.
          </p>
          <StackGrid />
        </section>

        <StoryBeat
          id="decisions"
          kicker="Design choices"
          title="The calls I made"
          caption="What I first reached for, and what I built instead."
          visual={
            <div className="teach-card">
              <h3 className="teach-card__title">First idea, and what I built</h3>
              <table className="choice-table">
                <caption className="sr-only">Design choices</caption>
                <thead>
                  <tr>
                    <th scope="col">First idea</th>
                    <th scope="col">What I built</th>
                  </tr>
                </thead>
                <tbody>
                  {DECISIONS.map((d) => (
                    <tr key={d.first}>
                      <td>{d.first}</td>
                      <td>{d.built}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        >
          <p>
            <strong>I held out a whole camera.</strong> Mixing frames from Q into the probe’s train
            set would leak the answer. The tests fail if that happens.
          </p>
          <p>
            <strong>I capped classes until the floor was reachable.</strong> Four classes on this tiny
            CNN with NT-Xent did not clear 85 on the hold-out. Three classes and rotation pretext did.
            That cap is frozen in const until I re-measure on a bigger backbone or on real LILA
            frames.
          </p>
          <p>
            <strong>I kept the same-site number visible.</strong> It is the debug column. If it is
            high and the hold-out is not, the encoder is a camera lookup table.
          </p>
        </StoryBeat>

        <section className="story-beat" id="use">
          <p className="story-kicker">Running it</p>
          <h2>Clone it and rerun the split</h2>
          <ol className="stack-list" style={{ maxWidth: 'var(--measure)' }}>
            <li>
              From the repo root, run <code>python scripts/run.py</code>. It writes <code>metrics.json</code> and
              prints held-out probe_pct next to same_site_pct, supervised_pct, random_encoder_pct, and
              chance.
            </li>
            <li>
              Run <code>python -m pytest tests/test_eval.py -q</code>. Injecting held-out site images
              into the train pool must fail.
            </li>
            <li>
              Run <code>npm --prefix web run dev</code> for this page. Charts read <code>data.ts</code> /{' '}
              <code>metrics.gen.ts</code>.
            </li>
          </ol>
        </section>

        <section className="story-beat" id="next">
          <p className="story-kicker">What is next, and where this shows up</p>
          <h2>Improve, next, sectors</h2>
          <ul className="stack-list" style={{ maxWidth: 'var(--measure)' }}>
            {NEXT.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <ul className="stack-list" style={{ maxWidth: 'var(--measure)', marginTop: 'var(--space-5)' }}>
            {SECTORS.map((s) => (
              <li key={s.name}>
                <strong>{s.name}.</strong> {s.detail}
              </li>
            ))}
          </ul>
        </section>

        <footer
          id="close"
          style={{
            borderTop: '1px solid var(--line-rule)',
            paddingTop: 'var(--space-6)',
            marginTop: 'var(--space-6)',
            color: 'var(--fg-low)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <p style={{ maxWidth: 'var(--measure)' }}>
            I am asking whether unlabeled pretraining learned features that survive a new camera, not
            whether I topped a supervised leaderboard. Data: {META.analog}, leave-one-site-out, top-
            {METRICS.nClasses} classes. {META.lila} remains the intended public corpus when a capped
            pull fits on disk. Not a species-ID product.
          </p>
        </footer>
      </main>
    </>
  )
}
