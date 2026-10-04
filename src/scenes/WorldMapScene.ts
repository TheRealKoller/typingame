import * as Phaser from 'phaser';
import { pointState, REGIONS, WORLD_LINKS, WORLD_POINTS, worldPoint, type PointState, type WorldPoint } from '../content/journey';
import type { Progress } from '../progress/progress';
import { TypingEngine } from '../typing/engine';
import { WordLabel } from '../ui/WordLabel';
import type { BattleSceneData } from './BattleScene';

const PARCHMENT = '#e8dcc0';
const ASH = 0x8a8178;
const INK = '#2f2a24';
const QUIET = '#7a6a5a';
const LINK_COLOR = 0x7a6248;
const POINT_RADIUS = 18;
const POINT_COLORS: Readonly<Record<PointState, number>> = { freed: 0x9fd4ff, open: 0x3a1e2e, locked: 0xa89c8c };
const PAPER = 0xf4ead6;
const PAPER_EDGE = 0xcbb894;

export interface WorldMapSceneData {
  readonly progress: Progress;
}

/**
 * The journey's world map: points held by the Silence, linked by paths.
 * Typing a point's word selects it, Enter starts its battle. Like the name
 * prompt, choosing a place is no practice: the keystrokes are not counted.
 */
export class WorldMapScene extends Phaser.Scene {
  #progress!: Progress;
  #engine!: TypingEngine;
  #labels: WordLabel[] = [];
  #selected: WorldPoint | null = null;
  #ring!: Phaser.GameObjects.Arc;
  #hint!: Phaser.GameObjects.Text;

  create(data: WorldMapSceneData): void {
    this.#progress = data.progress;
    this.#selected = null;
    this.cameras.main.setBackgroundColor(PARCHMENT).fadeIn(500);
    const freed = this.#progress.freed;
    const states = new Map(WORLD_POINTS.map((point) => [point.id, pointState(point.id, freed)]));

    this.#drawRegions();
    const links = this.add.graphics();
    for (const [a, b] of WORLD_LINKS) {
      const from = worldPoint(a);
      const to = worldPoint(b);
      const reachable = states.get(a) !== 'locked' && states.get(b) !== 'locked';
      links.lineStyle(6, LINK_COLOR, reachable ? 0.8 : 0.25).lineBetween(from.x, from.y, to.x, to.y);
    }

    this.#ring = this.add.circle(0, 0, POINT_RADIUS + 10).setStrokeStyle(4, 0x9fd4ff).setVisible(false);
    this.tweens.add({ targets: this.#ring, scale: 1.15, duration: 600, yoyo: true, repeat: -1 });
    this.#labels = [];
    for (const point of WORLD_POINTS) {
      const state = states.get(point.id)!;
      const dot = this.add.circle(point.x, point.y, POINT_RADIUS, POINT_COLORS[state]).setStrokeStyle(3, 0x2f2a24, 0.7);
      if (state === 'locked') dot.setAlpha(0.5);
      if (state === 'open') this.tweens.add({ targets: dot, scale: 1.12, duration: 900, yoyo: true, repeat: -1 });
      this.add
        .text(point.x, point.y + POINT_RADIUS + 8, point.name, { fontFamily: 'serif', fontSize: '20px', color: state === 'locked' ? QUIET : INK })
        .setOrigin(0.5, 0)
        .setAlpha(state === 'locked' ? 0.6 : 1);
      if (state !== 'locked') this.#labels.push(new WordLabel(this, point.x, point.y - POINT_RADIUS - 22, point.word, 26));
    }

    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height - 44, 760, 56, PAPER, 0.95).setStrokeStyle(2, PAPER_EDGE);
    this.#hint = this.add.text(width / 2, height - 44, '', { fontFamily: 'sans-serif', fontSize: '20px', color: INK }).setOrigin(0.5);

    this.#engine = new TypingEngine(this.#labels.map((label) => label.word));
    this.#sync();
    window.addEventListener('keydown', this.#onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.#onKeyDown));
  }

  /** Region names over the map; the ash fields are grey with soot, the others still hidden. */
  #drawRegions(): void {
    const ash = this.add.graphics();
    ash.fillStyle(ASH, 0.25).fillEllipse(390, 440, 620, 420);
    for (const region of REGIONS) {
      this.add
        .text(region.x, region.y, region.name, {
          fontFamily: 'serif',
          fontSize: region.open ? '34px' : '28px',
          fontStyle: 'italic',
          color: region.open ? INK : QUIET,
        })
        .setOrigin(0.5)
        .setAlpha(region.open ? 0.85 : 0.35);
    }
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab' || event.key === ' ') event.preventDefault();
    if (event.key === 'Escape') {
      this.#engine.cancel();
      this.#selected = null;
      this.#sync();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat && this.#selected) this.#start(this.#selected);
      return;
    }
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;
    for (const typed of this.#engine.type(event.key)) {
      if (typed.type !== 'complete') continue;
      this.#selected = WORLD_POINTS.find((point) => point.word === typed.word) ?? null;
    }
    this.#sync();
  };

  #start(point: WorldPoint): void {
    window.removeEventListener('keydown', this.#onKeyDown);
    this.cameras.main.fadeOut(400);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('BattleScene', { progress: this.#progress, point: point.id } satisfies BattleSceneData);
    });
  }

  #sync(): void {
    const { typed, candidates } = this.#engine;
    for (const label of this.#labels) label.setProgress(typed, candidates.includes(label.word));
    const selected = this.#selected;
    this.#ring.setVisible(selected !== null);
    if (selected) this.#ring.setPosition(selected.x, selected.y);
    this.#hint.setText(
      selected
        ? `${selected.name}${this.#progress.freed.has(selected.id) ? ' (befreit)' : ''} – Enter: kämpfen, Esc: anderer Ort`
        : 'Tippe das Wort über einem Ort, um ihn zu wählen.',
    );
  }
}
