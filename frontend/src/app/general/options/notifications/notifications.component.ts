import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { PlayerService } from 'src/app/services/player.service';
import { MarketService } from 'src/app/services/market.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notificaciones: any[] = [];
  id_usuario: number;
  limite: number = 20;

  constructor(
    private router: Router, 
    private userService: UserService, 
    private playerService: PlayerService,
    private marketService: MarketService
  ) {
    this.id_usuario = this.userService.getUsuario().id;
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
  }



cargarNotificaciones() {
    this.playerService.getPersonalFeed(this.id_usuario).subscribe({
        next: (res: any) => {
            this.notificaciones = res;
            console.log(this.notificaciones)
            this.marcarComoLeidas();
        }
    });
}

  marcarComoLeidas() {
    this.playerService.markAsRead({ id_usuario: this.id_usuario }).subscribe();
  }

  aceptarOferta(notif: any) {
    const id_puja = notif.payload.id_puja;
    
    if (confirm(`¿Aceptar la oferta de ${notif.payload.montante.toLocaleString()}€?`)) {
      this.marketService.acceptOffer({ id_puja , id_notificacion: notif.id_notificacion }).subscribe({
        next: () => {
          alert('¡Venta realizada!');
          this.cargarNotificaciones(); 
        },
        error: (err) => alert(err.error.message)
      });
    }
  }

  rechazarOferta(notif: any) {
    this.marketService.rejectOffer({ id_puja: notif.payload.id_puja , id_notificacion: notif.id_notificacion}).subscribe({
      next: () => {
        console.log(notif)
        this.cargarNotificaciones();
      }
    });
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  verMas() {
    this.limite += 10;
  }
}