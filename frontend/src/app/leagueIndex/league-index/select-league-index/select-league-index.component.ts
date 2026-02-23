import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-select-league-index',
  templateUrl: './select-league-index.component.html',
  styleUrls: ['./select-league-index.component.css']
})
export class SelectLeagueIndexComponent implements OnInit {

  constructor(private UserService: UserService, private router: Router , private authService: AuthService) { }

   @Output() ligaPrivadaShow = new EventEmitter<void>();
   @Output() crearLigaShow = new EventEmitter<void>();

  ngOnInit(): void {
  }

  async addToRandomLeague()
  {
    
    const user = {
      usuario: this.UserService.getUsuario().id
    }
    
  this.UserService.unirseALigaAleatoria(user).subscribe({
      next: async (res:any) => {
        console.log("Unido a liga", res);
        this.authService.justRegistered = false;
        const usuarioActual = this.UserService.getUsuario();
      const usuarioActualizado = {
        ...usuarioActual,
        id_liga: res.id_liga,
        presupuesto: res.presupuesto,
        id_plantilla: res.id_plantilla
      };
      
      this.UserService.setUsuario(usuarioActualizado);
      await new Promise(f => setTimeout(f, 600));

      
      this.router.navigate(['/home']).then(nav => {
        if (!nav) {
          console.error("La navegación fue rechazada por el Guard. ");
        }
      });
      },
      error: (error:any) => {
        console.error("Error al unirse a liga", error)
      }
    })
  }

  addToPrivateLeague()
  {
    this.ligaPrivadaShow.emit();
  }

  createLeague()
  {
    this.crearLigaShow.emit();
  }

}
