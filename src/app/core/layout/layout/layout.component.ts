import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { IconComponent } from '@app/shared/components/icon/icon.component';
import { BrandComponent } from '@app/shared/components/brand/brand.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, SidebarComponent, BottomNavComponent, BrandComponent, IconComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {}
