import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common'; //funcion de angular que funciona como un paso atrás. Mantiene filters y scroll.
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { MarketService } from '../services/market.service';
import { PlayerService } from '../services/player.service';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.component.html',
  styleUrls: ['./player-detail.component.css']
})
export class PlayerDetailComponent implements OnInit {

  id: string | null = null;
  idUsuarioLogueado: number | null = null;
  dropdownOpen = false;
  userImagePath = this.UserService.getUsuario().profileImage;
  profileImagePreview : string = this.userImagePath ? this.AuthService.backendUrl + this.userImagePath :"../../assets/default-profile.png";
  activeTab: string = 'valor'; 
  jugadora: any;
  showModalClausula: boolean = false;
  nuevaClausula: number = 0;
  showModalVender: boolean = false;
  showModalPagar: boolean = false;
  showModalOfrecer: boolean = false;
  ofertaRealizada: number = 0;
  valueChart: Chart | null = null;
  @ViewChild('valueChartCanvas') valueChartCanvas!: ElementRef<HTMLCanvasElement>;
  unreadNotifications = 0;
  showModalPuja: boolean = false;
  montante: number = 0;
  presupuesto: number = 0;
  pujaMasAlta: number = 0;
  enviando: boolean = false;
  mercadoAbierto: boolean = false;

  constructor( private route: ActivatedRoute, private location: Location, private UserService: UserService, private AuthService: AuthService, private router: Router, private playerService: PlayerService, private marketService: MarketService) { }

  ngOnDestroy() {
    if (this.valueChart) this.valueChart.destroy();
}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.idUsuarioLogueado = this.UserService.getUsuario().id;

    this.marketService.getMercadoEstado().subscribe({
        next: (estado: any) => { this.mercadoAbierto = estado.abierto; }
    });
    this.cargarDatosJugadora();
    const toSend = {
      id_jugadora: this.id,
      id_usuario: this.idUsuarioLogueado
    }

    this.playerService.getPlayerInfo(toSend).subscribe({
      next: (res:any) => {
         this.jugadora = res.player;
         this.jugadora.total_tarjetas = (this.jugadora.amarillas_total || 0) + (this.jugadora.rojas_total || 0);
          setTimeout(() => this.cargarGraficoValor(), 0);
      },
      error: (error:any) => {
        console.error('Error al recibir informacion', error);
      }
    });

    this.playerService.getUnreadCount(this.UserService.getUsuario().id).subscribe({
    next: (res: any) => {
      this.unreadNotifications = res.unreadCount;
    }
  });
  }

  cargarDatosJugadora() {
    const toSend = { id_jugadora: this.id, id_usuario: this.idUsuarioLogueado };
    this.playerService.getPlayerInfo(toSend).subscribe({
      next: (res: any) => {
        this.jugadora = res.player;
        this.jugadora.total_tarjetas = (this.jugadora.amarillas_total || 0) + (this.jugadora.rojas_total || 0);
        setTimeout(() => this.cargarGraficoValor(), 0);
      }});
  }

  abrirOfrecer() {
  this.ofertaRealizada = this.jugadora.valor; 
  this.showModalOfrecer = true;
}

confirmarOferta() {
 
  if (!this.ofertaRealizada || this.ofertaRealizada <= 0) {
    window.alert("Por favor, introduce un montante válido para la oferta.");
    return;
  }

   if (this.UserService.getUsuario().presupuesto < this.ofertaRealizada) {
    window.alert("No dispones del presupuesto suficiente para realizar esa oferta.");
    return;
  }

  const usuarioActual = this.UserService.getUsuario();


  const body = {
    id_comprador: usuarioActual.id,
    id_vendedor: this.jugadora.id_propietario, 
    id_jugadora: this.id,
    id_liga: usuarioActual.id_liga,
    montante: this.ofertaRealizada
  };
  console.log(body)


  this.marketService.makeOffer(body).subscribe({
    next: (res:any) => {
      console.log('Oferta procesada:', res.message);
      this.showModalOfrecer = false;
      
      alert(`¡Oferta de ${this.ofertaRealizada}€ enviada a su dueño!`);
      
      this.ofertaRealizada = 0;
    },
    error: (err) => {
      console.error('Error al enviar oferta:', err);
      alert(err.error.message || "Error al procesar la oferta. Inténtalo de nuevo.");
    }
  });
}

abrirVender() { this.showModalVender = true; }
abrirPagar() { this.showModalPagar = true; }
cerrarModales() { 
  this.showModalVender = false; 
  this.showModalPagar = false; 
}

confirmarVenta() {
 
  const data = {
    id_usuario: this.idUsuarioLogueado,
    id_jugadora: this.id,
    id_liga: this.UserService.getUsuario().id_liga
  }
  this.marketService.marketSell(data).subscribe({
    next: (res:any) => {
         console.log(res.message);
        this.location.back();
      },
      error: (error:any) => {
        console.error('Error:', error);
      }
  })
  this.cerrarModales();
}

confirmarPagoClausula() {

  if(this.UserService.getUsuario().presupuesto >= this.jugadora.clausula){
  console.log("Pagando cláusula de:", this.jugadora.apodo);
  const data = {
    id_usuario: this.idUsuarioLogueado,
    id_jugadora: this.id,
    id_clausula: this.jugadora.clausula,
    id_propietario: this.jugadora.id_propietario,
    id_entry: this.jugadora.id_entry
  }
  this.marketService.payClause(data).subscribe({
      next: (res:any) => {
         console.log(res.message);
         this.jugadora.clausula = this.jugadora.valor;
         this.jugadora.id_propietario = this.idUsuarioLogueado;

      },
      error: (error:any) => {
        console.error('Error:', error);
      }
    })
  } else{
    window.alert("No dispones de presupuesto suficiente");
  }
  this.cerrarModales();
}

abrirModalClausula() {
  this.nuevaClausula = this.jugadora.clausula; 
  this.showModalClausula = true;
}

cerrarModal() {
  this.showModalClausula = false;
}


confirmarNuevaClausula() {
  if(this.nuevaClausula > (this.jugadora.valor * 1.40))
  {
    window.alert("La nueva cláusula no puede sobrepasar el valor de mercado en más del 40%");
  } else {
    const data = {
      id_usuario: this.idUsuarioLogueado,
      id_jugadora: this.id,
      nueva_clausula: this.nuevaClausula
    }

    this.marketService.modifyClause(data).subscribe({
      next: (res:any) => {
         console.log(res.message);
         this.jugadora.clausula = res.nueva_clausula
      },
      error: (error:any) => {
        console.error('Error:', error);
      }
    })

    
  }
  this.showModalClausula = false;
}


  selectTab(tab: string)
  {
    this.activeTab = tab;
     if (tab === 'valor') {
        setTimeout(() => this.cargarGraficoValor(), 0);
    }
  }

  volver() {
    this.location.back(); //Funcion de volver atrás.
  }

  toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
}

@HostListener('document:click', ['$event'])
handleClickOutside(event: MouseEvent)
{
  const target = event.target as HTMLElement;
  const clickdentro = target.closest('.profile-wrapper');
  if(!clickdentro)
    this.dropdownOpen = false;
}


goToProfile() {
  this.router.navigate(['/profile']);
}

goToNotifications() {
  this.router.navigate(['/notifications']);
}

goHome()
{
  this.router.navigate(['/home']);
}

logout() {
  this.UserService.logout();
  this.router.navigate(['/']);
}

pujar()
{
  if (!this.mercadoAbierto) return;
   
    this.pujaMasAlta = this.jugadora.ultima_puja ?? this.jugadora.valor;
    this.montante = this.pujaMasAlta + 250000;
    this.showModalPuja = true;

    
    const usuario = this.UserService.getUsuario();
    this.marketService.getPresupuesto(usuario.id, usuario.id_liga).subscribe({
      next: (data: any) => { this.presupuesto = data.presupuesto; }
    });
}

cargarGraficoValor() {
    const body = { id_jugadora: this.id, id_usuario: this.idUsuarioLogueado };

    this.playerService.getPlayerValueHistory(body).subscribe({
        next: (res: any) => {
            // Actualizar el valor mostrado debajo del gráfico
            this.jugadora.valor = this.redondearValor(res.valorActual);

            const labels = res.historial.map((p: any) =>
                p.jornada === 0 ? 'Inicio' : `J${p.jornada}`
            );
            const valores = res.historial.map((p: any) => p.valor);

            if (this.valueChart) {
                this.valueChart.destroy();
            }

            const ctx = this.valueChartCanvas.nativeElement.getContext('2d');
            if (!ctx) return;

            this.valueChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Valor de mercado',
                        data: valores,
                        borderColor: '#b46ee6',
                        backgroundColor: 'rgba(188, 30, 255, 0.08)',
                        pointBackgroundColor: '#b46ee6',
                        pointBorderColor: '#1a1a1a',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.35,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx: any) => ` ${ctx.parsed.y.toLocaleString('es-ES')}€`
                            },
                            backgroundColor: '#1e1e1e',
                            titleColor: '#aaa',
                            bodyColor: '#b46ee6',
                            borderColor: '#333',
                            borderWidth: 1,
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#888' },
                            grid: { color: '#2a2a2a' }
                        },
                        y: {
                            ticks: {
                                color: '#888',
                                callback: (v) => `${Number(v).toLocaleString('es-ES')}€`
                            },
                            grid: { color: '#2a2a2a' }
                        }
                    }
                }
            });
        },
        error: (err) => console.error('Error al cargar historial de valor:', err)
    });
}

redondearValor(valor: number): number {
    if (valor >= 1000000)  return Math.round(valor / 10000) * 10000;   // ≥1M  → redondeo a 10.000
    return Math.round(valor / 1000) * 1000;                             // resto → redondeo a 1.000
}

cerrarPuja() {
    this.showModalPuja = false;
    this.enviando = false;
  }

  setPuja(valor: number) {
    this.montante = valor;
  }

  validarMontante() {
    if (!this.montante || this.montante < 0) this.montante = 0;
  }

  pujaValida(): boolean {
    return (
      this.montante >= this.pujaMasAlta + 250000 &&
      this.montante <= this.presupuesto &&
      !this.enviando
    );
  }

  calcularPorcentajePresupuesto(): number {
    if (!this.presupuesto) return 0;
    return Math.min((this.montante / this.presupuesto) * 100, 100);
  }

  confirmarPuja() {
    if (!this.pujaValida()) return;

    this.enviando = true;
    const usuario = this.UserService.getUsuario();

    const payload = {
      id_comprador: usuario.id,
      id_jugadora: this.jugadora.id_jugadora,
      id_liga: usuario.id_liga,
      montante: this.montante
    };

    this.marketService.placeBid(payload).subscribe({
      next: () => {
        this.UserService.refreshUsuario().subscribe();
      this.cerrarPuja();
      this.cargarDatosJugadora();
        alert('¡Puja realizada con éxito!');
        this.cerrarPuja();
        this.cargarDatosJugadora(); 
      },
      error: (err) => {
        console.error('Error al pujar:', err);
        this.enviando = false;
      }
    });
  }

}
