import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { APP_CONFIG, StorageUtils } from '@shared';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        // Log successful responses in dev mode only
        if (
          event instanceof HttpResponse &&
          event.status >= 200 &&
          event.status < 300
        ) {
          // Success response - no action needed
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleError(error, request);
        return throwError(() => error);
      })
    );
  }

  private handleError(
    error: HttpErrorResponse,
    request: HttpRequest<any>
  ): void {
    let errorMessage = 'Une erreur est survenue';

    // Handle different error scenarios
    switch (error.status) {
      case 0:
        // Network error
        errorMessage = 'Problème de connexion réseau';
        break;

      case 401:
        // Unauthorized - redirect to login
        errorMessage = 'Session expirée, veuillez vous reconnecter';
        this.handleUnauthorized();
        break;

      case 403:
        // Forbidden
        errorMessage = 'Accès refusé';
        break;

      case 404:
        // Not found
        errorMessage = 'Ressource non trouvée';
        break;

      case 422:
        // Validation error
        if (error.error?.errors) {
          const validationErrors = Object.values(error.error.errors).flat();
          errorMessage = validationErrors.join(', ');
        } else {
          errorMessage = error.error?.message || 'Erreur de validation';
        }
        break;

      case 429:
        // Rate limit
        errorMessage = 'Trop de requêtes, veuillez patienter';
        break;

      case 500:
        // Server error
        errorMessage = 'Erreur serveur interne';
        break;

      case 503:
        // Service unavailable
        errorMessage = 'Service temporairement indisponible';
        break;

      default:
        // Extract error message from response
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else {
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
        }
    }

    // Log error for non-silent endpoints
    if (!this.isSilentEndpoint(request.url)) {
      console.error(errorMessage);
    }
  }

  private handleUnauthorized(): void {
    // Clear stored authentication data
    StorageUtils.removeItem(APP_CONFIG.TOKEN_KEY);
    StorageUtils.removeItem(APP_CONFIG.USER_KEY);

    // Redirect to login page
    this.router.navigate(['/login']);
  }

  private isSilentEndpoint(url: string): boolean {
    // Endpoints that shouldn't show error notifications
    const silentEndpoints = ['/api/auth/me', '/api/test', '/api/health'];

    return silentEndpoints.some((endpoint) => url.includes(endpoint));
  }
}
