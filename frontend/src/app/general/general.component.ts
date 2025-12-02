import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {

  constructor(private UserService: UserService, private router: Router, private AuthService: AuthService) { }

  ngOnInit(): void {
  }

  dropdownOpen = false;
  visualNav = 'liga';
  userImagePath = this.UserService.getUsuario().profileImage;
  profileImagePreview : string = this.userImagePath ? this.AuthService.backendUrl + this.userImagePath :"../../assets/default-profile.png";

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
  // Navegar a notificaciones
}

logout() {
  this.UserService.logout();
  this.router.navigate(['/']);
}

}
