import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { IonContent, IonButton, IonIcon, AlertController,ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fingerPrintOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthState } from 'src/app/core/state/auth-state';
import { BiometricService } from '../../core/services/biometric.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-lock-screen',
  templateUrl: 'lock-screen.component.html',
  styleUrls: ['lock-screen.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class LockScreenComponent implements OnInit {

  errorMessage = '';

  constructor(private authState: AuthState,private authService: AuthService, private biometricService: BiometricService, private router: Router,
    private alertController: AlertController,private toastController: ToastController) {
    addIcons({ fingerPrintOutline, lockClosedOutline });
  }

  async ngOnInit() {
    // Optionally trigger auth automatically when the screen loads
    const isAvailable = await this.biometricService.checkAvailability();
    if (isAvailable) {
      this.triggerAuth();
    } else {
      this.errorMessage = 'Biometric authentication is not configured on this device. Please use your PIN.';
    }
  }

  async triggerAuth() {
    this.errorMessage = '';
    const success = await this.biometricService.authenticate();

    if (success) {
      this.authState.login();
      this.router.navigate(['/tabs'], { replaceUrl: true }); // Prevent back navigation to lock screen
    } else {
      this.errorMessage = 'Authentication failed. Please try again.';
    }
  }

  async useFallbackPin() {

    const hasPin = await this.authService.hasPinSet();
    console.log('Fallback PIN condition triggered, allow user to enter 4 digit PIN value :::', hasPin);
    if (!hasPin) {
      await this.presentPinSetup();
    } else {
      await this.presentPinEntry();
    }
  }

    async presentPinSetup() {
    const alert = await this.alertController.create({
      header: 'Set Fallback PIN',
      message: 'Create a 4-digit PIN for when biometrics are unavailable.',
      inputs: [
        { name: 'pin', type: 'password', placeholder: 'Enter PIN', attributes: { maxlength: 4 } }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save & Unlock',
          handler: async (data) => {
            if (data.pin && data.pin.length === 4) {
              await this.authService.setPin(data.pin);
              this.authService.unlock();
              // Tell the global state the user is authenticated so the guard lets them pass
              this.authState.login();
              this.router.navigate(['/tabs'], { replaceUrl: true }); // Prevent back navigation to lock screen
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async presentPinEntry() {
    const alert = await this.alertController.create({
      header: 'Enter PIN',
      inputs: [
        { name: 'pin', type: 'password', placeholder: 'Enter your 4-digit PIN', attributes: { maxlength: 4 } }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Unlock',
          handler: async (data) => {
            const isValid = await this.authService.verifyPin(data.pin);
            if (isValid) {
              this.authService.unlock();
               // Tell the global state the user is authenticated so the guard lets them pass
              this.authState.login();
              this.router.navigate(['/tabs'], { replaceUrl: true }); // Prevent back navigation to lock screen
            } else {
              console.error('Invalid PIN entered');
              this.showToast('Invalid PIN entered.', 'danger');
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

}
