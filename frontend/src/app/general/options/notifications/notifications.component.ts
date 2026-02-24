import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { PlayerService } from 'src/app/services/player.service';



@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notificaciones: any[] = [];
  id_usuario: number;

  constructor(private router: Router, private userService: UserService, private playerService: PlayerService) {
    this.id_usuario = this.userService.getUsuario().id;
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.marcarComoLeidas();
    this.playerService.getPersonalFeed(this.id_usuario).subscribe({
      next: (res: any) => {
        this.notificaciones = res;
      }
    });
  }

  marcarComoLeidas() {
    const toSend = {
      id_usuario: this.id_usuario
    }
    this.playerService.markAsRead(toSend).subscribe();
  }

  aceptarOferta(notif: any) {
    console.log("Oferta aceptada:", notif.payload.id_oferta);
   
  }

  rechazarOferta(notif: any) {
    console.log("Oferta rechazada:", notif.payload.id_oferta);
    // Aquí iría la lógica de tu servicio para rechazar
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}