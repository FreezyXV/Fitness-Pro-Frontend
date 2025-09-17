// profile.component.ts - Clean and Updated Profile Component
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, of, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { UserService } from '../services/user.service';
import { User, PasswordChangeRequest } from '../Interfaces/app.interfaces';

// BMI Utility Class
class BMIUtils {
  static calculate(height: number, weight: number): number {
    if (!height || !weight || height <= 0 || weight <= 0) {
      throw new Error('Invalid height or weight');
    }
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  static getStatus(bmi: number): string {
    if (bmi < 18.5) return 'Insuffisance pondérale';
    if (bmi < 25) return 'Poids normal';
    if (bmi < 30) return 'Surpoids';
    return 'Obésité';
  }

  static getColor(bmi: number): string {
    if (bmi < 18.5) return '#3b82f6'; // underweight - blue
    if (bmi < 25) return '#10b981';   // normal - green
    if (bmi < 30) return '#f59e0b';   // overweight - orange
    return '#ef4444';                  // obese - red
  }

  static getRecommendation(bmi: number): string {
    if (bmi < 18.5) {
      return 'Votre IMC indique une insuffisance pondérale. Consultez un professionnel de santé pour un plan nutritionnel adapté.';
    }
    if (bmi < 25) {
      return 'Félicitations ! Votre IMC est dans la fourchette normale. Continuez à maintenir un mode de vie sain.';
    }
    if (bmi < 30) {
      return 'Votre IMC indique un surpoids. Une alimentation équilibrée et de l\'exercice régulier peuvent vous aider.';
    }
    return 'Votre IMC indique une obésité. Il est recommandé de consulter un professionnel de santé pour un suivi personnalisé.';
  }
}

// Form Utility Class
class FormUtils {
  static parseUserName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  }

  static formatUserName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push('8 caractères minimum');
    if (!/[A-Z]/.test(password)) errors.push('Une majuscule');
    if (!/[a-z]/.test(password)) errors.push('Une minuscule');
    if (!/\d/.test(password)) errors.push('Un chiffre');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Un caractère spécial');

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(60px) scale(0.92)' }),
        animate('600ms cubic-bezier(0.16, 1, 0.3, 1)', 
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        )
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'scale(1)' })
        )
      ])
    ])
  ]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // User data - initialized empty, loaded from API
  user: User | null = null;
  
  // Component state
  activeTab: 'personal' | 'health' | 'security' | 'preferences' = 'personal';
  editMode = false;
  isLoading = false;
  showSuccessMessage = false;
  successMessage = '';
  
  // Forms
  personalForm!: FormGroup;
  healthForm!: FormGroup;
  passwordForm!: FormGroup;
  
  // Configuration
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  genderOptions = [
    { value: 'male', label: 'Homme' },
    { value: 'female', label: 'Femme' },
    { value: 'other', label: 'Autre' }
  ];

  activityLevelOptions = [
    { value: 'sedentary', label: 'Sédentaire' },
    { value: 'lightly_active', label: 'Légèrement actif' },
    { value: 'moderately_active', label: 'Modérément actif' },
    { value: 'very_active', label: 'Très actif' },
    { value: 'extremely_active', label: 'Extrêmement actif' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Handle keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          if (this.editMode) {
            this.saveCurrentTab();
          }
          break;
        case 'e':
          event.preventDefault();
          this.toggleEditMode();
          break;
      }
    }

    // Handle escape key to cancel edit
    if (event.key === 'Escape' && this.editMode) {
      this.cancelEdit();
    }
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private initializeForms(): void {
    this.personalForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      dateOfBirth: [''],
      gender: [''],
      bloodGroup: [''],
      location: [''],
      bio: [''],
      activityLevel: ['']
    });

    this.healthForm = this.formBuilder.group({
      height: ['', [Validators.required, Validators.min(100), Validators.max(250)]],
      weight: ['', [Validators.required, Validators.min(30), Validators.max(300)]]
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: AbstractControl) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // =============================================
  // DATA LOADING
  // =============================================

  private loadUserProfile(): void {
    this.isLoading = true;
    
    this.userService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.log('Profile loaded:', user);
          this.user = user;
          this.populateForms();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load profile:', error);
          this.isLoading = false;
          // Keep user as null to show empty form
        }
      });
  }

  private populateForms(): void {
    if (!this.user) return;

    const { firstName, lastName } = FormUtils.parseUserName(this.user.name || '');

    this.personalForm.patchValue({
      firstName: firstName || '',
      lastName: lastName || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      dateOfBirth: this.user.dateOfBirth ? this.formatDateForInput(this.user.dateOfBirth) : '',
      gender: this.user.gender || '',
      bloodGroup: this.user.bloodGroup || '',
      location: this.user.location || '',
      bio: this.user.bio || '',
      activityLevel: this.user.activityLevel || ''
    });

    this.healthForm.patchValue({
      height: this.user.height || '',
      weight: this.user.weight || ''
    });

    this.passwordForm.reset();
  }

  private formatDateForInput(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  // =============================================
  // NAVIGATION
  // =============================================

  switchToTab(tab: 'personal' | 'health' | 'security' | 'preferences'): void {
    if (this.editMode) {
      this.editMode = false;
      this.populateForms(); // to reset any changes
    }
    this.activeTab = tab;
  }

  // =============================================
  // BMI CALCULATIONS
  // =============================================
// Add this method to your profile.component.ts file in the BMI CALCULATIONS section

getBMIPosition(): number {
  if (!this.user?.height || !this.user?.weight) {
    return 0;
  }
  
  try {
    const bmi = BMIUtils.calculate(this.user.height, this.user.weight);
    
    // Position calculation based on BMI ranges
    // BMI < 18.5 = underweight (0-25% of bar)
    // BMI 18.5-24.9 = normal (25-50% of bar)  
    // BMI 25-29.9 = overweight (50-75% of bar)
    // BMI >= 30 = obese (75-100% of bar)
    
    if (bmi < 18.5) {
      // Underweight: 0-25% position
      return Math.max(0, Math.min(25, (bmi / 18.5) * 25));
    } else if (bmi < 25) {
      // Normal: 25-50% position
      return 25 + ((bmi - 18.5) / (25 - 18.5)) * 25;
    } else if (bmi < 30) {
      // Overweight: 50-75% position
      return 50 + ((bmi - 25) / (30 - 25)) * 25;
    } else {
      // Obese: 75-100% position
      return Math.min(100, 75 + ((bmi - 30) / 10) * 25);
    }
  } catch (error) {
    console.error('BMI position calculation error:', error);
    return 0;
  }
}
  calculateBMI(): string {
    if (!this.user || !this.user.height || !this.user.weight || this.user.height <= 0 || this.user.weight <= 0) {
      return '-';
    }
    
    try {
      const bmi = BMIUtils.calculate(this.user.height, this.user.weight);
      return bmi.toFixed(1);
    } catch (error) {
      return '-';
    }
  }

  getBMIStatus(): string {
    if (!this.user || !this.user.height || !this.user.weight) {
      return 'Non calculé';
    }
    
    try {
      const bmi = BMIUtils.calculate(this.user.height, this.user.weight);
      return BMIUtils.getStatus(bmi);
    } catch (error) {
      return 'Non calculé';
    }
  }

  getBMIColor(): string {
    if (!this.user || !this.user.height || !this.user.weight) {
      return '#6b7280';
    }
    
    try {
      const bmi = BMIUtils.calculate(this.user.height, this.user.weight);
      return BMIUtils.getColor(bmi);
    } catch (error) {
      return '#6b7280';
    }
  }

  getBMIRecommendation(): string {
    const bmiStr = this.calculateBMI();
    if (bmiStr === '-') {
      return 'Renseignez votre taille et poids pour obtenir des recommandations personnalisées.';
    }
    
    const bmi = parseFloat(bmiStr);
    if (isNaN(bmi)) {
      return 'Données insuffisantes pour calculer l\'IMC.';
    }
    
    return BMIUtils.getRecommendation(bmi);
  }

  // =============================================
  // AGE CALCULATION
  // =============================================

  calculateAge(): number | null {
    if (!this.user || !this.user.dateOfBirth) return null;
    
    try {
      const birthDate = new Date(this.user.dateOfBirth);
      if (isNaN(birthDate.getTime())) return null;
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age >= 0 && age <= 150 ? age : null;
    } catch (error) {
      return null;
    }
  }

  getMembershipDuration(): number {
    if (!this.user || !this.user.createdAt) return 4; // Default fallback
    
    try {
      const createdDate = new Date(this.user.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 4;
    }
  }

  // =============================================
  // EDIT MODE
  // =============================================

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  cancelEdit(): void {
    if (this.editMode) {
      const hasChanges = this.hasUnsavedChanges();
      if (hasChanges) {
        const confirmCancel = confirm('Annuler les modifications non sauvegardées?');
        if (!confirmCancel) return;
      }
    }
    
    this.editMode = false;
    this.populateForms();
  }

  private hasUnsavedChanges(): boolean {
    if (!this.editMode) return false;
    switch (this.activeTab) {
      case 'personal':
        return this.personalForm.dirty;
      case 'health':
        return this.healthForm.dirty;
      case 'security':
        return this.passwordForm.dirty;
      default:
        return false;
    }
  }

  private saveCurrentTab(): void {
    switch (this.activeTab) {
      case 'personal':
        this.savePersonalInfo();
        break;
      case 'health':
        this.saveHealthInfo();
        break;
      case 'security':
        this.changePassword();
        break;
    }
  }

  // =============================================
  // FORM SUBMISSIONS
  // =============================================

  savePersonalInfo(): void {
    if (this.personalForm.invalid) {
      this.markFormGroupTouched(this.personalForm);
      this.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.isLoading = true;
    
    const formValue = this.personalForm.value;
    
    // Prepare update data
    const updateData: any = {};
    
    if (formValue.firstName?.trim() && formValue.lastName?.trim()) {
      updateData.name = FormUtils.formatUserName(
        formValue.firstName.trim(), 
        formValue.lastName.trim()
      );
    }
    
    if (formValue.email?.trim()) {
      updateData.email = formValue.email.trim().toLowerCase();
    }
    
    if (formValue.phone?.trim()) {
      updateData.phone = formValue.phone.trim();
    }

    if (formValue.dateOfBirth) {
      updateData.dateOfBirth = formValue.dateOfBirth;
    }

    if (formValue.gender !== undefined) {
      updateData.gender = formValue.gender;
    }
    
    if (formValue.bloodGroup !== undefined) {
      updateData.bloodGroup = formValue.bloodGroup;
    }
    
    if (formValue.location?.trim()) {
      updateData.location = formValue.location.trim();
    }
    
    if (formValue.bio?.trim()) {
      updateData.bio = formValue.bio.trim();
    }

    if (formValue.activityLevel !== undefined) {
      updateData.activityLevel = formValue.activityLevel;
    }

    // Call API
    this.userService.updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          console.log('Personal info updated:', updatedUser);
          this.user = updatedUser;
          this.populateForms();
          this.isLoading = false;
          this.editMode = false;
          this.showSuccess('Informations personnelles mises à jour avec succès');
        },
        error: (error) => {
          console.error('Failed to update personal info:', error);
          this.isLoading = false;
          this.showError('Erreur lors de la mise à jour des informations personnelles');
        }
      });
  }

  saveHealthInfo(): void {
    if (this.healthForm.invalid) {
      this.markFormGroupTouched(this.healthForm);
      this.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.isLoading = true;
    
    const formValue = this.healthForm.value;
    
    // Prepare update data
    const updateData: any = {};
    
    if (formValue.height && parseFloat(formValue.height) > 0) {
      updateData.height = parseFloat(formValue.height);
    }
    
    if (formValue.weight && parseFloat(formValue.weight) > 0) {
      updateData.weight = parseFloat(formValue.weight);
    }

    // Call API
    this.userService.updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          console.log('Health info updated:', updatedUser);
          this.user = updatedUser;
          this.populateForms();
          this.isLoading = false;
          this.editMode = false;
          this.showSuccess('Données de santé mises à jour avec succès');
        },
        error: (error) => {
          console.error('Failed to update health info:', error);
          this.isLoading = false;
          this.showError('Erreur lors de la mise à jour des données de santé');
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      this.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.isLoading = true;
    
    const formValue = this.passwordForm.value;
    const passwordData: PasswordChangeRequest = {
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword,
      confirmPassword: formValue.confirmPassword
    };

    this.userService.changePassword(passwordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Password changed:', result);
          this.isLoading = false;
          this.passwordForm.reset();
          this.showSuccess('Mot de passe modifié avec succès');
        },
        error: (error) => {
          console.error('Failed to change password:', error);
          this.isLoading = false;
          this.showError('Erreur lors du changement de mot de passe');
        }
      });
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string | null {
    const field = form.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;

    if (errors['required']) return 'Ce champ est obligatoire';
    if (errors['email']) return 'Veuillez entrer un email valide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères`;
    if (errors['min']) return `Valeur minimum: ${errors['min'].min}`;
    if (errors['max']) return `Valeur maximum: ${errors['max'].max}`;
    if (errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas';

    return 'Champ invalide';
  }

  // =============================================
  // NOTIFICATION METHODS
  // =============================================

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 4000);
  }

  private showError(message: string): void {
    console.error('Error:', message);
    alert(message); // Replace with proper notification system
  }


  // =============================================
  // PASSWORD STRENGTH
  // =============================================

  getPasswordStrength(): { score: number; label: string; color: string; requirements: any[] } {
    const password = this.passwordForm.get('newPassword')?.value || '';
    const validation = FormUtils.validatePassword(password);
    
    let label = '';
    let color = '';
    const score = Math.max(0, 5 - validation.errors.length);

    switch (score) {
      case 5:
        label = 'Excellent';
        color = '#059669';
        break;
      case 4:
        label = 'Très fort';
        color = '#16a34a';
        break;
      case 3:
        label = 'Fort';
        color = '#22c55e';
        break;
      case 2:
        label = 'Moyen';
        color = '#eab308';
        break;
      case 1:
        label = 'Faible';
        color = '#f59e0b';
        break;
      default:
        label = 'Très faible';
        color = '#ef4444';
    }

    const requirements = [
      { label: 'Au moins 8 caractères', met: password.length >= 8 },
      { label: 'Une majuscule', met: /[A-Z]/.test(password) },
      { label: 'Une minuscule', met: /[a-z]/.test(password) },
      { label: 'Un chiffre', met: /\d/.test(password) },
      { label: 'Un caractère spécial', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
    ];

    return { score, label, color, requirements };
  }

  // =============================================
  // ACTIONS
  // =============================================

  exportData(): void {
    this.isLoading = true;

    setTimeout(() => {
      try {
        if (!this.user) {
          this.showError('Aucune donnée utilisateur disponible pour l\'export');
          this.isLoading = false;
          return;
        }

        const exportData = {
          user: {
            ...this.user,
            email_verified_at: undefined
          },
          healthMetrics: {
            bmi: this.calculateBMI(),
            bmiStatus: this.getBMIStatus(),
            estimatedAge: this.calculateAge()
          },
          exportInfo: {
            exportDate: new Date().toISOString(),
            exportVersion: '1.0',
            membershipDuration: this.getMembershipDuration()
          }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `fitnesspro-profil-${this.user.name?.replace(/\s+/g, '-').toLowerCase() || 'utilisateur'}-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(link.href);
        
        this.isLoading = false;
        this.showSuccess('Données exportées avec succès');
      } catch (error) {
        this.isLoading = false;
        this.showError('Erreur lors de l\'export des données');
      }
    }, 1000);
  }
}