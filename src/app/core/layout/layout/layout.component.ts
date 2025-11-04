// src/app/layout/layout/layout.component.ts - Fixed to use external template/styles
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

// Import de votre SidebarComponent sophistiquée
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    SidebarComponent  // Utilisation de votre sidebar sophistiquée
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {
    console.log('Layout with Sidebar initialized');
  }
}