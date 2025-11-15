import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  constructor(private router: Router, private userService: UserService, private authService: AuthService) { }

  activeUserData = { //No tienen que ser los nombres de la base de datos sino del authcontroller
    nombre: this.userService.getUsuario().nombre,
    username: this.userService.getUsuario().username,
    email: this.userService.getUsuario().email,
    id: this.userService.getUsuario().id,
  }

  ngOnInit(): void {
    console.log(this.activeUserData)
  }

  goHome()
  {
    this.router.navigate(['/home'])
  }

  update()
  {
   console.log("updeteando");
   console.log(this.activeUserData)

   this.authService.editProfile(this.activeUserData).subscribe({
    next: (res:any) => {
      console.log("Datos guardados", res);
      this.userService.logout();
      localStorage.setItem('usuario', JSON.stringify(res.user));
      this.router.navigate(['/profile']);
    },
    error: (error:any) => {
      console.error('Error al editar perfil', error)
    }
   })
  }
}
