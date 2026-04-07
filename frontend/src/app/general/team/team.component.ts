import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { TeamService } from 'src/app/services/team.service';
import { UserService } from 'src/app/services/user.service';

interface Slot {
  id: string;
  posicion: string;
  contenido: any[];
}

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {

  backendUrl = 'http://localhost:3000/';

  loading    = true;
  guardando  = false;
  benchCollapsed = false;

  mercadoAbierto  = false;
  proximaJornada: any = null;
  ultimaJornada:  any = null;
  id_plantilla: number | null = null;

  suplentes: any[] = [];

  slots: { [pos: string]: Slot[] } = {
    DEL: this.crearSlots('DEL', 3),
    MED: this.crearSlots('MED', 3),
    DEF: this.crearSlots('DEF', 4),
    POR: this.crearSlots('POR', 1),
  };

  constructor(
    private teamService: TeamService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const idUsuario = this.userService.getUsuario().id;
    this.teamService.getMyTeam(idUsuario).subscribe({
      next: (data) => {
        this.mercadoAbierto = data.mercadoAbierto;
        this.proximaJornada = data.proximaJornada;
        this.ultimaJornada  = data.ultimaJornada;
        this.id_plantilla   = data.id_plantilla;
        this.suplentes = [...data.jugadoras];

        if (data.alineacionGuardada?.items?.length) {
          this.rehidratarAlineacion(data.alineacionGuardada.items, data.jugadoras);
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando equipo:', err);
        this.loading = false;
      }
    });
  }

  private crearSlots(posicion: string, cantidad: number): Slot[] {
    return Array.from({ length: cantidad }, (_, i) => ({
      id: `${posicion}-${i}`,
      posicion,
      contenido: []
    }));
  }

  private rehidratarAlineacion(items: any[], todasJugadoras: any[]): void {
    const jugadoraMap = new Map(todasJugadoras.map(j => [j.id_entry, j]));

    for (const item of items) {
      if (!item.es_titular) continue;
      const jugadora = jugadoraMap.get(item.id_entry);
      if (!jugadora) continue;

      const slotLibre = this.slots[item.posicion]?.find(s => s.contenido.length === 0);
      if (slotLibre) {
        slotLibre.contenido = [jugadora];
        this.suplentes = this.suplentes.filter(s => s.id_entry !== jugadora.id_entry);
      }
    }
  }



  private esSlotDelCampo(containerId: string): boolean {
    return containerId !== 'bench';
  }

  private getSlotPorId(id: string): Slot | null {
    for (const slotArr of Object.values(this.slots)) {
      const slot = slotArr.find(s => s.id === id);
      if (slot) return slot;
    }
    return null;
  }

  canEnterSlot(slot: Slot): (drag: any) => boolean {
    return (drag) => {
      const jugadora = drag.data;
      if (!jugadora?.posicion) return true;
      return jugadora.posicion === slot.posicion;
    };
  }

  onDrop(event: CdkDragDrop<any[]>): void {
    if (!this.mercadoAbierto) return;
    if (event.previousContainer === event.container) return;

    const origenId  = event.previousContainer.id;
    const destinoId = event.container.id;
    const origen    = event.previousContainer.data;
    const destino   = event.container.data;
    const jugadoraArrastrada = origen[event.previousIndex];

    //slot a campo
    if (!this.esSlotDelCampo(origenId) && this.esSlotDelCampo(destinoId)) {
      const slotDestino = this.getSlotPorId(destinoId);
      if (!slotDestino) return;


      if (jugadoraArrastrada.posicion !== slotDestino.posicion) return;

      if (destino.length === 0) {
      
        transferArrayItem(origen, destino, event.previousIndex, 0);
      } else {
   
        const jugadoraDesplazada = destino[0];
        destino.splice(0, 1, jugadoraArrastrada);
        origen.splice(event.previousIndex, 1);
        this.suplentes.push(jugadoraDesplazada);
      }
      return;
    }

    // ──slot a banquillo
    if (this.esSlotDelCampo(origenId) && !this.esSlotDelCampo(destinoId)) {
      // Vaciar el slot y devolver la jugadora al banquillo sin intercambio
      origen.splice(event.previousIndex, 1);
      this.suplentes.push(jugadoraArrastrada);
      return;
    }

    //slot intercambio
    if (this.esSlotDelCampo(origenId) && this.esSlotDelCampo(destinoId)) {
      const slotDestino = this.getSlotPorId(destinoId);
      if (!slotDestino) return;

    
      if (jugadoraArrastrada.posicion !== slotDestino.posicion) return;

      if (destino.length === 0) {
        transferArrayItem(origen, destino, event.previousIndex, 0);
      } else {
      
        const jugadoraDestino = destino[0];
        destino.splice(0, 1, jugadoraArrastrada);
        origen.splice(event.previousIndex, 1, jugadoraDestino);
      }
      return;
    }
  }

 

  guardarAlineacion(): void {
    if (!this.mercadoAbierto || !this.id_plantilla || !this.proximaJornada) {console.log("algo fallo en el guardaespaldas. "); return;}

    const titulares: { id_entry: number; posicion: string }[] = [];
    const suplentesPayload: { id_entry: number }[] = [];

    for (const [pos, slotArr] of Object.entries(this.slots)) {
      for (const slot of slotArr) {
        if (slot.contenido.length > 0) {
          titulares.push({ id_entry: slot.contenido[0].id_entry, posicion: pos });
        }
      }
    }

    for (const sup of this.suplentes) {
      suplentesPayload.push({ id_entry: sup.id_entry });
    }

    this.guardando = true;
    this.teamService.saveAlineacion({
      id_plantilla: this.id_plantilla,
      id_jornada:   this.proximaJornada.id_jornada,
      titulares,
      suplentes:    suplentesPayload
    }).subscribe({
      next:  ()    => { this.guardando = false; console.log("eoeoeoe") },
      error: (err) => { console.error('Error guardando:', err); this.guardando = false; }
    });
  }

  onImgError(event: any): void {
    event.target.src = '../../../assets/default-card.png';
  }
}