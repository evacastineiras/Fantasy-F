import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.css']
})
export class MoreComponent implements OnInit {

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {
  }

  consultarReglas()
  {

  }

  verCalendario()
  {

  }

  cambiarLiga()
  {

  }

  abandonarLiga()
  {

  }

  cerrarSesion()
  {
    this.userService.logout();
    this.router.navigate(['/leagueIndex']);

  }
}
