import { Component, EventEmitter, Output } from '@angular/core';

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

  cerrar() {
    this.cerrarModal.emit();
  }

  entrar() {
    // Aquí login real
    this.cerrarModal.emit();
  }

  registrarseDisplay()
  {
    this.abrirRegist.emit();
  }

}
