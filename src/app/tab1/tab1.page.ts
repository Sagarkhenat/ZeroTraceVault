import { Component, signal, inject } from '@angular/core';
// import { IonicModule } from '@ionic/angular';
import { IonContent, IonList, IonItem, IonLabel, IonIcon,
  IonSpinner, IonFab, IonFabButton, ToastController, ModalController,IonSkeletonText} from '@ionic/angular/standalone';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { cameraOutline, documentLockOutline, documentTextOutline } from 'ionicons/icons';

import { ScannerService } from '../core/services/scanner.service';
import { PdfProcessorService } from '../core/services/pdf-processor.service';
import { EncryptionService } from '../core/services/encryption.service';
import { FilesystemService } from '../core/services/filesystem.service';
import { DocumentViewerComponent } from '../features/document-viewer/document-viewer.component';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [IonContent, IonList, IonItem, IonLabel, IonIcon,
  IonSpinner, IonFab, IonFabButton,IonSkeletonText],
})
export class Tab1Page {

  // The volatile RAM buffers
  public documentPreview = signal<string | null>(null);
  public isProcessing = signal<boolean>(false);
  public isLoadingVault = signal<boolean>(true); // Track disk read state
  public errorMessage = signal<string | null>(null); // For graceful UI error states
  vaultFiles = signal<any[]>([]); // New signal to hold the file list

  constructor(private scannerService: ScannerService, private pdfProcessor: PdfProcessorService,
    private encryptionService: EncryptionService, private filesystemService: FilesystemService,
    private toastController: ToastController, private modalCtrl: ModalController) {
    addIcons({ cameraOutline , documentLockOutline, documentTextOutline});
  }

  // Load files every time the user enters this tab
  async ionViewDidEnter() {
    await this.loadFiles();
  }

  async loadFiles() {

    this.isLoadingVault.set(true); // Trigger skeleton loaders
    try {
      const files = await this.filesystemService.listVaultFiles();
      this.vaultFiles.set(files);
    } finally {
      // Add a tiny artificial delay to ensure the UI transition is smooth
      setTimeout(() => this.isLoadingVault.set(false), 300);
    }
  }

  async captureAndSecureDocument() {

    await Haptics.impact({ style: ImpactStyle.Light });

    this.isProcessing.set(true);

    // 1. Declare sensitive variables OUTSIDE the try block.
    // This is mandatory so the 'finally' block can access and destroy them if the try block crashes.
    let rawImageBase64: string | null = null;
    let unencryptedPdfBytes: Uint8Array | null = null;
    let cipherText: string | null = null;

    try {
      // Stage 1: Capture Volatile Image
      rawImageBase64 = await this.scannerService.captureDocument();
      if (!rawImageBase64) {
        // The user cancelled the camera UI. Exit gracefully without an error.
        return;
      }
      this.showToast('Compiling secure document...', 'primary');

      // Stage 2: Compile to Unencrypted PDF
      unencryptedPdfBytes = await this.pdfProcessor.createPdfFromImage(rawImageBase64);
      if (!unencryptedPdfBytes || unencryptedPdfBytes.length === 0) {
          throw new Error('PDF Compiler returned an empty buffer.');
      }

      // Stage 3: Encrypt in Memory
      this.showToast('Applying AES-256 encryption...', 'primary');
      cipherText = await this.encryptionService.encryptPdfBytes(unencryptedPdfBytes);
      if (!cipherText) {
        throw new Error('Encryption engine failed to produce valid ciphertext.');
      }

      // Stage 4: Write to Sandboxed Disk
      this.showToast('Writing to secure local vault...', 'primary');
      // Generate a highly unique filename to prevent overwrite collisions
      const fileName = `secure_doc_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}.enc`;

      const savedPath = await this.filesystemService.saveEncryptedDocument(fileName, cipherText);

      // Refresh the volatile RAM state with the new disk data
      await this.loadFiles();

      // Tactile Success Feedback
      await Haptics.notification({ type: NotificationType.Success });
      this.showToast('Document securely locked in vault.', 'success');
      console.log('ZeroTrace file write successful at this location :::', savedPath);

    } catch (error: any) {
      console.error('Vault Security Pipeline Exception:', error);

      // Tactile Error Feedback
      await Haptics.notification({ type: NotificationType.Error });

      // Handle potential out-of-storage or write-permission errors explicitly
      const errorMessage = error.message?.includes('disk') || error.message?.includes('space')
        ? 'Insufficient device storage to save encrypted document.'
        : `Security Error: ${error.message || 'Pipeline failure.'}`;

      this.showToast(errorMessage, 'danger');

    } finally {

      // ZERO-TRACE MEMORY MANAGEMENT (GUARANTEED EXECUTION)
      this.isProcessing.set(false);

      // 1. Nullify raw camera string to trigger garbage collection
      if (rawImageBase64) {
        rawImageBase64 = null;
      }

      // 2. Mathematically destroy unencrypted PDF bytes (Senior-level mitigation)
      if (unencryptedPdfBytes && unencryptedPdfBytes.length > 0) {
        unencryptedPdfBytes.fill(0); // Overwrite the actual RAM addresses with zeros
        unencryptedPdfBytes = null;
      }

      // 3. Nullify ciphertext string
      if (cipherText) {
        cipherText = null;
      }
    }
  }

  async openSecureDocument(file: any) {

    await Haptics.impact({ style: ImpactStyle.Light });
    console.log('Inside open secure document filename value passed :::', file);

    const modal = await this.modalCtrl.create({
      component: DocumentViewerComponent,
      componentProps: {
        fileName: file.name
      }
    });
    await modal.present();
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
