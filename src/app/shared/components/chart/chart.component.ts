import {
  Component,
  AfterViewInit,
  DestroyRef,
  ElementRef,
  inject,
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

const PAD_LEFT = 43;
const PAD_RIGHT = 20;
const PLOT_TOP = 14;
const PLOT_BOTTOM = 180;
const HEIGHT = 206;
const exactNumber = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const compactNumber = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly width = signal(600);
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

  readonly viewBox = computed(() => `0 0 ${this.width()} ${HEIGHT}`);
  readonly plotLeft = PAD_LEFT;
  readonly plotRight = computed(() => this.width() - PAD_RIGHT);
  readonly plotTop = PLOT_TOP;
  readonly plotBottom = PLOT_BOTTOM;

  ngAfterViewInit(): void {
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      if (width > 0) this.width.set(Math.max(200, width));
    });
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

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

    const step = this._points().every(p => Number.isInteger(p.y))
      ? Math.max(1, niceStep(rawMax / 4))
      : niceStep(rawMax / 4);
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

  readonly xTicks = computed(() => {
    const points = this._points();
    if (!points.length) return [];

    const maxLabels = this.width() >= 520 ? 6 : 4;
    const stride = Math.max(1, Math.ceil((points.length - 1) / (maxLabels - 1)));
    const last = points.length - 1;
    const labels: { x: number; text: string }[] = [];

    for (let i = 0; i < last; i += stride) {
      const x = this.toX(i);
      const previous = labels.at(-1);
      if (this.toX(last) - x >= 44 && (!previous || x - previous.x >= 44)) {
        labels.push({ x, text: formatShortDate(points[i].x) });
      }
    }
    labels.push({ x: this.toX(last), text: formatShortDate(points[last].x) });
    return labels;
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

    const span = this.plotRight() - this.plotLeft;
    // 0.62 : laisse une gouttiere lisible entre deux barres sans les rendre
    // filiformes quand la serie est longue (52 semaines).
    const width = Math.min(34, (span / pts.length) * 0.66);

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

  readonly selection = computed(() => {
    const points = this._points();
    const index = this.activeIndex() ?? points.length - 1;
    const point = points[index];
    if (!point) return null;

    return {
      x: this.toX(index),
      title: point.label ?? formatLongDate(point.x),
      value: exactNumber.format(point.y),
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
      `Minimum ${exactNumber.format(min)} ${this.unit}, maximum ${exactNumber.format(max)} ${this.unit}, ` +
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
    if (!rect.width) return;
    const localX = (event.clientX - rect.left) * this.width() / rect.width;
    let nearest = 0;
    let distance = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const delta = Math.abs(this.toX(i) - localX);
      if (delta < distance) {
        nearest = i;
        distance = delta;
      }
    }
    this.activeIndex.set(nearest);
  }

  onPointerLeave(event?: PointerEvent): void {
    if (event?.pointerType === 'touch') return;
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
    return compactNumber.format(value);
  }

  /** Libelle du tableau accessible. */
  rowLabel(point: ChartPoint): string {
    return formatLongDate(point.x);
  }

  private toX(index: number): number {
    const points = this._points();
    const span = this.plotRight() - this.plotLeft;
    if (this._type() === 'bar') return this.plotLeft + ((index + 0.5) / points.length) * span;
    if (points.length <= 1) return this.plotLeft + span / 2;
    const start = points[0].x.getTime();
    const end = points[points.length - 1].x.getTime();
    const time = points[index].x.getTime();
    const fraction = end > start ? (time - start) / (end - start) : index / (points.length - 1);
    return this.plotLeft + fraction * span;
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

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
