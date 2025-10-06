import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-league',
  templateUrl: './create-league.component.html',
  styleUrls: ['./create-league.component.css']
})
export class CreateLeagueComponent implements OnInit {

  constructor(private UserService: UserService, private router: Router) { }


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

  crearLiga()
  {
    const newLeague = {
      id_liga: this.codigoLiga,
      nombre: this.nombre,
      usuario: this.UserService.getUsuario().id
    }
    
  this.UserService.crearLiga(newLeague).subscribe({
      next: (res:any) => {
        console.log("Liga creada", res);
      },
      error: (error:any) => {
        console.error("Error en la creacion de la liga", error)
      }
    })
    
  }

}
