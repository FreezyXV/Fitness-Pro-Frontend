// icon.component.ts - Jeu d'icones de l'interface.
//
// L'app utilisait 155 emoji comme elements d'interface : 🎯 pour un objectif,
// 💪 pour une seance, 🔥 pour les calories. Trois problemes.
//
//   1. Le rendu depend du systeme : le meme 🏋️ est un pictogramme plat sur
//      Android, un dessin en relief sur iOS, un carre vide sur certains Linux.
//      Une interface ne peut pas reposer sur un jeu de formes qu'elle ne
//      controle pas.
//   2. Les emoji sont polychromes et detaillés : poses sur une interface
//      sombre et sobre, ils lisent comme du clipart.
//   3. Ils ne prennent pas la couleur du texte, donc ni etat actif, ni etat
//      desactive, ni contraste maitrise.
//
// Tous les traces partagent la meme grille 24x24, la meme graisse et
// `currentColor` : ils heritent de la couleur du contexte.
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'target' | 'dumbbell' | 'chart' | 'trending' | 'flame' | 'trophy'
  | 'calendar' | 'check' | 'check-circle' | 'clipboard' | 'bolt' | 'alert'
  | 'star' | 'droplet' | 'close' | 'user' | 'users' | 'edit' | 'video'
  | 'bulb' | 'tag' | 'utensils' | 'search' | 'plus' | 'leaf' | 'logout'
  | 'lock' | 'link' | 'eye' | 'globe' | 'settings' | 'refresh' | 'moon'
  | 'clock' | 'book' | 'circle' | 'mail' | 'eye-off';

/** Primitive de dessin. Uniquement des contours : ni aplat, ni couleur. */
type Shape =
  | { t: 'p'; d: string }
  | { t: 'c'; cx: number; cy: number; r: number }
  | { t: 'r'; x: number; y: number; w: number; h: number; rx: number };

const p = (d: string): Shape => ({ t: 'p', d });
const c = (cx: number, cy: number, r: number): Shape => ({ t: 'c', cx, cy, r });
const r = (x: number, y: number, w: number, h: number, rx = 2): Shape => ({ t: 'r', x, y, w, h, rx });

/** Traces en 24x24, meme grille et meme graisse pour tout le jeu. */
const PATHS: Record<IconName, Shape[]> = {
  target:        [c(12, 12, 9), c(12, 12, 5), c(12, 12, 1.5)],
  dumbbell:      [p('M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11')],
  chart:         [p('M3 3v18h18'), r(7, 12, 3, 6, 1), r(12, 8, 3, 10, 1), r(17, 5, 3, 13, 1)],
  trending:      [p('M3 3v18h18'), p('M7 15l4-4 3 3 5-6')],
  flame:         [p('M12 3c.5 3 2.5 4.2 4 6 1.2 1.4 2 3 2 5a6 6 0 0 1-12 0c0-1.5.5-2.8 1.5-4 .3 1 .9 1.7 1.8 2 .2-3.4 1.3-6.4 2.7-9z')],
  trophy:        [p('M7 4h10v5a5 5 0 0 1-10 0z'), p('M7 6H4.5v1A3.5 3.5 0 0 0 8 10.5'), p('M17 6h2.5v1a3.5 3.5 0 0 1-3.5 3.5'), p('M12 14v4'), p('M9 20h6')],
  calendar:      [r(3, 5, 18, 16, 2), p('M3 10h18M8 3v4M16 3v4')],
  check:         [p('M4 12.5l5 5 11-11')],
  'check-circle':[c(12, 12, 9), p('M8 12.2l2.8 2.8L16 9.8')],
  clipboard:     [r(5, 4, 14, 17, 2), p('M9 4V3h6v1'), p('M9 10h6M9 14h6M9 18h3')],
  bolt:          [p('M13 3L5 13.5h5.5L11 21l8-10.5h-5.5z')],
  alert:         [p('M12 4l9 16H3z'), p('M12 10v4M12 17.2v.1')],
  star:          [p('M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z')],
  droplet:       [p('M12 3.5s6 6.4 6 10.2a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z')],
  close:         [p('M6 6l12 12M18 6L6 18')],
  user:          [c(12, 8, 4), p('M4.5 20.5a7.5 7.5 0 0 1 15 0')],
  users:         [c(9, 8, 3.5), p('M2.5 20a6.5 6.5 0 0 1 13 0'), p('M16 5.2a3.5 3.5 0 0 1 0 6.6'), p('M17.5 14.5a6.5 6.5 0 0 1 4 5.5')],
  edit:          [p('M4 20h4L20 8l-4-4L4 16z'), p('M14.5 5.5l4 4')],
  video:         [r(3, 6, 12, 12, 2), p('M15 10.5l6-3.5v10l-6-3.5z')],
  bulb:          [p('M9.5 17a6 6 0 1 1 5 0'), p('M9.5 17v2h5v-2'), p('M10.5 21.5h3')],
  tag:           [p('M3.5 11.5V4.5h7L21 15l-7 7z'), c(7.5, 8.5, 1.3)],
  utensils:      [p('M6 3v7a2.5 2.5 0 0 0 5 0V3'), p('M8.5 12.5V21'), p('M17.5 3c-1.4 1.8-1.4 4.5-1.4 6.5H19c0-2 0-4.7-1.5-6.5z'), p('M17.5 9.5V21')],
  search:        [c(11, 11, 6.5), p('M16 16l4.5 4.5')],
  plus:          [p('M12 5v14M5 12h14')],
  leaf:          [p('M20 4c0 9-5.5 14-12 14-1.5 0-2.8-.3-4-.9C4 9.5 10 4 20 4z'), p('M4 20c2.5-5 6-8 11-10')],
  logout:        [p('M9.5 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h3.5'), p('M16 16l4-4-4-4'), p('M20 12H9')],
  lock:          [r(4.5, 10.5, 15, 10, 2), p('M8 10.5V7.5a4 4 0 0 1 8 0v3')],
  link:          [p('M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.4 1.4'), p('M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4')],
  eye:           [p('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z'), c(12, 12, 3)],
  globe:         [c(12, 12, 9), p('M3 12h18'), p('M12 3c2.5 2.7 3.8 5.8 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.8-3.8-9S9.5 5.7 12 3z')],
  settings:      [c(12, 12, 3), p('M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3')],
  refresh:       [p('M20 12a8 8 0 1 1-2.5-5.8'), p('M20 4v5h-5')],
  moon:          [p('M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z')],
  clock:         [c(12, 12, 9), p('M12 7v5.3l3.5 2')],
  book:          [p('M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z'), p('M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5')],

  // Ajouts. Ces trois traces manquaient au jeu, et c'est ce qui avait
  // conduit quatre gabarits a garder des icones Font Awesome (`<i class="fas
  // fa-envelope">`) alors que la police n'est chargee nulle part : les <i>
  // rendaient du vide, et le texte voisin se recollait — le detail du jour du
  // mini-calendrier affichait « 1 0cal » au lieu de « 1 seance · 0 cal ».
  circle:        [c(12, 12, 8)],
  mail:          [r(3, 5, 18, 14, 2), p('M3.5 6.5L12 13l8.5-6.5')],
  'eye-off':     [p('M2.5 12S6 5.5 12 5.5c1.6 0 3 .5 4.3 1.2'), p('M19.4 9.2c1.3 1.4 2.1 2.8 2.1 2.8S18 18.5 12 18.5c-1.7 0-3.2-.5-4.5-1.2'), p('M4 4l16 16')],
};

/**
 * Correspondance emoji -> icone.
 *
 * Les categories, difficultes et types d'evenement sont decrits dans des
 * tables TypeScript qui portent un emoji (`{ value: 'cardio', icon: '❤️' }`).
 * Plutot que de reecrire chacune de ces tables et tous leurs appelants, le
 * composant accepte un emoji et le resout lui-meme. Les tables peuvent
 * migrer vers des noms d'icones progressivement, sans rien casser.
 */
const FROM_EMOJI: Record<string, IconName> = {
  '🎯':'target','💪':'dumbbell','🏋':'dumbbell','🏋️':'dumbbell','🏋️‍♂️':'dumbbell','🦵':'dumbbell','🤲':'dumbbell',
  '📊':'chart','📈':'trending','🔥':'flame','🏆':'trophy','🥇':'trophy','🥈':'trophy','🥉':'trophy','🏅':'trophy',
  '📅':'calendar','✓':'check','✔':'check','✅':'check-circle','❌':'close','✕':'close','🛑':'alert',
  '📋':'clipboard','📚':'book','📂':'book','⚡':'bolt','⚡️':'bolt','🚀':'bolt','⚠':'alert','⚠️':'alert',
  '⭐':'star','🌟':'star','💧':'droplet','👤':'user','👥':'users','📝':'edit','✏️':'edit','🎥':'video','📷':'video',
  '💡':'bulb','🏷':'tag','🏷️':'tag','🍽':'utensils','🍽️':'utensils','👨‍🍳':'utensils','🥑':'leaf','🍎':'leaf',
  '🌾':'leaf','🌿':'leaf','🧘':'moon','😴':'moon','🔍':'search','➕':'plus','🚪':'logout','🔐':'lock','🔗':'link',
  '👁':'eye','👁️':'eye','✉':'mail','✉️':'mail','📧':'mail','⏱':'clock','⏱️':'clock','⏰':'clock','⏳':'clock','▶':'bolt','▶️':'bolt','⏸':'clock','⏸️':'clock','🍏':'leaf','😌':'moon','📖':'book','🧍':'user','🌱':'leaf','🌍':'globe','⚙':'settings','⚙️':'settings','🔄':'refresh','🎉':'star','❤':'flame','❤️':'flame',
  '🟢':'check-circle','🟡':'alert','🔴':'alert','🤸':'dumbbell','🏃':'trending','⚖':'chart','⚖️':'chart','🧠':'bulb',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="label ? null : true"
      [attr.role]="label ? 'img' : null"
      [attr.aria-label]="label"
    >
      <ng-container *ngFor="let s of shapes">
        <path   *ngIf="s.t === 'p'" [attr.d]="s.d" />
        <circle *ngIf="s.t === 'c'" [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.r]="s.r" />
        <rect   *ngIf="s.t === 'r'" [attr.x]="s.x" [attr.y]="s.y"
                [attr.width]="s.w" [attr.height]="s.h" [attr.rx]="s.rx" />
      </ng-container>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; flex-shrink: 0; line-height: 0; }
    svg { display: block; }
  `],
})
export class IconComponent {
  /**
   * Nom d'icone, ou emoji issu d'une table de donnees : les deux sont
   * acceptes. Une valeur inconnue retombe sur une icone neutre plutot que de
   * laisser un trou dans l'interface.
   */
  @Input({ required: true }) set name(value: IconName | string | null | undefined) {
    if (!value) { this._name = 'target'; return; }
    const direct = value as IconName;
    if (PATHS[direct]) { this._name = direct; return; }
    this._name = FROM_EMOJI[value.trim()] ?? 'target';
  }

  @Input() size = 20;

  /** Graisse : 1.75 tient bien de 16 a 32 px sans paraitre grasse ni fine. */
  @Input() strokeWidth = 1.75;

  /** Renseigner uniquement si l'icone porte un sens non repris par le texte. */
  @Input() label: string | null = null;

  private _name: IconName = 'target';

  get shapes(): Shape[] {
    return PATHS[this._name] ?? PATHS['target'];
  }
}
