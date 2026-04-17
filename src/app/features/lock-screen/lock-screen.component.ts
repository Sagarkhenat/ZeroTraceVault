import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { fingerPrintOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthState } from 'src/app/core/state/auth-state';
import { BiometricService } from '../../core/services/biometric.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-lock-screen',
  template: `
    <ion-content class="ion-no-padding">
      <div class="safe-padding lock-container">

        <div class="header-section">
          <ion-icon name="lock-closed-outline" class="vault-icon"></ion-icon>
          <h1>ZeroTrace Vault</h1>
          <p>Encrypted local storage.</p>
        </div>

        <div class="action-section">
          <p *ngIf="errorMessage" class="error-text">{{ errorMessage }}</p>

          <ion-button expand="block" class="auth-button" (click)="triggerAuth()">
            <ion-icon slot="start" name="fingerprint-outline"></ion-icon>
            Unlock Vault
          </ion-button>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .lock-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      background: var(--ion-background-color);
      padding: 40px 20px;
    }
    .header-section {
      text-align: center;
      margin-top: 20vh;
    }
    .vault-icon {
      font-size: 80px;
      color: var(--ion-color-primary);
      margin-bottom: 20px;
    }
    h1 {
      font-weight: 700;
      color: var(--ion-text-color);
    }
    p {
      color: var(--ion-color-step-500);
    }
    .action-section {
      width: 100%;
      max-width: 400px;
      margin-bottom: 5vh;
    }
    .auth-button {
      --border-radius: 12px;
      --padding-top: 18px;
      --padding-bottom: 18px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .error-text {
      color: var(--ion-color-danger);
      text-align: center;
      font-size: 14px;
      margin-bottom: 15px;
    }
  `],
  standalone: true,
  imports: [IonicModule, NgIf]
})
export class LockScreenComponent implements OnInit {
  private authState = inject(AuthState);
  private biometricService = inject(BiometricService);
  private router = inject(Router);

  errorMessage = '';

  constructor() {
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
}
