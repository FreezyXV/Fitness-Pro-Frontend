// src/app/layout/layout/layout.component.ts - VERSION CORRIGÉE FINALE
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
  template: `
    <div class="app-layout">
      <!-- Votre sidebar sophistiquée remplace la navbar -->
      <app-sidebar></app-sidebar>
      
      <!-- Zone de contenu principal -->
      <main class="main-content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--gray-50);
      position: relative;
      width: 100%;
    }

    .main-content {
      flex: 1;
      transition: margin-left 0.3s ease;
      overflow-x: hidden;
      min-height: 100vh;
      

      
      /* Mobile - pas de marge */
      @media (max-width: 768px) {
        margin-left: 0;
        width: 100%;
      }
    }

    .content-wrapper {
background : #1da460;
      max-width: 100%;
      min-height: calc(100vh - 4rem);
      
      @media (max-width: 768px) {
        min-height: calc(100vh - 2rem);
      }
    }

    /* Assurer la compatibilité complète */
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class LayoutComponent implements OnInit {
  
  constructor() {}

  ngOnInit(): void {
    console.log('Layout with Sidebar initialized');
  }
}