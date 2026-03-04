import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from './services/user.service';

@Injectable({
  providedIn: 'root'
})
export class MasterGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(): boolean {
    const usuario = this.userService.getUsuario();
    if (usuario && usuario.id === 1) {
      return true;
    }
    this.router.navigate(['/']); 
    return false;
  }
}