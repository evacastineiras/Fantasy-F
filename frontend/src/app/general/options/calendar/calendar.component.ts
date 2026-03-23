import { Component, OnInit } from '@angular/core';
import { MasterService } from 'src/app/services/master.service';

@Component({
    selector: 'app-calendar',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {

    mesActual: number = 0;
    anyoActual: number = 0;
    fechaVirtual: string = '';
    diasCalendario: any[] = [];
    diaSeleccionado: any = null;

    nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    constructor(private masterService: MasterService) {}

    ngOnInit(): void {
  
      this.cargarCalendario();
    }

    cargarCalendario() {
        this.diaSeleccionado = null;
        this.masterService.getCalendario(this.mesActual, this.anyoActual).subscribe({
            next: (res: any) => {
                this.fechaVirtual = res.fechaVirtual;
               if (this.mesActual === 0 && this.anyoActual === 0) {
                const fV = new Date(res.fechaVirtual);
                this.mesActual = fV.getMonth() + 1;
                this.anyoActual = fV.getFullYear();
            }
                this.construirDias(res);
            },
            error: (err) => console.error('Error cargando calendario:', err)
        });
    }

    construirDias(data: any) {
        const { partidos, jornadas, ventanasMercado } = data;
        const diasEnMes = new Date(this.anyoActual, this.mesActual, 0).getDate();

        // Día de la semana del día 1 (0=Dom, convertir a Lun=0)
        let primerDia = new Date(this.anyoActual, this.mesActual - 1, 1).getDay();
        primerDia = primerDia === 0 ? 6 : primerDia - 1;

        // Rellenar huecos vacíos al principio
        const dias: any[] = Array(primerDia).fill(null);

        for (let d = 1; d <= diasEnMes; d++) {
            const fechaStr = `${this.anyoActual}-${String(this.mesActual).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

            const partidosDia = partidos.filter((p: any) =>
                p.fecha.split('T')[0] === fechaStr
            );

            const jornadaDia = jornadas.find((j: any) =>
                j.f_inicio.split('T')[0] <= fechaStr && j.f_fin.split('T')[0] >= fechaStr
            );

            const mercadoDia = ventanasMercado.find((v: any) =>
                v.abre <= fechaStr && v.cierra > fechaStr
            );

            const esHoy = fechaStr === this.fechaVirtual;
            const esPasado = fechaStr < this.fechaVirtual;

            dias.push({
                dia: d,
                fecha: fechaStr,
                esHoy,
                esPasado,
                partidos: partidosDia,
                jornada: jornadaDia || null,
                mercado: mercadoDia || null,
                tienePartido: partidosDia.length > 0,
                mercadoAbre: ventanasMercado.some((v: any) => v.abre === fechaStr),
                mercadoCierra: ventanasMercado.some((v: any) => v.cierra === fechaStr),
                inicioJornada: jornadas.some((j: any) => j.f_inicio.split('T')[0] === fechaStr),
                finJornada: jornadas.some((j: any) => j.f_fin.split('T')[0] === fechaStr),
            });
        }

        this.diasCalendario = dias;
    }

    seleccionarDia(dia: any) {
        if (!dia) return;
        this.diaSeleccionado = this.diaSeleccionado?.fecha === dia.fecha ? null : dia;
    }

    mesAnterior() {
        if (this.mesActual === 1) {
            this.mesActual = 12;
            this.anyoActual--;
        } else {
            this.mesActual--;
        }
        this.cargarCalendario();
    }

    mesSiguiente() {
        if (this.mesActual === 12) {
            this.mesActual = 1;
            this.anyoActual++;
        } else {
            this.mesActual++;
        }
        this.cargarCalendario();
    }

    get nombreMesActual(): string {
        return this.nombresMeses[this.mesActual - 1];
    }
}