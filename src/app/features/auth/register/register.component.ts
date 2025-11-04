// src/app/auth/register/register.component.ts - VERSION CORRIGÉE
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { RegisterRequest } from '@shared';

interface PasswordRequirement {
  label: string;
  isValid: boolean;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';
  showPassword = false;
  showPasswordRequirements = false;
  passwordStrength: 'weak' | 'medium' | 'strong' | null = null;

  passwordRequirements: PasswordRequirement[] = [
    { label: 'Au moins 8 caractères', isValid: false },
    { label: 'Une lettre majuscule', isValid: false },
    { label: 'Un chiffre', isValid: false }
  ];

  // Template compatibility
  passwordChecks = {
    length: false,
    uppercase: false,
    number: false
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  /**
   * Initialise le formulaire d'inscription
   */
  private initializeForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      passwordConfirmation: ['', [
        Validators.required
      ]],
      acceptTerms: [false, [
        Validators.requiredTrue
      ]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  /**
   * Validateur personnalisé pour vérifier que les mots de passe correspondent
   */
  passwordMatchValidator(form: AbstractControl): { [key: string]: any } | null {
    const password = form.get('password');
    const confirmPassword = form.get('passwordConfirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    } else if (confirmPassword?.errors?.['mismatch']) {
      delete confirmPassword.errors['mismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  /**
   * Bascule la visibilité du mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Vérifie si un champ est invalide et touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Vérifie si un champ est valide et touché
   */
  isFieldValid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  /**
   * Obtient le message d'erreur pour un champ
   */
  getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;

    if (errors['required']) {
      switch(fieldName) {
        case 'firstName': return 'Le prénom est obligatoire';
        case 'lastName': return 'Le nom est obligatoire';
        case 'email': return 'L\'email est obligatoire';
        case 'password': return 'Le mot de passe est obligatoire';
        case 'passwordConfirmation': return 'La confirmation est obligatoire';
        default: return 'Ce champ est obligatoire';
      }
    }

    if (errors['email']) return 'Veuillez entrer un email valide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['requiredTrue']) return 'Vous devez accepter les conditions d\'utilisation';
    if (errors['mismatch']) return 'Les mots de passe ne correspondent pas';

    return 'Champ invalide';
  }

  /**
   * Vérifie la force du mot de passe
   */
  checkPasswordStrength(): void {
    const password = this.registerForm.get('password')?.value || '';
    this.showPasswordRequirements = !!password;

    // Mise à jour des exigences
    this.passwordRequirements[0].isValid = password.length >= 8;
    this.passwordRequirements[1].isValid = /[A-Z]/.test(password);
    this.passwordRequirements[2].isValid = /\d/.test(password);

    // Template compatibility - update passwordChecks
    this.passwordChecks.length = password.length >= 8;
    this.passwordChecks.uppercase = /[A-Z]/.test(password);
    this.passwordChecks.number = /\d/.test(password);

    // Calcul de la force
    const validRequirements = this.passwordRequirements.filter(req => req.isValid).length;
    
    if (validRequirements === 3) {
      this.passwordStrength = 'strong';
    } else if (validRequirements === 2) {
      this.passwordStrength = 'medium';
    } else if (validRequirements === 1) {
      this.passwordStrength = 'weak';
    } else {
      this.passwordStrength = null;
    }
  }

  /**
   * Retourne l'icône correspondant à la force du mot de passe
   */
  getPasswordStrengthIcon(): string {
    switch (this.passwordStrength) {
      case 'weak': return '!';
      case 'medium': return '?';
      case 'strong': return '✓';
      default: return '';
    }
  }

  /**
   * Gère la soumission du formulaire
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = this.registerForm.value;
    const registerData: RegisterRequest = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      passwordConfirmation: formData.passwordConfirmation,
      acceptTerms: formData.acceptTerms
    };
    
    console.log('📝 RegisterComponent: Submitting registration:', {
      ...registerData,
      password: '[HIDDEN]',
      passwordConfirmation: '[HIDDEN]'
    });

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading = false;
        console.log('✅ RegisterComponent: Registration successful, redirecting to:', this.returnUrl);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
        console.error('❌ RegisterComponent: Registration error:', error);

        // Clear passwords on error
        this.registerForm.patchValue({
          password: '',
          passwordConfirmation: ''
        });

        // Reset password strength
        this.passwordStrength = null;
        this.showPasswordRequirements = false;
      }
    });
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Extrait le message d'erreur approprié
   */
  private getErrorMessage(error: any): string {
    console.error('RegisterComponent: Error details:', error);

    // Handle validation errors from backend
    if (error.error?.errors) {
      const errors = error.error.errors;
      if (errors.email) {
        return errors.email[0];
      }
      if (errors.first_name) {
        return errors.first_name[0];
      }
      if (errors.last_name) {
        return errors.last_name[0];
      }
      if (errors.password) {
        return errors.password[0];
      }
      if (errors.acceptTerms) {
        return errors.acceptTerms[0];
      }
    }

    // Handle backend message
    if (error.error?.message) {
      return error.error.message;
    }
    
    // Handle HTTP status codes
    switch (error.status) {
      case 422:
        return 'Données invalides. Veuillez vérifier vos informations.';
      case 409:
        return 'Cette adresse email est déjà utilisée.';
      case 0:
        return 'Erreur de connexion. Vérifiez votre connexion internet.';
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      default:
        return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    }
  }
}
