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
  idUsuarioLogueado: number | null = null;
  mercadoAbierto: boolean = false;

  
  jugadoraSeleccionada: any = null;
  montante: number = 0;
  presupuesto: number = 0;
  pujaMasAlta: number = 0;
  enviando: boolean = false;

  constructor(
    private marketService: MarketService,
    private userService: UserService
  ) {}


  ngOnInit(): void {
    this.idUsuarioLogueado = this.userService.getUsuario().id;
    this.cargarMercado();
  }


  cargarMercado(): void {
    const idUsuario = this.userService.getUsuario().id;

     this.marketService.getMercadoEstado().subscribe({
        next: (estado : any) => { this.mercadoAbierto = estado.abierto; }
    });

    this.marketService.getMarketPlayers(idUsuario).subscribe({
      next: (data) => {
        this.jugadoras = data;
        this.jugadorasFiltradas = this.jugadoras.filter(j => !j.nombre_usuario);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando el mercado:', err);
        this.loading = false;
      }
    });
  }

  filtrar(event: any): void {
    const busqueda = event.target.value.toLowerCase();

    if (busqueda.trim() === '') {
      this.jugadorasFiltradas = this.jugadoras.filter(j => !j.nombre_usuario);
    } else {
      this.jugadorasFiltradas = this.jugadoras.filter(jugadora => {
        const nombreMatch    = jugadora.apodo?.toLowerCase().includes(busqueda);
        const posicionMatch  = jugadora.posicion?.toLowerCase().includes(busqueda);
        const propietarioMatch = jugadora.nombre_usuario?.toLowerCase().includes(busqueda);
        return nombreMatch || posicionMatch || propietarioMatch;
      });
    }

    this.limite = 10;
  }

  getTendencia(jugadora: any) {
    if (!jugadora.valor_base || jugadora.valor === jugadora.valor_base) return null;
    const diferencia = jugadora.valor - jugadora.valor_base;
    const porcentaje = (diferencia / jugadora.valor_base) * 100;
    return { valor: Math.abs(porcentaje).toFixed(0), sube: diferencia > 0 };
  }

  mostrarMas(): void {
    this.limite += 10;
  }

  // ════════════════════════════════════════════════════════════
  // Modal de puja
  // ════════════════════════════════════════════════════════════

  abrirPuja(jugadora: any): void {
    this.jugadoraSeleccionada = jugadora;

    // La puja más alta es ultima_puja si existe, si no el valor de mercado
    this.pujaMasAlta = jugadora.ultima_puja ?? jugadora.valor;
    this.montante    = this.pujaMasAlta + 250_000;
    this.enviando    = false;

    // Cargamos el presupuesto real del usuario
    const usuario = this.userService.getUsuario();
    this.marketService.getPresupuesto(usuario.id, usuario.id_liga).subscribe({
      next:  (data:any) => { this.presupuesto = data.presupuesto; },
      error: ()     => { this.presupuesto = 0; }
    });
  }

  cerrarPuja(): void {
    this.jugadoraSeleccionada = null;
    this.montante  = 0;
    this.presupuesto = 0;
    this.pujaMasAlta = 0;
    this.enviando  = false;
  }

  cerrarSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarPuja();
    }
  }

  // ── Helpers del formulario ───────────────────────────────────

  setPuja(valor: number): void {
    this.montante = valor;
  }

  validarMontante(): void {
    if (!this.montante || this.montante < 0) this.montante = 0;
  }

  pujaValida(): boolean {
    return (
      this.montante >= this.pujaMasAlta + 250_000 &&
      this.montante <= this.presupuesto &&
      !this.enviando
    );
  }

  // Math disponible en la plantilla a través del método helper
  calcularPorcentajePresupuesto(): number {
    if (!this.presupuesto) return 0;
    return Math.min((this.montante / this.presupuesto) * 100, 100);
  }

  // ── Envío ────────────────────────────────────────────────────

  confirmarPuja(): void {
    if (!this.pujaValida() || !this.jugadoraSeleccionada) return;

    this.enviando = true;
    const usuario = this.userService.getUsuario();

    const payload = {
      id_comprador: usuario.id,
      id_jugadora:  this.jugadoraSeleccionada.id_jugadora,
      id_liga:      usuario.id_liga,
      montante:     this.montante
    };

    this.marketService.placeBid(payload).subscribe({
      next: () => {
        this.userService.refreshUsuario().subscribe();
        this.cerrarPuja();
        this.cargarMercado(); 
      },
      error: (err:any) => {
        console.error('Error al pujar:', err);
        this.enviando = false;
      }
    });
  }
}