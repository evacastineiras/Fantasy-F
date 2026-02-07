import { Component, OnInit } from '@angular/core';
import { PlayerService } from 'src/app/services/player.service';
@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  filtroSeleccionado: string = 'goles';
  jugadoras: any[] = []; 

  constructor(private playerService: PlayerService) { }

  ngOnInit(): void {
    this.cambiarFiltro('goles');
  }

  cambiarFiltro(nuevoFiltro: string) {
    this.filtroSeleccionado = nuevoFiltro;
    let criterioBack = '';

    if (nuevoFiltro === 'goles') criterioBack = 'goles_total';
    else if (nuevoFiltro === 'asistencias') criterioBack = 'asistencias_total';
    else if (nuevoFiltro === 'tarjetas') criterioBack = 'amarillas_total';
    else if (nuevoFiltro === 'porteria') criterioBack = 'porterias_cero'; 
    if (criterioBack) {
        this.playerService.getTopStats(criterioBack).subscribe({
            next: (data: any) => this.jugadoras = data,
            error: (err) => console.error(err)
        });
    }
}
}