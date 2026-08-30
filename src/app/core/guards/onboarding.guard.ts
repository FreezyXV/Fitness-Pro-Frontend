// onboarding.guard.ts - Redirige vers le parcours d'entree au premier lancement.
//
// Place sur les routes protegees, apres AuthGuard : on ne demande son objectif
// d'entrainement qu'a quelqu'un de connecte.
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { OnboardingService } from '@app/services/onboarding.service';

export const OnboardingGuard: CanActivateFn = (route, state) => {
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  if (onboarding.isComplete()) return true;

  // returnUrl : l'utilisateur qui visait une page precise y revient une fois
  // le parcours termine, au lieu d'atterrir systematiquement sur le dashboard.
  router.navigate(['/onboarding'], { queryParams: { returnUrl: state.url } });
  return false;
};
