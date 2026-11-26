import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '@app/services/auth.service';
import { BrandComponent } from '@app/shared/components/brand/brand.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { primaryNavigation, secondaryNavigation } from '../navigation';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandComponent, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly user = this.auth.currentUser$;
  readonly sections = [
    { label: 'Suivi', items: primaryNavigation },
    { label: 'Bibliothèque', items: secondaryNavigation },
  ];

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
