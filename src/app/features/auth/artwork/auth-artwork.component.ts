import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-auth-artwork',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plate" aria-hidden="true"><span></span></div>
    <div class="visual-copy">
      <p>Le carnet des séances</p>
      <strong>Chaque série<br>compte.</strong>
    </div>
  `,
  styleUrl: './auth-artwork.component.scss',
})
export class AuthArtworkComponent {}
