import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-create-league',
  templateUrl: './create-league.component.html',
  styleUrls: ['./create-league.component.css']
})
export class CreateLeagueComponent implements OnInit {

  constructor() { }
  @Output() volverAtrasEvent = new EventEmitter<void>();

  codigoLiga = "h295wjdketwef3";
  mostrarToast = false;

  ngOnInit(): void {
    this.generarCodigoLiga();
  }

  generarCodigoLiga() 
  {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres[indice];
  }
  this.codigoLiga = codigo;
  }

  copiarCodigo()
  {
    navigator.clipboard.writeText(this.codigoLiga)
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

}
