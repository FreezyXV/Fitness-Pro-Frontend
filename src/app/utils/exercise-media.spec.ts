// Tests du resolveur de medias. Une erreur ici casse toutes les videos de
// l'app sans qu'aucune compilation n'echoue.
import { toPublicId, videoUrl, posterUrl, hasHostedMedia, isLegacyAssetPath } from './exercise-media';

describe('exercise-media', () => {
  it('extrait l identifiant depuis un ancien chemin local', () => {
    expect(toPublicId('/assets/ExercicesVideos/PushUp.mp4')).toBe('PushUp');
  });

  it('accepte un nom de fichier nu', () => {
    expect(toPublicId('Pull-Up-Wide-Grip.mov')).toBe('Pull-Up-Wide-Grip');
  });

  it('accepte un identifiant deja propre', () => {
    expect(toPublicId('Superman')).toBe('Superman');
  });

  it('ignore les URL externes', () => {
    expect(toPublicId('https://example.com/video.mp4')).toBeNull();
    expect(videoUrl('https://example.com/video.mp4')).toBe('https://example.com/video.mp4');
  });

  it('gere l absence de reference', () => {
    expect(toPublicId(null)).toBeNull();
    expect(toPublicId('')).toBeNull();
    expect(toPublicId('   ')).toBeNull();
    expect(videoUrl(null)).toBe('');
    expect(posterUrl(null)).toBe('');
  });

  it('construit une URL de video transcodee', () => {
    const url = videoUrl('/assets/ExercicesVideos/PushUp.mp4', 'detail');
    expect(url).toContain('res.cloudinary.com');
    expect(url).toContain('f_auto,q_auto,w_720');
    expect(url).toContain('/PushUp.mp4');
  });

  it('demande une largeur plus petite pour une vignette', () => {
    expect(videoUrl('PushUp', 'card')).toContain('w_480');
    expect(videoUrl('PushUp', 'detail')).toContain('w_720');
  });

  it('construit un poster sur la premiere frame', () => {
    const url = posterUrl('PushUp', 'card');
    expect(url).toContain('so_0');
    expect(url).toContain('/PushUp.jpg');
    expect(url).toContain('w_480');
  });

  it('echappe les identifiants contenant des caracteres speciaux', () => {
    expect(videoUrl('90-90-HIP-CROSSOVER.mp4')).toContain('90-90-HIP-CROSSOVER.mp4');
  });

  it('reconnait la presence d un media et les chemins herites', () => {
    expect(hasHostedMedia('/assets/ExercicesVideos/Crunch.mp4')).toBeTrue();
    expect(hasHostedMedia(null)).toBeFalse();
    expect(isLegacyAssetPath('/assets/ExercicesVideos/Crunch.mp4')).toBeTrue();
    expect(isLegacyAssetPath('Crunch')).toBeFalse();
  });
});
