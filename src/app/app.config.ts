// app.config.ts - VERSION COMPLÈTE AVEC APP_INITIALIZER
import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler, Injectable, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
// NoopAnimationsModule et non BrowserAnimationsModule.
//
// Les feuilles de style n'ont plus aucune animation, mais huit composants
// declarent encore des animations ANGULAR (`trigger('modalAnimation')`,
// `slideInOut`, `staggerAnimation`, `cardAnimation`…). Celles-ci passent par
// la Web Animations API et non par des regles CSS : la couche de suppression
// de styles.scss ne les atteint pas, elles continueraient a faire glisser les
// modales et apparaitre les cartes en cascade.
//
// Le module Noop fournit la meme API — les `@trigger` des gabarits restent
// valides et aucun composant n'est a modifier — mais applique l'etat final
// immediatement, sans transition.
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { routes } from './app.routes';
import { authInterceptor } from '@app/services/auth.interceptor';
import { AuthService } from '@app/services/auth.service';

// Custom Error Handler
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('🚨 Global error handler:', error);

    // Handle specific types of errors
    if (error?.message?.includes('Cannot read properties of null')) {
      console.error('Null reference error detected:', error);
      
      if (error.stack) {
        console.group('🔍 Error Details');
        console.log('Stack trace:', error.stack);
        console.log('This appears to be a null reference error in a component.');
        console.log('Check component initialization and property access.');
        console.groupEnd();
      }
    }

    // Handle router errors
    if (error?.message?.includes('router') || error?.message?.includes('navigation')) {
      console.error('Router error detected:', error);
    }

    // Handle HTTP errors
    if (error?.status) {
      console.error('HTTP error detected:', error);
    }

    // In development, show additional debugging info
    if (typeof window !== 'undefined' && (window as any)['ng']) {
      console.group('📊 Angular Debug Info');
      console.log('Angular version:', (window as any)['ng']?.getVersion?.() || 'Unknown');
      console.log('Environment:', 'development');
      console.groupEnd();
    }

    console.error('Original error:', error);
  }
}

// 🔥 AUTH INITIALIZER FUNCTION - AJOUT CRITIQUE
export function initializeAuth(authService: AuthService): () => Promise<boolean> {
  return () => {
    return new Promise((resolve) => {
      console.log('🚀 APP_INITIALIZER: Starting auth initialization');
      
      try {
        // Check stored credentials
        const storedToken = authService.getStoredToken();
        const storedUser = authService.getStoredUser();
        
        console.log('📦 APP_INITIALIZER: Stored credentials check:', {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
          userEmail: storedUser?.email || 'none'
        });

        if (storedToken && storedUser) {
          // Restore session from storage
          console.log('🔄 APP_INITIALIZER: Restoring session from storage');
          
          // Restore in memory
          authService.tokenSubject.next(storedToken);
          authService.currentUserSubject.next(storedUser);
          
          // Verify token with server (optional - can fail silently)
          authService.me().subscribe({
            next: (user) => {
              console.log('✅ APP_INITIALIZER: Token verified, user updated:', user.name);
              authService.isInitializedSubject.next(true);
              resolve(true);
            },
            error: (error) => {
              console.warn('⚠️ APP_INITIALIZER: Token verification failed:', error.message);
              
              // Si erreur 401, clear session, sinon garder les données en cache
              if (error.status === 401 || error.message?.includes('401')) {
                console.log('🗑️ APP_INITIALIZER: Clearing invalid session');
                authService.tokenSubject.next(null);
                authService.currentUserSubject.next(null);
                authService.removeToken();
              } else {
                console.log('🔄 APP_INITIALIZER: Network error, keeping cached session');
                // Keep the restored session for offline usage
              }
              
              authService.isInitializedSubject.next(true);
              resolve(true); // Continue app startup
            }
          });
        } else {
          // No stored credentials
          console.log('ℹ️ APP_INITIALIZER: No stored credentials found');
          authService.isInitializedSubject.next(true);
          resolve(true);
        }
      } catch (error) {
        console.error('❌ APP_INITIALIZER: Auth initialization error:', error);
        authService.isInitializedSubject.next(true);
        resolve(true); // Always resolve to prevent app startup failure
      }
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Custom error handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },

    // AUTH INITIALIZER - RÉACTIVÉ
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    },

    // Zone change detection optimization
    provideZoneChangeDetection({ 
      eventCoalescing: true,
      runCoalescing: true 
    }),

    // Router with preloading strategy and error handling
    provideRouter(
      routes, 
      withPreloading(PreloadAllModules),
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      })
    ),

    // HttpClient with functional interceptor
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    // Essential modules with error handling
    importProvidersFrom(
      NoopAnimationsModule,
      FormsModule,
      ReactiveFormsModule
    )
  ]
};
