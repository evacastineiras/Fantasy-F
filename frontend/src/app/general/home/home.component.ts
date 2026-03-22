import { Component, OnInit } from '@angular/core';
import { PlayerService } from 'src/app/services/player.service';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { MasterService } from 'src/app/services/master.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  notificaciones: any[] = [];
  limite: number = 20;
  fechaVirtual: Date = new Date();

  constructor(
    private playerService: PlayerService, 
    private userService: UserService, 
    private authService: AuthService, 
    private masterService: MasterService
  ) { }

  ngOnInit(): void {
    const usuario = this.userService.getUsuario();
    if (usuario && usuario.id) {
      this.cargarFeed(usuario.id);
    }
    this.masterService.cargarEstadoMercado().subscribe();
  }

  cargarFeed(id: number) {
    this.playerService.getFeed(id).subscribe({
      next: (res: any) => {
        const baseUrl = this.authService.backendUrl; 
        this.notificaciones = res.map((n: any) => {
       
          const data = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;

     
          const formatearRuta = (ruta: string) => {
            if (!ruta) return 'assets/default-profile.png'; 
            if (ruta.startsWith('http') || ruta.startsWith('assets/')) return ruta; 
            return `${baseUrl}/${ruta}`; 
          };
          return {
            ...n,
            data: {
              ...data,
              avatarVendedor: formatearRuta(data.avatarVendedor),
              avatarComprador: formatearRuta(data.avatarComprador),
              avatar: formatearRuta(data.avatar),
              fotoJugadora: formatearRuta(data.fotoJugadora),
              logoLocal: formatearRuta(data.logoLocal),
              logoVisitante: formatearRuta(data.logoVisitante)
            }
          };
        });

        console.log('Feed cargado y formateado:', this.notificaciones);
      },
      error: (err) => console.error('Error cargando las notificaciones: ', err)
    });
  }

  verMas() {
    this.limite += 10;
  }

  formatearFecha(fechaStr: string): string {
      const fecha = new Date(fechaStr);
      const virtual = new Date(this.masterService.fechaVirtual);

      const mismaFecha = fecha.getDate() === virtual.getDate() &&
                        fecha.getMonth() === virtual.getMonth() &&
                        fecha.getFullYear() === virtual.getFullYear();

      if (mismaFecha) {
          return `a las ${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
      } else {
          return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
      }
  }
}