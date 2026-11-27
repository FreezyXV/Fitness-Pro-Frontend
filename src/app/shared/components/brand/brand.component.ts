import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-brand',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12h4l3-8 5 16 3-8h5" />
      </svg>
    </span>
    <span class="brand-word">Fitness<span>Pro</span></span>
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 9px; color: inherit; }
    .brand-mark {
      display: grid; place-items: center; width: 35px; height: 35px;
      background: var(--fp-accent); color: var(--fp-on-accent); border-radius: 8px;
    }
    svg { width: 22px; height: 22px; }
    .brand-word { font: 800 1.12rem/1 Archivo, sans-serif; letter-spacing: -.055em; }
    .brand-word span { color: var(--fp-green-ink); }
  `,
})
export class BrandComponent {}
