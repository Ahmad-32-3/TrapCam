// Every number the page shows lives here, or in metrics.gen.ts from scripts/run.py.

import { ABLATION, ILLUSTRATIVE, METRICS, PIPELINE, PROTOCOL } from './metrics.gen'

export { ABLATION, ILLUSTRATIVE, METRICS, PIPELINE, PROTOCOL }

export const META = {
  analog: 'capped multi-site camera-trap analog',
  lila: 'Snapshot Serengeti (LILA)',
  kClasses: PROTOCOL.nClasses,
  nTrainSites: METRICS.nSitesTrain,
  testSite: PROTOCOL.testSite,
}

export type Counter = { key: string; label: string; value: number; unit: string; note: string }
export const COUNTERS: Counter[] = [
  { key: 'held', label: 'Held-out camera', value: METRICS.successPct, unit: '%', note: 'cheap linear read-out on a camera it never trained on' },
  { key: 'same', label: 'Same-camera debug', value: Number(METRICS.sameSitePct.toFixed(1)), unit: '%', note: 'debug column: train-camera images only' },
  { key: 'rand', label: 'Frozen random encoder', value: METRICS.randomEncoderPct, unit: '%', note: 'same probe, untrained CNN' },
  { key: 'chance', label: 'Chance', value: Number(METRICS.chancePct.toFixed(1)), unit: '%', note: `${METRICS.nClasses} classes` },
]

export const COMPARISON = [
  { metric: 'Held-out camera, how often right', ssl: `${METRICS.successPct}`, supervised: `${METRICS.supervisedPct}`, random: `${METRICS.randomEncoderPct}`, chance: `${METRICS.chancePct.toFixed(1)}`, best: 'ssl' },
  { metric: 'Same-camera debug', ssl: `${METRICS.sameSitePct.toFixed(1)}`, supervised: 'n/a', random: 'n/a', chance: `${METRICS.chancePct.toFixed(1)}`, best: 'ssl' },
  { metric: 'Train sites / test sites', ssl: `${METRICS.nSitesTrain} / ${METRICS.nSitesTest}`, supervised: `${METRICS.nSitesTrain} / ${METRICS.nSitesTest}`, random: `${METRICS.nSitesTrain} / ${METRICS.nSitesTest}`, chance: 'n/a', best: 'tie' },
] as const

export const DECISIONS = [
  {
    first: 'Train a labeled image network on every camera I have',
    built: 'Pretrain without labels on train cameras, freeze, then a cheap linear read-out',
  },
  {
    first: 'Score the probe on the same cameras I trained it on',
    built: 'Hold out a whole camera group and only report that number',
  },
  {
    first: 'Two-view NT-Xent on this tiny CNN',
    built: 'Rotation pretext (RotNet) after NT-Xent collapsed',
  },
  {
    first: 'Pull the full Snapshot Serengeti image dump',
    built: 'Cap to three classes on a multi-site analog until the floor is green',
  },
] as const

export type Tool = { name: string; tag: string; plain: string; tech: string }
export const STACK: Tool[] = [
  {
    name: 'numpy images',
    tag: 'data',
    plain: 'Builds the capped multi-site frames: class is shape, camera is color and grain.',
    tech: 'Each frame is 32×32. Train cameras B, C, D, E; camera Q is held out. Three silhouettes stand in for gazelle, zebra, wildebeest.',
  },
  {
    name: 'rotation pretext',
    tag: 'ssl',
    plain: 'The encoder learns by guessing how a frame was rotated, with no species labels.',
    tech: 'Tiny CNN. Each unlabeled train-site crop is rotated 0/90/180/270 and the head predicts which. Two-view NT-Xent collapsed on this backbone, so this is the light SSL that ran.',
  },
  {
    name: 'freeze + linear probe',
    tag: 'probe',
    plain: 'Lock the encoder, then fit a linear classifier on train-site labels only.',
    tech: 'Global-average-pooled 32-d vectors into scikit-learn logistic regression. Held-out camera Q never enters the probe’s labeled set.',
  },
  {
    name: 'supervised CNN',
    tag: 'ablation',
    plain: 'A labeled CNN trained from scratch on the train cameras, scored on Q.',
    tech: 'Same backbone, cross-entropy on species labels from B, C, D, and E only, then top-1 on Q.',
  },
  {
    name: 'random encoder',
    tag: 'baseline',
    plain: 'The same CNN with untrained weights, then the same linear probe.',
    tech: 'If pretext did nothing useful, this column would match it. The headline has to beat this number.',
  },
  {
    name: 'Vite, React, motion',
    tag: 'page',
    plain: 'Builds this page and draws the charts.',
    tech: 'React and Tailwind on Vite. Charts are SVG that read the numbers above. No network calls from the page.',
  },
]

export const NEXT = [
  'Swap the analog for a capped Snapshot Serengeti pull (top-K species, a handful of cameras) and re-run the same split.',
  'If four species still miss 85 on real frames, keep the cap and write the ADR; do not invent a percentage.',
  'Try SimCLR again on a larger backbone once the tiny CNN is no longer the bottleneck.',
]

export const SECTORS = [
  {
    name: 'Ecology camera traps',
    detail: 'A new camera at a new waterhole should not force a full relabel. Features that survive a hold-out site are the ones worth storing.',
  },
  {
    name: 'Retail multi-store vision',
    detail: 'A detector trained in one shop lighting setup often dies in another. Pretrain on unlabeled frames from several stores, probe on a store you kept out.',
  },
  {
    name: 'Medical multi-hospital',
    detail: 'Scanners differ by site. If a linear probe on a frozen encoder holds up on a hospital the probe never saw, the representation is doing the work, not the camera fingerprint.',
  },
]
