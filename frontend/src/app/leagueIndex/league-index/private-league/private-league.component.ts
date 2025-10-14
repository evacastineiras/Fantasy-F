import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-private-league',
  templateUrl: './private-league.component.html',
  styleUrls: ['./private-league.component.css']
})
export class PrivateLeagueComponent implements OnInit {
  @Output() volverAtrasEvent = new EventEmitter<void>();

  constructor(private authService: AuthService,private userService: UserService, private router: Router) { }

  codigo: string = '';
  ngOnInit(): void {
  }
  volverAtras()
  {
    this.volverAtrasEvent.emit();
  }

  unirseALiga()
  {
    console.log(this.codigo);
    const user = {
      id_liga: this.codigo,
      usuario: this.userService.getUsuario().id
    }

    this.userService.unirseALigaPrivada(user).subscribe({
      next: (res:any) => {
        console.log("Unido a liga con éxito", res);
        this.authService.justRegistered = false;
        this.router.navigate(['/home']);
      },
      error: (error:any) => {
        console.error("Error al unirse a liga", error);
      }
    })
  }

}
