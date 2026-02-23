import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';


@Injectable ({
    providedIn: 'root'
})

export class UserGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router, private userService: UserService) {}

    canActivate() : boolean
    {
        const usuario = this.userService.getUsuario();
       
       if (usuario && usuario.id !== undefined && usuario.id !== null && !this.auth.justRegistered && usuario.id_liga !== null)
        {
            return true;
        }

        if(this.auth.justRegistered == true)
        {
            this.router.navigate(['/leagueIndex'])
            return false;
        }

        if(usuario && usuario.id !== undefined && usuario.id !== null && usuario.id_liga == null)
        {
            this.auth.justRegistered = true;
            this.router.navigate(['/leagueIndex'])
            return false;
        }

        this.router.navigate(['/'])
        return false;
    }
}