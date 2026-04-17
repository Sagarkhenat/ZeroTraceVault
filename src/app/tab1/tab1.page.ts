import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { scanOutline, documentTextOutline } from 'ionicons/icons';
import { NgIf } from '@angular/common';
import { ScannerService } from '../core/services/scanner.service';

@Component({
  selector: 'app-tab1',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-secure-header">
        <ion-title>My Vault</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="ion-padding">
      <div class="safe-padding empty-state" *ngIf="!tempImagePreview">
        <ion-icon name="document-text-outline"></ion-icon>
        <h2>Vault is Empty</h2>
        <p>Tap the scan button to digitize a secure document.</p>
      </div>

      <div class="safe-padding preview-state" *ngIf="tempImagePreview">
        <h2>Memory Buffer Active</h2>
        <img [src]="tempImagePreview" alt="Document Preview" class="secure-preview" />
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="safe-absolute-bottom">
        <ion-fab-button (click)="startScan()">
          <ion-icon name="scan-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .empty-state {
      height: 80%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--ion-color-step-500);
    }
    .empty-state ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .preview-state {
      text-align: center;
      padding-top: 20px;
    }
    .secure-preview {
      width: 100%;
      border-radius: 12px;
      border: 2px solid var(--ion-color-primary);
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    ion-fab-button {
      --background: var(--ion-color-primary);
      margin-bottom: 16px;
      margin-right: 16px;
    }
  `],
  standalone: true,
  imports: [IonicModule, NgIf],
})
export class Tab1Page {
  private scannerService = inject(ScannerService);

  // Temporary state to hold the image before we convert to PDF
  tempImagePreview: string | null = null;

  constructor() {
    addIcons({ scanOutline, documentTextOutline });
  }

  async startScan() {
    const rawImage = await this.scannerService.captureDocument();
    if (rawImage) {
      // For now, we just display it to ensure the hardware bridge works.
      this.tempImagePreview = rawImage;
      console.log('Image successfully captured to memory buffer.');
    }
  }
}
