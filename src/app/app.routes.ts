import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'lock',
    pathMatch: 'full',
  },
  {
    path: 'lock',
    loadComponent: () => import('./features/lock-screen/lock-screen.component').then(m => m.LockScreenComponent),
  },
  {
    path: 'tabs',
    canActivate: [authGuard], // The Security Gate is applied here
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];
