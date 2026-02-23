import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-private-league',
  templateUrl: './private-league.component.html',
  styleUrls: ['./private-league.component.css']
})
export class PrivateLeagueComponent implements OnInit {
  @Output() volverAtrasEvent = new EventEmitter<void>();

  constructor(private authService: AuthService,private userService: UserService, private router: Router) { }

  codigo: string = '';
  ngOnInit(): void {
    console.log(this.userService.getUsuario())
  }
  volverAtras()
  {
    this.volverAtrasEvent.emit();
  }

async unirseALiga() { 
  
  
  const datosParaEnviar = {
    id_liga: this.codigo,
    usuario: this.userService.getUsuario().id
  };

  this.userService.unirseALigaPrivada(datosParaEnviar).subscribe({
    next: async (res: any) => { 
      console.log("Unido a liga con éxito", res);
      this.authService.justRegistered = false;
      const usuarioActual = this.userService.getUsuario();
      const usuarioActualizado = {
        ...usuarioActual,
        id_liga: res.id_liga,
        presupuesto: res.presupuesto,
        id_plantilla: res.id_plantilla
      };
      
      this.userService.setUsuario(usuarioActualizado);
      await new Promise(f => setTimeout(f, 600));

      
      this.router.navigate(['/home']).then(nav => {
        if (!nav) {
          console.error("La navegación fue rechazada por el Guard. ");
        }
      });
    },
    error: (error: any) => {
      console.error("Error al unirse a liga", error);
    }
  });
}

}
