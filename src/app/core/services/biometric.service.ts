import { Injectable } from '@angular/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {

  async checkAvailability(): Promise<boolean> {
    try {
      const info = await BiometricAuth.checkBiometry();
      return info.isAvailable;
    } catch (error) {
      console.error('Biometry check failed', error);
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      // The method resolves successfully to 'void' if the user passes the check.
      await BiometricAuth.authenticate({
        reason: 'Unlock ZeroTrace Vault to access your secure documents',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true, // Allows fallback to device PIN/Passcode
      });

      // If the code execution reaches this line, it means no error was thrown,
      // and the biometric authentication was successful!
      return true;

    } catch (error) {
      // If authentication fails, or if the user clicks 'Cancel',
      // the plugin throws a BiometryError which is caught here.
      console.error('Authentication failed or cancelled', error);
      return false;
    }
  }
}
