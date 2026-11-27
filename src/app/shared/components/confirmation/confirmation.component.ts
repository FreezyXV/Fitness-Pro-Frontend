import { Component, inject } from '@angular/core';
import { DialogDirective } from '../dialog/dialog.directive';
import { ConfirmationService } from './confirmation.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [DialogDirective],
  template: `
    @if (confirmation.request(); as request) {
      <dialog appDialog class="modal-overlay app-dialog" data-dialog-size="compact"
              (dismissed)="confirmation.dismiss()">
        <section class="modal confirmation-panel">
          <header class="modal-header">
            <h2>{{ request.title }}</h2>
            <button type="button" class="modal-close" (click)="confirmation.dismiss()"
                    aria-label="Fermer la fenêtre">×</button>
          </header>
          <p class="modal-body">{{ request.message }}</p>
          <footer class="modal-footer">
            <button type="button" class="btn" autofocus (click)="confirmation.dismiss()">
              {{ request.cancelLabel || 'Annuler' }}
            </button>
            <button type="button" class="btn" [class.btn-primary]="!request.destructive"
                    [class.btn-danger]="request.destructive" (click)="confirmation.confirm()">
              {{ request.confirmLabel }}
            </button>
          </footer>
        </section>
      </dialog>
    }
  `,
  styles: `
    .confirmation-panel {
      background: var(--fp-surface);
      color: var(--fp-ink);
    }
    .modal-body {
      margin: 0;
      font-size: .9375rem;
      color: var(--fp-ink-secondary);
      overflow-wrap: anywhere;
    }
    .btn {
      padding: 0 14px;
      border: 1px solid var(--fp-control-line);
      border-radius: 7px;
      background: transparent;
      color: var(--fp-ink);
      font: inherit;
      font-size: .875rem;
      font-weight: 650;
    }
  `,
})
export class ConfirmationComponent {
  readonly confirmation = inject(ConfirmationService);
}
