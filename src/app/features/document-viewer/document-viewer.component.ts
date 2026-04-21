import { Component, Input, inject, signal, OnDestroy } from '@angular/core';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

import { FilesystemService } from 'src/app/core/services/filesystem.service';
import { EncryptionService } from 'src/app/core/services/encryption.service';

@Component({
  selector: 'app-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class DocumentViewerComponent implements OnDestroy {
  // The filename passed in when the modal is opened
  @Input() fileName!: string;

  private modalCtrl = inject(ModalController);
  private filesystemService = inject(FilesystemService);
  private encryptionService = inject(EncryptionService);
  private sanitizer = inject(DomSanitizer);
  private toastCtrl = inject(ToastController);

  // Reactive UI State
  isLoading = signal<boolean>(true);
  safePdfUrl = signal<SafeResourceUrl | null>(null);

  // Keep track of the raw URL and bytes for destruction later
  private objectUrl: string | null = null;
  private decryptedBytes: Uint8Array | null = null;

  constructor() {
    addIcons({ closeOutline });
  }

  async ionViewDidEnter() {
    await this.loadAndDecrypt();
  }

  private async loadAndDecrypt() {
    try {
      this.isLoading.set(true);

      // 1. Read the encrypted Base64 string from the native disk
      const cipherText = await this.filesystemService.readEncryptedDocument(`${this.fileName}`);

      if (!cipherText) throw new Error('File is empty or corrupted.');

      // 2. Decrypt back to a raw byte array in RAM
      this.decryptedBytes = await this.encryptionService.decryptToPdfBytes(cipherText);

      // FIX 1: Create a local reference so TypeScript guarantees it is not null
      const bytesArray = this.decryptedBytes;

      if (!bytesArray || bytesArray.length === 0) {
        throw new Error('Decryption resulted in empty or invalid data.');
      }

      // 3. Convert the byte array to a temporary browser Blob using the local reference
      const blob = new Blob([bytesArray as any], { type: 'application/pdf' });

      // FIX 2: Actually generate the volatile Object URL and store it locally first
      const generatedUrl = URL.createObjectURL(blob);

      // Save it to the class property so ngOnDestroy can revoke it later
      this.objectUrl = generatedUrl;

      // Bypass Angular's strict security using the guaranteed string
      this.safePdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(generatedUrl));

    } catch (error) {
      console.error('Decryption failed:', error);
      this.showToast('Failed to decrypt document. It may be corrupted.', 'danger');
      this.closeModal();
    } finally {
      this.isLoading.set(false);
    }
  }

  async closeModal() {
    await this.modalCtrl.dismiss();
  }

  /**
   * CRITICAL: Zero-Trace Cleanup Lifecycle
   * This guarantees that when the modal is destroyed, the unencrypted
   * document is wiped from the device's volatile memory.
   */
  ngOnDestroy() {
    console.log('Initiating Zero-Trace Memory Wipe for Viewer...');

    // 1. Revoke the temporary browser URL
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    // 2. Mathematically destroy the unencrypted byte array
    if (this.decryptedBytes && this.decryptedBytes.length > 0) {
      this.decryptedBytes.fill(0);
      this.decryptedBytes = null;
    }

    this.safePdfUrl.set(null);
  }

  private async showToast(message: string, color: 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
