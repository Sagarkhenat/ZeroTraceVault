import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Private signal holding the actual state
  private isAuthenticatedSignal = signal<boolean>(false);

  // Expose a read-only version to prevent components from mutating it directly
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  // Key used for local storage
  private readonly PIN_KEY = 'zerotracevault_fallback_pin';

  constructor() {}

  async isFirstRun(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'hasSeenGuide' });
    return value === null; // Returns true if the key doesn't exist yet
  }

  async markGuideAsSeen(): Promise<void> {
    await Preferences.set({
      key: 'hasSeenGuide',
      value: 'true'
    });
  }

  /**
   * Unlocks the vault.
   * Later, this will only be called after a successful biometric hardware scan.
   */
  unlock() {
    this.isAuthenticatedSignal.set(true);
  }

  /**
   * Locks the vault.
   * This can be tied to a manual "Lock" button or an App background lifecycle event.
   */
  lock() {
    this.isAuthenticatedSignal.set(false);
  }

  async hasPinSet(): Promise<boolean> {
    const { value } = await Preferences.get({ key: this.PIN_KEY });
    return value !== null;
  }

  async savePin(pin: string): Promise<void> {
    await Preferences.set({
      key: 'fallback_pin',
      value: pin
    });
  }

  async setPin(pin: string): Promise<void> {
    await Preferences.set({ key: this.PIN_KEY, value: pin });
  }

  async verifyPin(pin: string): Promise<boolean> {
    const { value } = await Preferences.get({ key: this.PIN_KEY });
    return value === pin;
  }

  /**
   * Clears the fallback PIN and any other
   * local metadata stored in Capacitor Preferences.
   */
  async clearCredentials(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Failed to clear local preferences:', error);
      throw error;
    }
  }

  /**
   * Resets the global authentication Signal
   * to 'false', effectively locking the app.
   */
  logout(): void {
    this.isAuthenticatedSignal.set(false);
  }

}
