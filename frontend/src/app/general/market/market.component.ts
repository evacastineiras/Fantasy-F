import { Component, OnInit } from '@angular/core';
import { MarketService } from 'src/app/services/market.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.css']
})
export class MarketComponent implements OnInit {

  jugadoras: any[] = [];
  loading: boolean = true;

  constructor(private marketService: MarketService,
    private userService: UserService) { }

  ngOnInit(): void {
    const idUsuario = this.userService.getUsuario().id;
    this.marketService.getMarketPlayers(idUsuario).subscribe({
      next: (data) => {
        this.jugadoras = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando el mercado: ', err);
        this.loading = false;
      }
    });
  }

  getTendencia(jugadora: any) {
  if (!jugadora.valor_base || jugadora.valor === jugadora.valor_base) {
    return null;
  }

  const diferencia = jugadora.valor - jugadora.valor_base;
  const porcentaje = (diferencia / jugadora.valor_base) * 100;
  
  
  return {
    valor: Math.abs(porcentaje).toFixed(0), 
    sube: diferencia > 0
  };
}

}
