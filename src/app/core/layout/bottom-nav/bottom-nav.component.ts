import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '@app/services/auth.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { primaryNavigation, secondaryNavigation, profileDestination } from '../navigation';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  @ViewChild('sheet', { static: true }) private sheet!: ElementRef<HTMLDialogElement>;

  readonly sheetOpen = signal(false);
  readonly primary = primaryNavigation;
  readonly secondary = [...secondaryNavigation, profileDestination];

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(() => this.closeSheet());
  }

  openSheet(): void {
    if (this.sheet.nativeElement.open) return;
    this.sheet.nativeElement.showModal();
    this.sheetOpen.set(true);
  }

  closeSheet(): void {
    if (this.sheet.nativeElement.open) this.sheet.nativeElement.close();
    this.sheetOpen.set(false);
  }

  dismissFromBackdrop(event: MouseEvent): void {
    if (event.target === this.sheet.nativeElement) this.closeSheet();
  }

  @HostListener('window:resize')
  closeOnDesktop(): void {
    if (window.matchMedia('(min-width: 821px)').matches) this.closeSheet();
  }

  isSecondaryActive(): boolean {
    return this.secondary.some(item => this.router.isActive(item.route, {
      paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored',
    }));
  }

  logout(): void {
    this.closeSheet();
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
