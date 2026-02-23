import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.css']
})
export class MoreComponent implements OnInit {

  mostrarAux = 1;

  constructor(private userService: UserService, private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    
  }

  consultarReglas()
  {
    this.mostrarAux = 2;
  }

  verCalendario()
  {
    this.mostrarAux = 3;
  }

  cambiarLiga()
  {
    const data = {
      id: this.userService.getUsuario().id
    }
    
    this.userService.cambiarLiga(data).subscribe({
      next: (res:any) => {
        console.log("Eliminado de liga", res);
        this.auth.justRegistered = true;
        this.router.navigate(['/leagueIndex']);
      },
      error: (error:any) => {
        console.error('Error al eliminar de liga', error);
      }
    })
  }

  abandonarLiga()
  {
    const data = {
      id: this.userService.getUsuario().id
    }
    
    this.userService.cambiarLiga(data).subscribe({
      next: (res:any) => {
        console.log("Eliminado de liga", res);
        this.router.navigate(['/']);
      },
      error: (error:any) => {
        console.error('Error al eliminar de liga', error);
      }
    })
    this.cerrarSesion();
  }

  mostrarBasico()
  {
    this.mostrarAux = 1;
  }

  cerrarSesion()
  {
    this.userService.logout();
    this.router.navigate(['/leagueIndex']);

  }
}
