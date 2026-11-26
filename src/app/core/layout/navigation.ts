import { IconName } from '@app/shared/components/icon/icon.component';

export interface NavDestination {
  label: string;
  route: string;
  icon: IconName;
}

export const primaryNavigation: readonly NavDestination[] = [
  { label: 'Accueil', route: '/dashboard', icon: 'home' },
  { label: 'Séances', route: '/workouts', icon: 'dumbbell' },
  { label: 'Nutrition', route: '/nutrition', icon: 'utensils' },
  { label: 'Progression', route: '/progress', icon: 'trending' },
];

export const secondaryNavigation: readonly NavDestination[] = [
  { label: 'Exercices', route: '/exercises', icon: 'book' },
  { label: 'Calendrier', route: '/calendar', icon: 'calendar' },
  { label: 'Objectifs', route: '/goals', icon: 'target' },
  { label: 'Défis', route: '/challenges', icon: 'trophy' },
];

export const profileDestination: NavDestination = { label: 'Profil', route: '/profile', icon: 'user' };
