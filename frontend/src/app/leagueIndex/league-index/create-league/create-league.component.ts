import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-create-league',
  templateUrl: './create-league.component.html',
  styleUrls: ['./create-league.component.css']
})
export class CreateLeagueComponent implements OnInit {

  constructor(private UserService: UserService, private router: Router, private authService: AuthService) { }


  @Output() volverAtrasEvent = new EventEmitter<void>();

  codigoLiga: number = 0;
  mostrarToast = false;
  nombre: string = '';

  ngOnInit(): void {
    this.generarCodigoLiga();
  }

  generarCodigoLiga() 
  {
  const caracteres = '0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres[indice];
  }
  this.codigoLiga = parseInt(codigo);
  }

  copiarCodigo()
  {
    navigator.clipboard.writeText(this.codigoLiga.toString())
    .then(() => {
      this.mostrarToast = true;
      setTimeout(() => {
        this.mostrarToast = false;
      }, 2000); 
    })
    .catch(err => {
      console.error('Error al copiar el código: ', err);
    });
  }

  volverAtras()
  {
    this.volverAtrasEvent.emit();
  }

 async crearLiga()
  {
    const newLeague = {
      id_liga: this.codigoLiga,
      nombre: this.nombre,
      usuario: this.UserService.getUsuario().id
    }
    
  this.UserService.crearLiga(newLeague).subscribe({
      next: async (res:any) => {
        console.log("Liga creada", res);
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
        console.error("Error en la creacion de la liga", error)
      }
    })
    
  }

}
