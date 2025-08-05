import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  @Output() cerrarModal = new EventEmitter<void>();

  email: string = '';
  password: string = '';

  cerrar() {
    this.cerrarModal.emit();
  }

  entrar() {
    // Aquí haces el login real, pero ahora mismo solo ocultamos
    this.cerrarModal.emit();
  }
}
