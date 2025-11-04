// src/app/auth/login/login.component.ts - CORRECTION SANCTUM
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@app/services/auth.service';
import { NotificationUtils } from '@shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';
  showPassword = false;
  
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Vérification simple de l'authentification
    if (this.authService.isAuthenticated) {
      console.log('User already authenticated, redirecting...');
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;

    if (errors['required']) {
      switch(fieldName) {
        case 'email': return 'L\'email est obligatoire';
        case 'password': return 'Le mot de passe est obligatoire';
        default: return 'Ce champ est obligatoire';
      }
    }

    if (errors['email']) return 'Veuillez entrer un email valide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;

    return 'Champ invalide';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password, rememberMe } = this.loginForm.value;

    console.log('🔐 LoginComponent: Submitting login for:', email);

    this.subscriptions.add(
      this.authService.login({ email, password, rememberMe }).subscribe({
        next: (authResponse) => {
          this.isLoading = false;
          console.log('✅ LoginComponent: Login successful');

          // Immediate navigation after successful login
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.getErrorMessage(error);
          console.error('❌ LoginComponent: Login error:', error);

          // Clear password on error
          this.loginForm.patchValue({ password: '' });

          // Focus back to email field for retry
          const emailField = document.querySelector('input[type="email"]') as HTMLInputElement;
          emailField?.focus();
        }
      })
    );
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  private getErrorMessage(error: any): string {
    console.error('LoginComponent: Error details:', error);

    if (error.message) {
      return error.message;
    }

    if (error.error?.errors) {
      const errors = error.error.errors;
      if (errors.email) {
        return errors.email[0];
      }
      if (errors.password) {
        return errors.password[0];
      }
    }

    if (error.error?.message) {
      return error.error.message;
    }

    switch (error.status) {
      case 401:
        return 'Email ou mot de passe incorrect';
      case 422:
        return 'Données de connexion invalides';
      case 429:
        return 'Trop de tentatives de connexion. Veuillez réessayer plus tard.';
      case 0:
        return 'Erreur de connexion. Vérifiez votre connexion internet.';
      case 404:
        return 'Service de connexion non trouvé. Contactez l\'administrateur.';
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      default:
        return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    }
  }

  onForgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    
    if (!email) {
      NotificationUtils.warning('Veuillez entrer votre email d\'abord');
      return;
    }

    if (this.loginForm.get('email')?.invalid) {
      NotificationUtils.error('Veuillez entrer un email valide');
      return;
    }

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        NotificationUtils.success('Un email de réinitialisation a été envoyé');
      },
      error: (error) => {
        NotificationUtils.error(error.message || 'Erreur lors de l\'envoi de l\'email');
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: this.returnUrl }
    });
  }
}
