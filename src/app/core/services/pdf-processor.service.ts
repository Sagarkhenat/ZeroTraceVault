import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

@Injectable({
  providedIn: 'root'
})
export class PdfProcessorService {

  /**
   * Compiles a raw Base64 JPEG string into a PDF document entirely in RAM.
   * Returns a Uint8Array primed for Phase 3 encryption.
   */
  async createPdfFromImage(base64Image: string | null | undefined): Promise<Uint8Array> {
    // Error Scenario 1: Empty or Invalid Payload
    if (!base64Image || base64Image.trim() === '') {
      throw new Error('PDF_COMPILATION_ERROR: Source image stream is empty.');
    }

    // Error Scenario 2: Data URI Contamination
    // Capacitor usually returns pure Base64, but if the string includes the
    // data URI prefix, pdf-lib will crash. This regex strips it safely.
    const pureBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    try {
      // Create a new empty PDF document
      const pdfDoc = await PDFDocument.create();

      // Embed the JPG image bytes. (Capacitor Camera defaults to JPEG)
      const image = await pdfDoc.embedJpg(pureBase64);

      // Extract the exact dimensions of the captured image
      const imageDims = image.scale(1);

      // Add a page to the document matching the image dimensions precisely
      const page = pdfDoc.addPage([imageDims.width, imageDims.height]);

      // Draw the image onto the page coordinates
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: imageDims.width,
        height: imageDims.height,
      });

      // Serialize the PDFDocument to bytes (Uint8Array)
      const pdfBytes = await pdfDoc.save();

      return pdfBytes;

    } catch (error: any) {
      // Error Scenario 3: Internal PDF Compilation Failure
      console.error('Fatal error during PDF memory allocation:', error);
      throw new Error(`PDF_COMPILATION_ERROR: ${error.message || 'Unknown parsing failure'}`);
    }
  }
}
