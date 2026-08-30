// backend-wake.service.ts - Reveil de l'hebergement gratuit.
//
// Le backend tourne sur un plan Render qui met le conteneur en veille apres
// ~15 minutes sans trafic. La premiere requete qui le reveille met 30 a 50
// secondes. Jusqu'ici l'utilisateur voyait un spinner muet : a la salle, on
// referme l'app bien avant.
//
// Ce service ne rend pas le serveur plus rapide. Il fait deux choses utiles :
//   1. Lancer le reveil le plus tot possible (des le chargement de l'app,
//      en parallele du telechargement des bundles) au lieu d'attendre la
//      premiere action de l'utilisateur.
//   2. Dire la verite pendant l'attente : combien de temps, et pourquoi.
//
// Le vrai correctif reste d'empecher la mise en veille — voir le workflow
// .github/workflows/keep-alive.yml.
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Au-dela de ce delai, on considere que le conteneur etait endormi et on
 * bascule sur l'ecran d'attente explicite. En dessous, l'API repond assez vite
 * pour qu'un spinner ordinaire suffise.
 */
const COLD_START_THRESHOLD_MS = 2500;

/** Duree annoncee a l'utilisateur, calee sur le comportement observe de Render. */
export const EXPECTED_WAKE_SECONDS = 45;

@Injectable({ providedIn: 'root' })
export class BackendWakeService {
  /** Le serveur est endormi et met du temps a repondre. */
  readonly waking = signal(false);

  /** Secondes ecoulees depuis le debut du reveil. */
  readonly elapsed = signal(0);

  /** Le reveil a echoue apres plusieurs tentatives. */
  readonly failed = signal(false);

  /**
   * L'utilisateur a choisi de ne pas attendre. Le ping continue en arriere-plan
   * mais l'ecran ne bloque plus rien : les parties locales de l'app (seance en
   * cours, journal, progression) restent utilisables sans serveur.
   */
  readonly dismissed = signal(false);

  private started = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  /**
   * Lance le reveil. Idempotent : appelable depuis plusieurs endroits sans
   * declencher plusieurs series de requetes.
   */
  warm(): void {
    if (this.started) return;
    this.started = true;

    const startedAt = Date.now();

    // Bascule sur l'ecran d'attente seulement si l'API tarde vraiment : sur un
    // serveur deja chaud, l'utilisateur ne doit rien voir du tout.
    const thresholdHandle = setTimeout(() => {
      this.waking.set(true);
      this.startClock(startedAt);
    }, COLD_START_THRESHOLD_MS);

    this.ping(0)
      .then(() => {
        clearTimeout(thresholdHandle);
        this.stopClock();
        this.waking.set(false);
      })
      .catch(() => {
        clearTimeout(thresholdHandle);
        this.stopClock();
        this.waking.set(false);
        this.failed.set(true);
      });
  }

  /** Referme l'ecran d'attente sans annuler le reveil en cours. */
  dismiss(): void {
    this.dismissed.set(true);
  }

  /** Reessaye apres un echec, depuis l'ecran d'erreur. */
  retry(): void {
    this.dismissed.set(false);
    this.failed.set(false);
    this.started = false;
    this.warm();
  }

  /**
   * Ping avec reprises espacees. `/status` est choisi plutot que `/health`
   * parce qu'il ne touche pas la base : il repond des que PHP est debout,
   * donc il mesure exactement le reveil du conteneur.
   */
  private async ping(attempt: number): Promise<void> {
    const maxAttempts = 12;

    try {
      const response = await fetch(`${environment.apiUrl}/status`, {
        method: 'GET',
        // 'no-store' : une reponse mise en cache par le service worker
        // ferait croire que le serveur est reveille alors qu'il dort encore.
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(String(response.status));
      return;
    } catch (error) {
      if (attempt >= maxAttempts) throw error;

      // 5 s entre deux tentatives : assez espace pour ne pas marteler un
      // conteneur en cours de demarrage, assez court pour repartir aussitot
      // qu'il repond.
      await sleep(5000);
      return this.ping(attempt + 1);
    }
  }

  private startClock(startedAt: number): void {
    this.timer = setInterval(() => {
      this.elapsed.set(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
  }

  private stopClock(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
