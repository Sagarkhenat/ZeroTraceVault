import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthState {
  // Writable signal for internal state mutation
  private readonly _isAuthenticated = signal<boolean>(false);

  // Read-only computed signal for components to consume
  public readonly isAuthenticated = computed(() => this._isAuthenticated());

  public login(): void {
    this._isAuthenticated.set(true);
  }

  public logout(): void {
    this._isAuthenticated.set(false);
  }
}
