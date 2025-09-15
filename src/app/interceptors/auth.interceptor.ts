import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

import { APP_CONFIG, StorageUtils, AuthResponse } from '../shared';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth for public endpoints
    if (this.isPublicEndpoint(request.url)) {
      return next.handle(request);
    }

    // Add common headers
    request = this.addHeaders(request);

    // Add authorization header if token exists
    const token = this.authService.getStoredToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addHeaders(request: HttpRequest<any>): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔒 401 Unauthorized - Clearing session and redirecting to login');

    // Clear session and redirect to login
    this.authService.logout().subscribe();
    this.router.navigate(['/login']);

    return throwError(() => new Error('Unauthorized - please login again'));
  }

  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      `${APP_CONFIG.API_URL}/auth/login`,
      `${APP_CONFIG.API_URL}/auth/register`,
      `${APP_CONFIG.API_URL}/auth/password/email`,
      `${APP_CONFIG.API_URL}/auth/password/reset`,
      `${APP_CONFIG.API_URL}/exercises`,
      `${APP_CONFIG.API_URL}/test`,
      `${APP_CONFIG.API_URL}/health`,
      `${APP_CONFIG.API_URL}/version`,
    ];

    return publicEndpoints.some(endpoint => url.startsWith(endpoint));
  }
}