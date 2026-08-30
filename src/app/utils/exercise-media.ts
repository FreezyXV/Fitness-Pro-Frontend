// exercise-media.ts - Resolution des medias de demonstration.
//
// Les videos etaient servies depuis src/assets/ExercicesVideos : 1,1 Go
// embarques dans le depot et copies tels quels dans dist. Une fiche exercice
// telechargeait jusqu'a 61 Mo pour montrer une serie de pompes, et le seul
// poids des assets rendait le deploiement intenable.
//
// Elles sont desormais delivrees par Cloudinary, qui transcode a la volee :
//   f_auto  -> WebM/AV1 si le navigateur sait les lire, MP4 sinon
//   q_auto  -> compression pilotee par l'analyse du contenu
//   w_<n>   -> redimensionnement a la largeur reellement affichee
//
// Mesure sur les 31 videos : 1 115 Mo -> 39,4 Mo, soit un facteur 28.
import { environment } from '../../environments/environment';

/** Largeur de rendu selon le contexte d'affichage. */
export type MediaSize = 'card' | 'detail';

// La vignette d'une grille ne depasse jamais ~360 px de large : lui envoyer du
// 720p gaspille de la bande passante sans rien apporter a l'ecran.
const WIDTHS: Record<MediaSize, number> = { card: 480, detail: 720 };

const LEGACY_PREFIX = '/assets/ExercicesVideos/';

/**
 * Identifiant Cloudinary a partir de n'importe quelle forme de reference :
 * ancien chemin local, nom de fichier nu, ou identifiant deja propre.
 * Retourne null si la reference est une URL externe (a laisser telle quelle).
 */
export function toPublicId(reference: string | null | undefined): string | null {
  if (!reference) return null;

  const trimmed = reference.trim();
  if (!trimmed) return null;

  // Une URL absolue qui n'est pas la notre est renvoyee intacte par les
  // fonctions appelantes : on ne cherche pas a la reecrire.
  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes('res.cloudinary.com')) {
    return null;
  }

  const filename = trimmed.split('?')[0].split('/').pop() ?? '';
  // L'extension est retiree : Cloudinary la choisit selon le navigateur.
  return filename.replace(/\.[a-z0-9]+$/i, '') || null;
}

/** URL de la video transcodee. Renvoie la reference telle quelle si externe. */
export function videoUrl(
  reference: string | null | undefined,
  size: MediaSize = 'detail'
): string {
  const publicId = toPublicId(reference);
  if (!publicId) return reference ?? '';

  return `${base()}/video/upload/f_auto,q_auto,w_${WIDTHS[size]}/${encodeURIComponent(publicId)}.mp4`;
}

/**
 * Image de premiere frame. Sans elle, une fiche exercice affiche un cadre noir
 * tant que la video n'a pas commence a se charger — et avec preload="metadata"
 * cela peut durer plusieurs secondes.
 */
export function posterUrl(
  reference: string | null | undefined,
  size: MediaSize = 'detail'
): string {
  const publicId = toPublicId(reference);
  if (!publicId) return '';

  // so_0 : extrait la frame a la seconde 0.
  return `${base()}/video/upload/so_0,f_auto,q_auto,w_${WIDTHS[size]}/${encodeURIComponent(publicId)}.jpg`;
}

/** Vrai si la reference designe une demonstration hebergee. */
export function hasHostedMedia(reference: string | null | undefined): boolean {
  return toPublicId(reference) !== null;
}

/** Ancien chemin local, conserve pour reconnaitre les references heritees. */
export function isLegacyAssetPath(reference: string | null | undefined): boolean {
  return !!reference && reference.includes(LEGACY_PREFIX);
}

function base(): string {
  return `https://res.cloudinary.com/${environment.cloudinaryCloudName}`;
}
