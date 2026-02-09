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
  dropdownOpen = false;
  userImagePath = this.UserService.getUsuario().profileImage;
  profileImagePreview : string = this.userImagePath ? this.AuthService.backendUrl + this.userImagePath :"../../assets/default-profile.png";
  activeTab: string = 'valor'; 
  jugadora: any;

  constructor( private route: ActivatedRoute, private location: Location, private UserService: UserService, private AuthService: AuthService, private router: Router, private playerService: PlayerService) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    const toSend = {
      id_jugadora: this.id,
      id_usuario: this.UserService.getUsuario().id
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


}
