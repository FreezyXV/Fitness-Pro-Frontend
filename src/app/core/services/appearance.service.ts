import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type Appearance = 'system' | 'light' | 'dark';

const storageKey = 'fitnesspro.appearance';

function readAppearance(): Appearance {
  try {
    const value = localStorage.getItem(storageKey);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    // Private browsing may deny storage.
  }
  return 'system';
}

@Injectable({ providedIn: 'root' })
export class AppearanceService {
  private readonly document = inject(DOCUMENT);
  private readonly systemLight = this.document.defaultView?.matchMedia('(prefers-color-scheme: light)');
  private readonly current = signal<Appearance>(readAppearance());

  readonly preference = this.current.asReadonly();

  constructor() {
    this.apply();
    const updateFromSystem = (): void => {
      if (this.current() === 'system') this.apply();
    };
    this.systemLight?.addEventListener('change', updateFromSystem);
    inject(DestroyRef).onDestroy(() => this.systemLight?.removeEventListener('change', updateFromSystem));
  }

  setPreference(value: Appearance): void {
    this.current.set(value);
    try {
      if (value === 'system') localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, value);
    } catch {
      // Keep the choice for the current session.
    }
    this.apply();
  }

  private apply(): void {
    const root = this.document.documentElement;
    const preference = this.current();
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.dataset['theme'] = preference;

    const light = preference === 'light' || (preference === 'system' && this.systemLight?.matches);
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', light ? '#f7f8f6' : '#0e100e',
    );
  }
}
