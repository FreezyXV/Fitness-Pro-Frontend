import { Injectable, signal } from '@angular/core';

interface Confirmation {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly active = signal<(Confirmation & { accept: () => void }) | null>(null);
  readonly request = this.active.asReadonly();

  open(confirmation: Confirmation, accept: () => void): void {
    if (this.active()) return;
    this.active.set({ ...confirmation, accept });
  }

  dismiss(): void {
    this.active.set(null);
  }

  confirm(): void {
    const confirmation = this.active();
    this.dismiss();
    confirmation?.accept();
  }
}
