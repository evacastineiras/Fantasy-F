import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-league-index',
  templateUrl: './league-index.component.html',
  styleUrls: ['./league-index.component.css']
})
export class LeagueIndexComponent implements OnInit {

  constructor() { }

  mostrarEleccion = true;
  mostrarLigaPrivada = false;
  mostrarCrearLiga = false;

  ngOnInit(): void {
  }

  crearLigaSelected()
  {
    this.mostrarEleccion = false;
    this.mostrarLigaPrivada = false;
    this.mostrarCrearLiga = true;
  }

  unirseLigaPriv()
  {
    this.mostrarEleccion = false;
    this.mostrarLigaPrivada = true;
    this.mostrarCrearLiga = false;
  }

  indexSelected()
  {
    this.mostrarEleccion = true;
    this.mostrarLigaPrivada = false;
    this.mostrarCrearLiga = false;
  }

}
