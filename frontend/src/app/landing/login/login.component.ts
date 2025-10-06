import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() abrirRegist = new EventEmitter<void>();

  email: string = '';
  password: string = '';

  constructor(private authService: AuthService,private userService: UserService) {}

  ngOnInit() :void
  {
    
  }
  cerrar() {
    this.cerrarModal.emit();
  }

  entrar() {
    if(!this.email || !this.password) {
      alert('Por favor, rellena todos los campos');
      return;
    }

    this.authService.login( this.email, this.password).subscribe({
      next: (res: any) => {
        console.log('Login correcto', res);
        localStorage.setItem('usuario', JSON.stringify(res.user));
      },
      error: (err: any) => {
        console.error('Error en login', err)
      }
    });

    this.cerrarModal.emit();
  }

  registrarseDisplay()
  {
    this.abrirRegist.emit();
  }

}
