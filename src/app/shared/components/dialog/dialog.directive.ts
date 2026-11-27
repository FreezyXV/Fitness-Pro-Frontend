import {
  AfterViewInit, Directive, ElementRef, HostListener, OnDestroy, inject, output,
} from '@angular/core';

let nextDialogId = 0;

@Directive({ selector: 'dialog[appDialog]', standalone: true })
export class DialogDirective implements AfterViewInit, OnDestroy {
  private readonly dialog: HTMLDialogElement = inject(ElementRef).nativeElement;
  private trigger: HTMLElement | null = null;
  private pressedBackdrop = false;
  readonly dismissed = output<void>();

  ngAfterViewInit(): void {
    const activeElement = this.dialog.ownerDocument.activeElement;
    this.trigger = activeElement instanceof HTMLElement ? activeElement : null;
    const title = this.dialog.querySelector<HTMLElement>(
      '.modal-header :is(h1, h2, h3), .modal-header .modal-title',
    );
    if (title) {
      title.id ||= `dialog-title-${++nextDialogId}`;
      this.dialog.setAttribute('aria-labelledby', title.id);
    } else {
      this.dialog.setAttribute('aria-label', 'Fenêtre de dialogue');
    }
    this.dialog.showModal();
  }

  @HostListener('cancel', ['$event'])
  cancel(event: Event): void {
    event.preventDefault();
    this.dismissed.emit();
  }

  @HostListener('pointerdown', ['$event'])
  pointerdown(event: PointerEvent): void {
    this.pressedBackdrop = event.target === this.dialog;
  }

  @HostListener('click', ['$event'])
  closeFromBackdrop(event: MouseEvent): void {
    if (this.pressedBackdrop && event.target === this.dialog) this.dismissed.emit();
    this.pressedBackdrop = false;
  }

  ngOnDestroy(): void {
    if (this.dialog.open) this.dialog.close();
    if (this.trigger?.isConnected) this.trigger.focus({ preventScroll: true });
  }
}
