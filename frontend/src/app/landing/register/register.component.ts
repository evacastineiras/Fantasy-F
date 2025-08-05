import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() mostrarLog = new EventEmitter<void>();

  nombre: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  constructor() { }

  ngOnInit(): void {
  }

  cerrar()
  {
    this.cerrarModal.emit();
  }

  registrarse()
  {
    console.log("Registrar")
  }

  mostrarLogin()
  {
    this.mostrarLog.emit();
  }
}
