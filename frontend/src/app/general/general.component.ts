import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  dropdownOpen = false;
  visualNav = 'mas';

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
  // Navegar al perfil
}

goToNotifications() {
  // Navegar a notificaciones
}

logout() {
  // Lógica de logout
}

}
