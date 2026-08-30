// Verifie que la carte d'exercice construit bien ses URLs de media a partir
// du resolveur Cloudinary. C'est le cablage qui remplace l'ancien chemin
// local vers src/assets/ExercicesVideos.
import { ExerciseCardComponent } from './exercise-card.component';
import { Exercise } from '@shared';

describe('ExerciseCardComponent — médias', () => {
  let component: ExerciseCardComponent;

  beforeEach(() => {
    // Le composant n'utilise aucune de ses dependances dans les getters
    // testes ici : on les passe a null plutot que de monter un TestBed
    // complet pour deux chaines de caracteres.
    component = new ExerciseCardComponent(null as any, null as any, null as any);
  });

  function withVideo(videoUrl: string | undefined): void {
    component.exercise = { id: 1, name: 'Pompes', videoUrl } as Exercise;
  }

  it('construit la source video via Cloudinary, en largeur de vignette', () => {
    withVideo('PushUp');
    const src = component.currentVideoSrc;
    expect(src).toContain('res.cloudinary.com');
    expect(src).toContain('f_auto,q_auto,w_480');
    expect(src).toContain('/PushUp.mp4');
  });

  it('accepte encore un ancien chemin local et le redirige', () => {
    withVideo('/assets/ExercicesVideos/Pull-Up.mp4');
    expect(component.currentVideoSrc).toContain('/Pull-Up.mp4');
    expect(component.currentVideoSrc).toContain('res.cloudinary.com');
  });

  it('expose une image d attente sur la premiere frame', () => {
    withVideo('Crunch');
    const poster = component.videoPoster;
    expect(poster).toContain('so_0');
    expect(poster).toContain('/Crunch.jpg');
    expect(poster).toContain('w_480');
  });

  it('laisse passer une URL externe sans la reecrire', () => {
    withVideo('https://i.imgur.com/cuvjCQo.mp4');
    expect(component.currentVideoSrc).toBe('https://i.imgur.com/cuvjCQo.mp4');
    expect(component.videoPoster).toBe('');
  });

  it('ne produit rien quand l exercice n a pas de video', () => {
    withVideo(undefined);
    expect(component.currentVideoSrc).toBe('');
    expect(component.videoPoster).toBe('');
    expect(component.hasVideo).toBeFalse();
  });
});
