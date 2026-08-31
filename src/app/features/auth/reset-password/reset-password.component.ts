import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';


@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IconComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  /** Formulaire affiche sans token : demande d'un lien de reinitialisation. */
  requestForm: FormGroup;
  /** Formulaire affiche avec un token valide : choix du nouveau mot de passe. */
  resetForm: FormGroup;

  isLoading = false;
  showNewPassword = false;
  showConfirmPassword = false;
  resetToken: string | null = null;

  linkRequested = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.requestForm = this.initializeRequestForm();
    this.resetForm = this.initializeResetForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated) {
      this.router.navigateByUrl('/dashboard');
    }

    this.route.queryParamMap.subscribe(params => {
      this.resetToken = params.get('token');
      const email = params.get('email');

      if (email) {
        this.requestForm.patchValue({ email });
        this.resetForm.patchValue({ email });
      }
    });
  }

  private initializeRequestForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private initializeResetForm(): FormGroup {
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

  /**
   * Un mot de passe ne peut etre change que via un token recu par email.
   * Sans token, la page se limite a demander l'envoi de ce lien.
   */
  get isTokenMode(): boolean {
    return !!this.resetToken;
  }

  private get activeForm(): FormGroup {
    return this.isTokenMode ? this.resetForm : this.requestForm;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.activeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.activeForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.activeForm.get(fieldName);
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

  /** Sans token : demande l'envoi d'un lien de reinitialisation. */
  onRequestLink(): void {
    if (this.requestForm.invalid) {
      this.markAllFieldsAsTouched(this.requestForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.authService.requestPasswordReset(this.requestForm.value.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.linkRequested = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Impossible d\'envoyer le lien de réinitialisation.';
      }
    });
  }

  /** Avec token : applique le nouveau mot de passe. */
  onSubmit(): void {
    if (!this.resetToken) {
      this.errorMessage = 'Lien de réinitialisation manquant ou invalide.';
      return;
    }

    if (this.resetForm.invalid) {
      this.markAllFieldsAsTouched(this.resetForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password, passwordConfirmation } = this.resetForm.value;

    this.authService.resetPassword(this.resetToken, email, password, passwordConfirmation).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Le lien est invalide ou a expiré. Demandez-en un nouveau.';
      }
    });
  }

  private markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
