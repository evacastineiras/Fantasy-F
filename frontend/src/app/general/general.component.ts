import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { PlayerService } from '../services/player.service';


@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {

  constructor(private UserService: UserService, private router: Router, private AuthService: AuthService, private PlayerService: PlayerService) { }

  presupuesto = 0;
  valorTotal = 0;

  ngOnInit(): void {

    const userId = this.UserService.getUsuario().id;
    this.AuthService.getBudgetValue(userId).subscribe({
      next: (res) => {
        this.presupuesto = res.presupuesto;
        this.valorTotal = res.valor_plantilla;
      },
      error: (err) => console.error('Error cargando presupuesto')
    });

    this.PlayerService.getUnreadCount(userId).subscribe({
    next: (res: any) => {
      this.unreadNotifications = res.unreadCount;
    }
  });
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
