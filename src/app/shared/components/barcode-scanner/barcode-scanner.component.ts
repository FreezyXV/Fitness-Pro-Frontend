// barcode-scanner.component.ts - Scan de code-barres alimentaire.
//
// Le scan est le geste qui rend le suivi nutritionnel tenable au quotidien :
// saisir "yaourt nature Danone 125 g" au clavier trois fois par jour, personne
// ne le fait sur la duree.
//
// Deux chemins, parce que la plateforme est inegale :
//   - BarcodeDetector (Chrome/Edge Android, Chrome desktop) : natif, gratuit,
//     zero dependance.
//   - Saisie manuelle : iOS Safari n'implemente pas BarcodeDetector. Plutot
//     que d'embarquer une librairie de decodage de 500 ko pour un cas d'usage
//     minoritaire, on propose la saisie du code a 13 chiffres, qui reste
//     bien plus rapide que la recherche textuelle.
import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OpenFoodFactsService } from '@app/services/open-food-facts.service';
import { Food } from '@features/nutrition/food-database';

type ScannerState =
  | 'idle'
  | 'requesting'
  | 'scanning'
  | 'looking-up'
  | 'not-found'
  | 'denied'
  | 'unsupported';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.scss'],
})
export class BarcodeScannerComponent implements OnDestroy {
  private readonly off = inject(OpenFoodFactsService);

  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  @Output() readonly foodFound = new EventEmitter<Food>();
  @Output() readonly closed = new EventEmitter<void>();

  readonly state = signal<ScannerState>('idle');
  readonly manualCode = signal('');
  readonly lastCode = signal<string | null>(null);

  private stream: MediaStream | null = null;
  private detector: any = null;
  private rafHandle: number | null = null;
  private stopped = false;

  readonly supportsCamera = 'BarcodeDetector' in window &&
    !!navigator.mediaDevices?.getUserMedia;

  ngOnDestroy(): void {
    this.teardown();
  }

  // ------------------------------------------------------------------ camera

  async startCamera(): Promise<void> {
    if (!this.supportsCamera) {
      this.state.set('unsupported');
      return;
    }

    this.state.set('requesting');
    this.stopped = false;

    try {
      const Detector = (window as any).BarcodeDetector;
      this.detector = new Detector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
      });

      // facingMode 'environment' : la camera arriere. Sans cette contrainte,
      // les telephones ouvrent la camera frontale et le scan est impossible.
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      this.state.set('scanning');

      // Le <video> n'existe dans le DOM qu'une fois l'etat 'scanning' rendu.
      queueMicrotask(() => {
        const video = this.videoRef?.nativeElement;
        if (!video || !this.stream) return;

        video.srcObject = this.stream;
        video.play().then(() => this.scanLoop()).catch(() => this.state.set('denied'));
      });
    } catch {
      this.state.set('denied');
      this.teardown();
    }
  }

  /**
   * Boucle de detection calee sur requestAnimationFrame : elle s'interrompt
   * d'elle-meme quand l'onglet passe en arriere-plan, ce qui evite de garder
   * la camera active et de vider la batterie.
   */
  private scanLoop(): void {
    const video = this.videoRef?.nativeElement;
    if (!video || this.stopped) return;

    this.detector
      .detect(video)
      .then((codes: Array<{ rawValue: string }>) => {
        if (this.stopped) return;

        const value = codes?.[0]?.rawValue;
        if (value) {
          this.onCodeDetected(value);
          return;
        }
        this.rafHandle = requestAnimationFrame(() => this.scanLoop());
      })
      .catch(() => {
        if (!this.stopped) {
          this.rafHandle = requestAnimationFrame(() => this.scanLoop());
        }
      });
  }

  // ----------------------------------------------------------------- lookup

  submitManualCode(): void {
    const code = this.manualCode().replace(/\D/g, '');
    if (code.length < 8) return;
    this.onCodeDetected(code);
  }

  private onCodeDetected(code: string): void {
    this.stopStream();
    this.lastCode.set(code);
    this.state.set('looking-up');
    this.vibrate();

    this.off.lookupBarcode(code).subscribe(food => {
      if (food) {
        this.foodFound.emit(food);
        this.close();
      } else {
        this.state.set('not-found');
      }
    });
  }

  retry(): void {
    this.state.set('idle');
    this.manualCode.set('');
    this.lastCode.set(null);
  }

  close(): void {
    this.teardown();
    this.closed.emit();
  }

  // ------------------------------------------------------------------ interne

  private stopStream(): void {
    this.stopped = true;

    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }

    // Couper explicitement chaque piste : sans ca le voyant de la camera
    // reste allume apres la fermeture du scanner.
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  private teardown(): void {
    this.stopStream();
    this.detector = null;
  }

  private vibrate(): void {
    try {
      navigator.vibrate?.(40);
    } catch {
      // vibration indisponible : sans consequence
    }
  }
}
