import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationUtils } from '../../shared/index';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.resetForm = this.initializeForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      passwordConfirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup): {[key: string]: boolean} | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('passwordConfirmation')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.resetForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;

    if (errors['required']) {
      switch(fieldName) {
        case 'email': return 'L\'email est obligatoire';
        case 'password': return 'Le mot de passe est obligatoire';
        case 'passwordConfirmation': return 'La confirmation est obligatoire';
        default: return 'Ce champ est obligatoire';
      }
    }

    if (errors['email']) return 'Veuillez entrer un email valide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['pattern']) return 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial';

    return 'Champ invalide';
  }

  getFormError(): string | null {
    if (this.resetForm.errors?.['passwordMismatch']) {
      return 'Les mots de passe ne correspondent pas';
    }
    return null;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;

    const { email, password, passwordConfirmation } = this.resetForm.value;

    // Direct password reset without token (administrative reset)
    // In a real scenario, you would need admin privileges or some verification
    this.authService.adminResetPassword(email, password, passwordConfirmation).subscribe({
      next: () => {
        this.isLoading = false;
        NotificationUtils.success('Mot de passe réinitialisé avec succès !');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        NotificationUtils.error(error.message || 'Erreur lors de la réinitialisation');
        console.error('❌ Reset error:', error);
      }
    });
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.resetForm.controls).forEach(key => {
      this.resetForm.get(key)?.markAsTouched();
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
