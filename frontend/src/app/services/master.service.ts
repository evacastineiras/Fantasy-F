
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MasterService {
  private baseUrl = 'http://localhost:3000/api/master';

  private _mercadoAbierto = new BehaviorSubject<boolean>(false);
  private _mercadoMensaje = new BehaviorSubject<string>('');
  private _fechaVirtual = new BehaviorSubject<string>('');

  mercadoAbierto$ = this._mercadoAbierto.asObservable();
  mercadoMensaje$ = this._mercadoMensaje.asObservable();
  fechaVirtual$ = this._fechaVirtual.asObservable();

  constructor(private http: HttpClient) {}

  get mercadoAbierto(): boolean {
    return this._mercadoAbierto.getValue();
  }


  cargarEstadoMercado(): Observable<any> {
    return this.http.get(`${this.baseUrl}/mercado-estado`).pipe(
      tap((res: any) => {
        this._mercadoAbierto.next(res.abierto);
        this._mercadoMensaje.next(res.mensaje);
      })
    );
  }
   
  getInitialData(id_usuario: number) {
    return this.http.get(`${this.baseUrl}/getInitialData/${id_usuario}`);
  }

  get fechaVirtual(): string {
    return this._fechaVirtual.getValue();
}

  getVirtualDate()
  {
    return this.http.get(`${this.baseUrl}/getVirtualDate`).pipe(
        tap((res: any) => {
            this._fechaVirtual.next(res.fecha);
        })
    );
  }

  nextDay(data:any) {
    return this.http.post(`${this.baseUrl}/nextDay`, data);
  }

  uploadJornada(formData: FormData) {
  return this.http.post(`${this.baseUrl}/importarJornada`, formData);
}

calcularPuntos(numero: number) {
  return this.http.post(`${this.baseUrl}/calcularPuntos/${numero}`, {});
}
}