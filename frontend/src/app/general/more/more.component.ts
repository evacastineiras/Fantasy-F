import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.css']
})
export class MoreComponent implements OnInit {

  mostrarAux = 1;

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {
  }

  consultarReglas()
  {
    this.mostrarAux = 2;
  }

  verCalendario()
  {
    this.mostrarAux = 3;
  }

  cambiarLiga()
  {
    
  }

  abandonarLiga()
  {

  }

  mostrarBasico()
  {
    this.mostrarAux = 1;
  }

  cerrarSesion()
  {
    this.userService.logout();
    this.router.navigate(['/leagueIndex']);

  }
}
