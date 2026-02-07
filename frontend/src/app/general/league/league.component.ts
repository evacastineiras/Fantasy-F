import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';

// Definimos la forma de los datos para que no de error
interface Participante {
  posicion: number;
  username: string;
  foto: string;
  puntos: number;
}

interface LigaInfo {
  nombre: string;
  id_publico: string | number;
  ranking: Participante[];
}

@Component({
  selector: 'app-league',
  templateUrl: './league.component.html',
  styleUrls: ['./league.component.css']
})
export class LeagueComponent implements OnInit {

  ligaData: any;
  loading: boolean = true;
  showModal: boolean = false;
  nuevoNombreLiga: string = '';
  usuario: any;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
     this.usuario = this.userService.getUsuario();
    
    if (this.usuario && this.usuario.id) {
      this.userService.verClasificacion(this.usuario.id).subscribe({
        next: (data: LigaInfo) => {
          this.ligaData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando la clasificación: ', err);
          this.loading = false;
        }
      });
    }
  }

  isPrivateLeague(): boolean {
    if (!this.ligaData || !this.ligaData.nombre) {
      return false;
    }
    // Si NO empieza por "Liga publica #", entonces es privada y devolvemos true
    return !this.ligaData.nombre.startsWith('Liga publica #');
  }

  // Métodos para el Modal
  openEditModal() {
    this.nuevoNombreLiga = this.ligaData.nombre;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  confirmarCambioNombre() {
    // Validamos que el nombre no esté vacío y sea distinto al actual
    if (this.nuevoNombreLiga && this.nuevoNombreLiga !== this.ligaData.nombre) {
      
      const data = {
        id_liga: this.ligaData.id_publico,
        nuevoNombre: this.nuevoNombreLiga
      };

      // Mantenemos tu forma de hacer la llamada al service
      this.userService.updateName(data).subscribe({
        next: () => {
          this.ligaData.nombre = this.nuevoNombreLiga; // Actualización visual
          this.closeModal(); // Cerramos el popup
        },
        error: (err) => {
          console.error('Error al cambiar el nombre:', err);
          alert('Error al cambiar el nombre');
          this.closeModal();
        }
      });
    } else if (this.nuevoNombreLiga === this.ligaData.nombre) {
      this.closeModal(); // Si es el mismo nombre, solo cerramos
    }
  }

  updateUrl(event: any) {
    event.target.src = 'assets/default-avatar.png';
  }
}