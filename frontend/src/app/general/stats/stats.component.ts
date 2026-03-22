import { Component, OnInit } from '@angular/core';
import { PlayerService } from 'src/app/services/player.service';
import { UserService } from 'src/app/services/user.service';
@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  filtroSeleccionado: string = 'goles';
  jugadoras: any[] = []; 
  id_usuario: number;

  constructor(private playerService: PlayerService ,private userService: UserService) {
    this.id_usuario = this.userService.getUsuario().id;
   }

  ngOnInit(): void {
    this.cambiarFiltro('goles');
  }

  cambiarFiltro(nuevoFiltro: string) {
    this.filtroSeleccionado = nuevoFiltro;
if (nuevoFiltro === 'equipo') {
      this.playerService.getMyTeamStats(this.id_usuario).subscribe({
        next: (data: any) => this.jugadoras = data,
        error: (err:any) => console.error(err)
      });
    } else {
     
      let criterioBack = '';
      if (nuevoFiltro === 'goles') criterioBack = 'goles_total';
      else if (nuevoFiltro === 'asistencias') criterioBack = 'asistencias_total';
      else if (nuevoFiltro === 'tarjetas') criterioBack = 'tarjetas_total'; 
      else if (nuevoFiltro === 'porteria') criterioBack = 'porteria_total';

      this.playerService.getTopStats(criterioBack).subscribe({
        next: (data: any) => this.jugadoras = data,
        error: (err) => console.error(err)
      });
    }
  }

  getTendencia(jugadora: any) {
    const valor = jugadora.valor_actual ?? jugadora.valor;
    const base = jugadora.valor_base;
    if (!base || valor === base) return null;
    const diferencia = valor - base;
    const porcentaje = (diferencia / base) * 100;
    return { valor: Math.abs(porcentaje).toFixed(0), sube: diferencia > 0 };
}
}