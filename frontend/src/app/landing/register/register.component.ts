import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() mostrarLog = new EventEmitter<void>();

  nombre: string = '';
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  cerrar()
  {
    this.cerrarModal.emit();
  }

  registrarse()
  {
    if(this.password != this.confirmPassword){
      alert('Las contraseñas no coinciden');
      return;
    }

    const newUser = {
      nombre: this.nombre,
      nombre_usuario: this.username,
      email: this.email,
      password: this.password,

    };

    this.authService.register(newUser).subscribe({
      next: (res:any) => {
        console.log('Registrado correctamente', res);
        this.authService.justRegistered = true;
        this.router.navigate(['./leagueIndex'])
      },
      error: (error:any) => {
        console.error('Error en el registro', error)
      }
    })
      
    console.log("Registrar")
  }

  mostrarLogin()
  {
    this.mostrarLog.emit();
  }
}
