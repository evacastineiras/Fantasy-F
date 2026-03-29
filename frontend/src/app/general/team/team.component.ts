import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { TeamService } from 'src/app/services/team.service';
import { UserService } from 'src/app/services/user.service';
 

interface Slot {
  id: string;           // id único del cdkDropList, ej: 'DEL-0'
  posicion: string;     // 'POR' | 'DEF' | 'MED' | 'DEL'
  contenido: any[];     // array de 0 o 1 elemento (la jugadora titular)
}
 

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {
backendUrl = 'http://localhost:3000';
 
  loading    = true;
  guardando  = false;
  benchCollapsed = false;
 
  mercadoAbierto  = false;
  proximaJornada: any = null;
  ultimaJornada:  any = null;
  id_plantilla: number | null = null;
 
  // Jugadoras en el panel lateral (no titulares)
  suplentes: any[] = [];
 
  // Slots del campo: cada posición tiene N slots vacíos según la formación 4-3-3
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
 
        // Todas empiezan como suplentes
        this.suplentes = [...data.jugadoras];
 
        // Si hay alineación guardada, la rehidratamos
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
 
  // ── Setup ────────────────────────────────────────────────────────────────────
 
  private crearSlots(posicion: string, cantidad: number): Slot[] {
    return Array.from({ length: cantidad }, (_, i) => ({
      id:       `${posicion}-${i}`,
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
 
      // Primer slot libre de la posición correcta
      const slotLibre = this.slots[item.posicion]?.find(s => s.contenido.length === 0);
      if (slotLibre) {
        slotLibre.contenido = [jugadora];
        this.suplentes = this.suplentes.filter(s => s.id_entry !== jugadora.id_entry);
      }
    }
  }
 
  // ── Drag & Drop ──────────────────────────────────────────────────────────────
 
  /**
   * Función de predicado para cdkDropListEnterPredicate.
   * Devuelve una función (no el resultado) porque Angular la llama internamente.
   * Permite entrada solo si:
   *  - La posición de la jugadora coincide con la del slot
   *  - El slot está vacío (un slot solo acepta una jugadora)
   */
  canEnterSlot(slot: Slot): (drag: any, drop: any) => boolean {
    return (drag) => {
      const jugadora = drag.data;
      // El slot del banquillo no tiene posición que verificar
      if (!jugadora?.posicion) return true;
      // Si ya tiene jugadora, no se puede soltar encima (el intercambio se gestiona en onDrop)
      if (slot.contenido.length > 0) {
        // Permitimos entrar solo si la posición coincide (el intercambio ocurre en onDrop)
        return jugadora.posicion === slot.posicion;
      }
      return jugadora.posicion === slot.posicion;
    };
  }
 
  /**
   * Handler unificado para todos los drops del campo y del banquillo.
   * Usa transferArrayItem del CDK, que mueve el elemento entre arrays automáticamente.
   * Para el caso de intercambio (slot lleno → slot lleno) hacemos el swap manual.
   */
  onDrop(event: CdkDragDrop<any[]>): void {
    if (!this.mercadoAbierto) return;
    if (event.previousContainer === event.container) return; // reordenación dentro del mismo, ignorar
 
    const origen  = event.previousContainer.data; // array del contenedor origen
    const destino = event.container.data;          // array del contenedor destino
 
    if (destino.length === 0) {
      // Slot destino vacío: transferencia simple
      transferArrayItem(origen, destino, event.previousIndex, event.currentIndex);
    } else {
      // Slot destino ocupado: intercambio entre los dos arrays
      const jugadoraOrigen  = origen[event.previousIndex];
      const jugadoraDestino = destino[0];
 
      // Ponemos la jugadora del destino en el origen
      origen.splice(event.previousIndex, 1, jugadoraDestino);
      // Ponemos la jugadora del origen en el destino
      destino.splice(0, 1, jugadoraOrigen);
    }
  }
 
  // ── Guardar ──────────────────────────────────────────────────────────────────
 
  guardarAlineacion(): void {
    if (!this.mercadoAbierto || !this.id_plantilla || !this.proximaJornada) return;
 
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
      next:  ()    => { this.guardando = false; },
      error: (err) => { console.error('Error guardando:', err); this.guardando = false; }
    });
  }
 
  // ── Helpers ──────────────────────────────────────────────────────────────────
 
  onImgError(event: any): void {
    event.target.src = 'assets/jugadoras/cartas/default.png';
  }
}