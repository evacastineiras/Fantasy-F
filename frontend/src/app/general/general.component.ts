import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { PlayerService } from '../services/player.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {

  constructor(private UserService: UserService, private router: Router, private AuthService: AuthService, private PlayerService: PlayerService) { }

  presupuesto = 0;
  valorTotal = 0;
  private usuarioSub!: Subscription;

  ngOnInit(): void {

     console.log('GeneralComponent init — usuario en localStorage:', this.UserService.getUsuario());
      this.usuarioSub = this.UserService.usuario$.subscribe(usuario => {
         console.log('usuario$ emitió:', usuario);
      if (!usuario?.id) return;
 
      this.presupuesto = usuario.presupuesto ?? 0;
         console.log('presupuesto seteado a:', this.presupuesto);
      const imgPath = usuario.profileImage;
      this.profileImagePreview = imgPath
        ? this.AuthService.backendUrl + imgPath
        : '../../assets/default-profile.png';
    });
 
   
    const userId = this.UserService.getUsuario().id;
 
    this.AuthService.getBudgetValue(userId).subscribe({
      next: (res) => { this.valorTotal = res.valor_plantilla; },
      error: (err) => console.error('Error cargando valor del equipo', err)
    });
 
    this.PlayerService.getUnreadCount(userId).subscribe({
      next: (res: any) => { this.unreadNotifications = res.unreadCount; }
    });
  }

   ngOnDestroy(): void {
    // Evitar memory leaks al destruir el componente
    this.usuarioSub?.unsubscribe();
  }
 

  dropdownOpen = false;
  visualNav = 'inicio';
  userImagePath = this.UserService.getUsuario().profileImage;
  profileImagePreview : string = this.userImagePath ? this.AuthService.backendUrl + this.userImagePath :"../../assets/default-profile.png";
  unreadNotifications = 0;

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

showComponent(item:string)
{
  this.visualNav = item;
}

goHome()
{
  this.visualNav = 'inicio'
}

goToProfile() {
  this.router.navigate(['/profile']);
}

goToNotifications() {
  this.router.navigate(['/notifications']);
}

logout() {
  this.UserService.logout();
  this.router.navigate(['/']);
}

}
