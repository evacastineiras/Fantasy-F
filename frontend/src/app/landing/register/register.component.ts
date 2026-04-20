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
      window.alert('Las contraseñas no coinciden');
      return;
    }

    

    if(this.nombre == '' || this.username == '' || this.email == '' || this.password == '' || this.confirmPassword == '')
      window.alert("Por favor, rellene todos los campos")
    

    const newUser = {
      nombre: this.nombre,
      username: this.username,
      email: this.email,
      password: this.password,

    };

  

    this.authService.register(newUser).subscribe({
      next: (res:any) => {
        console.log('Registrado correctamente', res);
        this.authService.justRegistered = true;
        localStorage.setItem('usuario', JSON.stringify(res.user));
        this.router.navigate(['./leagueIndex'])
      },
      error: (error:any) => {
        console.error('Error en el registro', error)
        window.alert(error.error.message)
      }
    })
  }

  mostrarLogin()
  {
    this.mostrarLog.emit();
  }
}
