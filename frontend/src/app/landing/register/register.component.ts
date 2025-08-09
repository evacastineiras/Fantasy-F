import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';

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
  constructor(private authService: AuthService) { }

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

    const newPlayer = {
      nombre: this.nombre,
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.authService.register(newPlayer).subscribe({
      next: (res:any) => {
        console.log('Registrado correctamente', res);
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
