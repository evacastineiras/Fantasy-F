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
  jugadorasFiltradas: any[] = []; 
  loading: boolean = true;
  limite: number = 10;

  constructor(
    private marketService: MarketService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    const idUsuario = this.userService.getUsuario().id;
    this.marketService.getMarketPlayers(idUsuario).subscribe({
      next: (data) => {
        this.jugadoras = data;
        
        // --- LOGICA DE FILTRO INICIAL ---
        // Al cargar, solo mostramos las que NO tienen propietario (nombre_usuario es null o vacío)
        this.jugadorasFiltradas = this.jugadoras.filter(j => !j.nombre_usuario);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando el mercado: ', err);
        this.loading = false;
      }
    });
  }

  filtrar(event: any): void {
    const busqueda = event.target.value.toLowerCase();

    // Si el buscador está vacío, volvemos a mostrar solo las LIBRES
    if (busqueda.trim() === '') {
      this.jugadorasFiltradas = this.jugadoras.filter(j => !j.nombre_usuario);
    } else {
      // Si hay búsqueda, buscamos en TODO el universo de jugadoras (libres y ocupadas)
      this.jugadorasFiltradas = this.jugadoras.filter(jugadora => {
        const nombreMatch = jugadora.apodo?.toLowerCase().includes(busqueda);
        const posicionMatch = jugadora.posicion?.toLowerCase().includes(busqueda);
        const propietarioMatch = jugadora.nombre_usuario?.toLowerCase().includes(busqueda);
        
        return nombreMatch || posicionMatch || propietarioMatch;
      });
    }

    this.limite = 10; 
  }

  // ... (getTendencia y mostrarMas se quedan igual)
  getTendencia(jugadora: any) {
    if (!jugadora.valor_base || jugadora.valor === jugadora.valor_base) return null;
    const diferencia = jugadora.valor - jugadora.valor_base;
    const porcentaje = (diferencia / jugadora.valor_base) * 100;
    return { valor: Math.abs(porcentaje).toFixed(0), sube: diferencia > 0 };
  }

  mostrarMas() {
    this.limite += 10;
  }
}