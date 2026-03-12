import { Component, OnInit } from '@angular/core';
import { MasterService } from 'src/app/services/master.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-master-panel',
  templateUrl: './master-panel.component.html',
  styleUrls: ['./master-panel.component.css']
})
export class MasterPanelComponent implements OnInit {

  // Objeto para almacenar la respuesta del backend
  estado: any = {
    totalLigas: 0,
    totalUsuarios: 0,
    jornadaActualNumero: 0,
    fechaVirtual: null,
    mercadoAbierto: true
  };

  archivoSeleccionado: File | null = null;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' = 'success';
  id_usuario:number = 1;

  constructor(private masterService: MasterService, private userService: UserService, private Router: Router) { }

  ngOnInit(): void {
    
    this.id_usuario = this.userService.getUsuario().id;
    this.cargarDatos();
  }

  cargarDatos() {
    this.masterService.getInitialData(1).subscribe({
      next: (data: any) => {
        this.estado = data;
        console.log('Datos del panel cargados:', data);
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.mostrarMensaje('Error al conectar con el servidor', 'error');
      }
    });
  }

 
  avanzarTiempo() {
    
    this.masterService.nextDay({}).subscribe({
      next: (res: any) => {
        this.mostrarMensaje(`¡Tiempo avanzado! Nueva fecha: ${res.nuevaFecha}`, 'success');
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al avanzar día:', err);
        this.mostrarMensaje('No se pudo avanzar el tiempo', 'error');
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      this.mostrarMensaje(`Archivo seleccionado: ${file.name}`, 'success');
    }
  }


  procesarPuntos() {
    if (!this.archivoSeleccionado) {
      this.mostrarMensaje('Debes seleccionar un archivo JSON de FotMob', 'error');
      return;
    }

    // Aquí llamarías a la función de tu servicio para subir el archivo
    // Por ahora simulamos la llamada hasta que definamos el endpoint del back
    console.log('Procesando jornada con archivo:', this.archivoSeleccionado.name);
    
    // Ejemplo de cómo sería la llamada real:
    /*
    const formData = new FormData();
    formData.append('jsonFotmob', this.archivoSeleccionado);
    this.masterService.uploadJornada(formData).subscribe(...);
    */
  }

 
  private mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;

    setTimeout(() => {
      this.mensaje = '';
    }, 4000);
  }

  cerrarSesion()
{
  this.userService.logout();
  this.Router.navigate(['/']);
}
cancelarSeleccion(input: HTMLInputElement) {
  this.archivoSeleccionado = null;
  input.value = ''; 
  this.mostrarMensaje('Archivo eliminado', 'success');
}
}

