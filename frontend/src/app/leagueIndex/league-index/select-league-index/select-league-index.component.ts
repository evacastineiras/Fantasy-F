import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-select-league-index',
  templateUrl: './select-league-index.component.html',
  styleUrls: ['./select-league-index.component.css']
})
export class SelectLeagueIndexComponent implements OnInit {

  constructor(private UserService: UserService, private router: Router , private authService: AuthService) { }

   @Output() ligaPrivadaShow = new EventEmitter<void>();
   @Output() crearLigaShow = new EventEmitter<void>();

  ngOnInit(): void {
  }

  addToRandomLeague()
  {
    
    const user = {
      usuario: this.UserService.getUsuario().id
    }
    
  this.UserService.unirseALigaAleatoria(user).subscribe({
      next: (res:any) => {
        console.log("Unido a liga", res);
        this.authService.justRegistered = false;
        this.router.navigate(['/home']);
      },
      error: (error:any) => {
        console.error("Error al unirse a liga", error)
      }
    })
  }

  addToPrivateLeague()
  {
    this.ligaPrivadaShow.emit();
  }

  createLeague()
  {
    this.crearLigaShow.emit();
  }

}
