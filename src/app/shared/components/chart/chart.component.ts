// chart.component.ts - Graphique cartesien minimal, sans dependance.
//
// Le projet n'embarque aucune librairie de graphiques : le "graphe de
// performance" du dashboard etait une <polyline> ecrite en dur, sans axes ni
// echelle, donc illisible. Plutot que d'ajouter 40 a 200 ko de dependance
// pour deux courbes, ce composant fournit ce qui manque reellement : une
// echelle calculee, des graduations lisibles, un survol qui donne la valeur
// exacte, et un equivalent clavier + lecteur d'ecran.
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartPoint {
  /** Abscisse : une date, ou un index si la serie n'est pas temporelle. */
  x: Date;
  y: number;
  /** Libelle affiche dans l'infobulle. A defaut, la date est formatee. */
  label?: string;
}

// Repere interne fixe : le SVG est ensuite mis a l'echelle en CSS
// (width: 100%), ce qui evite de recalculer la geometrie au redimensionnement.
const VIEW_W = 600;
const VIEW_H = 260;
const PAD_LEFT = 46;
const PAD_RIGHT = 14;
const PAD_TOP = 18;
const PAD_BOTTOM = 30;

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent {
  private readonly _points = signal<ChartPoint[]>([]);
  private readonly _type = signal<'line' | 'bar'>('line');

  @Input({ required: true }) set points(value: ChartPoint[]) {
    this._points.set(value ?? []);
    this.activeIndex.set(null);
  }

  @Input() set type(value: 'line' | 'bar') {
    this._type.set(value ?? 'line');
  }

  /** Unite affichee sur l'axe et dans l'infobulle (kg, séries, min…). */
  @Input() unit = '';

  /** Description lue par les lecteurs d'ecran. */
  @Input() caption = 'Graphique de progression';

  /** Point survole ou selectionne au clavier. */
  readonly activeIndex = signal<number | null>(null);

  readonly viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  readonly plotLeft = PAD_LEFT;
  readonly plotRight = VIEW_W - PAD_RIGHT;
  readonly plotTop = PAD_TOP;
  readonly plotBottom = VIEW_H - PAD_BOTTOM;

  readonly data = computed(() => this._points());
  readonly chartType = computed(() => this._type());
  readonly isEmpty = computed(() => this._points().length === 0);

  // ------------------------------------------------------------------ echelle

  /**
   * Bornes de l'axe Y. On force le zero en bas : sur un graphique de charge
   * ou de volume, tronquer l'axe exagere visuellement des progressions de
   * quelques pourcents. Le haut est arrondi a une graduation "ronde".
   */
  readonly yScale = computed(() => {
    const values = this._points().map(p => p.y);
    const rawMax = values.length ? Math.max(...values) : 0;

    if (rawMax <= 0) return { min: 0, max: 1, step: 1 };

    const step = niceStep(rawMax / 4);
    const max = Math.ceil(rawMax / step) * step;
    return { min: 0, max, step };
  });

  readonly yTicks = computed(() => {
    const { max, step } = this.yScale();
    const ticks: Array<{ value: number; y: number }> = [];
    for (let v = 0; v <= max + step / 2; v += step) {
      ticks.push({ value: v, y: this.toY(v) });
    }
    return ticks;
  });

  /**
   * Graduations de l'axe X. On en affiche au plus 5 : au-dela les libelles se
   * chevauchent sur un ecran de telephone.
   */
  readonly xTicks = computed(() => {
    const pts = this._points();
    if (!pts.length) return [];

    const maxLabels = 5;
    const stride = Math.max(1, Math.ceil(pts.length / maxLabels));

    return pts
      .map((p, i) => ({ i, p }))
      .filter(({ i }) => i % stride === 0 || i === pts.length - 1)
      .map(({ i, p }) => ({ x: this.toX(i), text: formatShortDate(p.x) }));
  });

  // ------------------------------------------------------------------ tracés

  readonly linePath = computed(() => {
    const pts = this._points();
    if (pts.length < 2) return '';
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${this.toX(i).toFixed(1)} ${this.toY(p.y).toFixed(1)}`)
      .join(' ');
  });

  /** Aire sous la courbe, refermee sur la ligne de base. */
  readonly areaPath = computed(() => {
    const line = this.linePath();
    if (!line) return '';
    const last = this.toX(this._points().length - 1).toFixed(1);
    const first = this.toX(0).toFixed(1);
    const base = this.plotBottom.toFixed(1);
    return `${line} L${last} ${base} L${first} ${base} Z`;
  });

  readonly dots = computed(() =>
    this._points().map((p, i) => ({ cx: this.toX(i), cy: this.toY(p.y), i }))
  );

  readonly bars = computed(() => {
    const pts = this._points();
    if (!pts.length) return [];

    const span = this.plotRight - this.plotLeft;
    // 0.62 : laisse une gouttiere lisible entre deux barres sans les rendre
    // filiformes quand la serie est longue (52 semaines).
    const width = Math.max(2, (span / pts.length) * 0.62);

    return pts.map((p, i) => {
      const y = this.toY(p.y);
      return {
        i,
        x: this.toX(i) - width / 2,
        y,
        width,
        // Hauteur minimale de 1px : une semaine a volume nul doit rester
        // distinguable d'une absence de donnee.
        height: Math.max(p.y > 0 ? 1 : 0, this.plotBottom - y),
      };
    });
  });

  // ---------------------------------------------------------------- infobulle

  readonly active = computed(() => {
    const i = this.activeIndex();
    const pts = this._points();
    if (i === null || !pts[i]) return null;

    const p = pts[i];
    const x = this.toX(i);
    const y = this.toY(p.y);

    // L'infobulle bascule a gauche du point quand elle sortirait du cadre.
    const boxWidth = 118;
    const flip = x + boxWidth + 10 > this.plotRight;

    return {
      x,
      y,
      boxX: flip ? x - boxWidth - 8 : x + 8,
      boxY: Math.max(this.plotTop, y - 44),
      boxWidth,
      title: p.label ?? formatLongDate(p.x),
      value: `${formatNumber(p.y)}${this.unit ? ' ' + this.unit : ''}`,
    };
  });

  /** Resume textuel : c'est ce que le lecteur d'ecran annonce. */
  readonly summary = computed(() => {
    const pts = this._points();
    if (!pts.length) return `${this.caption} : aucune donnée.`;

    const values = pts.map(p => p.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const first = values[0];
    const last = values[values.length - 1];
    const trend =
      last > first ? 'en hausse' : last < first ? 'en baisse' : 'stable';

    return (
      `${this.caption} : ${pts.length} points, du ${formatLongDate(pts[0].x)} ` +
      `au ${formatLongDate(pts[pts.length - 1].x)}. ` +
      `Minimum ${formatNumber(min)} ${this.unit}, maximum ${formatNumber(max)} ${this.unit}, ` +
      `tendance ${trend}.`
    );
  });

  // ----------------------------------------------------------- interactions

  /**
   * Selectionne le point le plus proche du pointeur. On convertit les
   * coordonnees ecran en coordonnees du repere SVG : sans cette conversion la
   * detection serait fausse des que le graphique n'est pas a l'echelle 1:1.
   */
  // `Element` et non `SVGSVGElement` : avec strictTemplates, une reference
  // de template sur une balise SVG est typee HTMLElement par Angular.
  // getBoundingClientRect() est de toute facon defini sur Element.
  onPointerMove(event: PointerEvent, svg: Element): void {
    const pts = this._points();
    if (!pts.length) return;

    const rect = svg.getBoundingClientRect();
    const ratio = VIEW_W / rect.width;
    const localX = (event.clientX - rect.left) * ratio;

    const span = this.plotRight - this.plotLeft;
    const stepX = pts.length > 1 ? span / (pts.length - 1) : span;
    const index = Math.round((localX - this.plotLeft) / stepX);

    this.activeIndex.set(Math.min(pts.length - 1, Math.max(0, index)));
  }

  onPointerLeave(): void {
    this.activeIndex.set(null);
  }

  /** Les fleches parcourent la serie : equivalent clavier du survol. */
  onKeydown(event: KeyboardEvent): void {
    const pts = this._points();
    if (!pts.length) return;

    const current = this.activeIndex();
    let next: number | null = current;

    switch (event.key) {
      case 'ArrowRight': next = current === null ? 0 : Math.min(pts.length - 1, current + 1); break;
      case 'ArrowLeft':  next = current === null ? pts.length - 1 : Math.max(0, current - 1); break;
      case 'Home':       next = 0; break;
      case 'End':        next = pts.length - 1; break;
      case 'Escape':     next = null; break;
      default: return;
    }

    event.preventDefault();
    this.activeIndex.set(next);
  }

  // ------------------------------------------------------------------ helpers

  formatTick(value: number): string {
    return formatNumber(value);
  }

  /** Libelle du tableau accessible. */
  rowLabel(point: ChartPoint): string {
    return formatLongDate(point.x);
  }

  private toX(index: number): number {
    const count = this._points().length;
    const span = this.plotRight - this.plotLeft;
    if (count <= 1) return this.plotLeft + span / 2;
    return this.plotLeft + (index / (count - 1)) * span;
  }

  private toY(value: number): number {
    const { max } = this.yScale();
    const span = this.plotBottom - this.plotTop;
    return this.plotBottom - (value / max) * span;
  }
}

/** Pas de graduation "rond" (1, 2, 5, 10, 20, 50…) au-dessus de `rough`. */
function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const exponent = Math.floor(Math.log10(rough));
  const magnitude = Math.pow(10, exponent);
  const normalized = rough / magnitude;

  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

function formatNumber(value: number): string {
  if (Math.abs(value) >= 10000) return `${Math.round(value / 1000)}k`;
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1);
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
