import { Component, signal, inject } from '@angular/core';
import { ScannerService } from '../core/services/scanner.service';
import { PdfProcessorService } from '../core/services/pdf-processor.service';
import { EncryptionService } from '../core/services/encryption.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-vault-tab',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss']
})
export class Tab1Page {

  // The volatile RAM buffers
  public documentPreview = signal<string | null>(null);
  public isProcessing = signal<boolean>(false);
  public errorMessage = signal<string | null>(null); // For graceful UI error states

  constructor(private scannerService: ScannerService, private pdfProcessor: PdfProcessorService,
  private encryptionService: EncryptionService) {

  }

  async triggerScanner() {
      this.errorMessage.set(null); // Reset errors on new scan

      try {
        // 1. Capture to RAM
        const base64Data = await this.scannerService.captureDocument();

        if (base64Data) {
          // Render temporarily to the UI
          this.documentPreview.set(base64Data);

          // Begin background compilation
          await this.processDocument(base64Data);
        }
      } catch (error: any) {
        // This catches user cancellations (e.g., backing out of the camera)
        // or native hardware permission denials.
        console.log('Scanner closed or failed:', error.message);
      }
  }

  private async processDocument(base64Data: string) {
    this.isProcessing.set(true);

    // We declare pdfBytes outside the try block so the finally block
    // can always access it for memory destruction.
    let pdfBytes: Uint8Array | null = null;

    try {
      // 1. Compile the PDF
      pdfBytes = await this.pdfProcessor.createPdfFromImage(base64Data);

      // Error Scenario 1: Empty Buffer validation
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF compilation yielded an empty byte array.');
      }
      console.log(`Success: Zero-Trace PDF compiled. Size: ${(pdfBytes.byteLength / 1024 / 1024).toFixed(2)} MB`);

      // 2. Encrypt the Byte Array
      const cipherText = await this.encryptionService.encryptPdfBytes(pdfBytes);
      console.log('Success: Document cryptographically secured in RAM.');

      // TODO (Phase 3): Pass 'cipherText' to the FilesystemService to write to disk

    } catch (error: any) {
      // Error Scenario 2: Graceful UI Error State Handling
      console.error('Critical failure during secure processing pipeline:', error.message);
      this.errorMessage.set('Failed to securely process and encrypt the document. Please try scanning again.');
    } finally {
      // 3. CRITICAL: Guaranteed Memory Cleanup & Data Destruction

      this.documentPreview.set(null);
      this.isProcessing.set(false);

      // Error Scenario 3: True Zero-Trace Memory Wipe
      // We do not just let the Garbage Collector handle the unencrypted PDF.
      // We aggressively overwrite the array in RAM with zeros before nullifying it.
      if (pdfBytes) {
        pdfBytes.fill(0);
        pdfBytes = null;
      }
    }
  }
}
