import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  /**
   * Captures a high-resolution image directly into memory.
   * @returns Base64 string of the image, or null if cancelled.
   */
  async captureDocument(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,                  // High quality for document legibility
        allowEditing: false,          // Native crop can sometimes write to disk, we handle UI later
        resultType: CameraResultType.Base64, // CRITICAL: Returns raw data stream, bypassing disk
        source: CameraSource.Camera,  // Force hardware camera, prohibit gallery selection
        saveToGallery: false          // CRITICAL: Privacy-First, do not save to public camera roll
      });

      if (image.base64String) {
        // Return the raw base64 data for in-memory processing
        return `data:image/${image.format};base64,${image.base64String}`;
      }
      return null;

    } catch (error) {
      // Handles user denying camera permissions or cancelling the camera modal
      console.warn('Document capture cancelled or failed', error);
      return null;
    }
  }
}
