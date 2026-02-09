import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common'; //funcion de angular que funciona como un paso atrás. Mantiene filters y scroll.
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { PlayerService } from '../services/player.service';
import { Router } from '@angular/router';

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

  constructor( private route: ActivatedRoute, private location: Location, private UserService: UserService, private AuthService: AuthService, private router: Router, private playerService: PlayerService) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.idUsuarioLogueado = this.UserService.getUsuario().id;
    const toSend = {
      id_jugadora: this.id,
      id_usuario: this.idUsuarioLogueado
    }

    this.playerService.getPlayerInfo(toSend).subscribe({
      next: (res:any) => {
         this.jugadora = res.player;
         this.jugadora.total_tarjetas = (this.jugadora.amarillas_total || 0) + (this.jugadora.rojas_total || 0);
         console.log(this.jugadora);
      },
      error: (error:any) => {
        console.error('Error al recibir informacion', error);
      }
    });
  }

  abrirOfrecer() {
  this.ofertaRealizada = this.jugadora.valor; 
  this.showModalOfrecer = true;
}

confirmarOferta() {
  console.log(`Oferta enviada por ${this.jugadora.apodo}: ${this.ofertaRealizada}€`);
  // Aquí irá la lógica para guardar la puja en la base de datos
  this.showModalOfrecer = false;
}

abrirVender() { this.showModalVender = true; }
abrirPagar() { this.showModalPagar = true; }
cerrarModales() { 
  this.showModalVender = false; 
  this.showModalPagar = false; 
}

confirmarVenta() {
  console.log("Vendiendo a:", this.jugadora.apodo);
  // Aquí irá la llamada a la API
  this.cerrarModales();
}

confirmarPagoClausula() {
  console.log("Pagando cláusula de:", this.jugadora.apodo);
  // Aquí irá la llamada a la API
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
  console.log('Nueva cláusula a guardar:', this.nuevaClausula);
  this.showModalClausula = false;
}


  selectTab(tab: string)
  {
    this.activeTab = tab;
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
  // Navegar a notificaciones
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
  
}



}
