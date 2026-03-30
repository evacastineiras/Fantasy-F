import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TeamService {

  private apiUrl = 'http://localhost:3000/api/team';

  constructor(private http: HttpClient) {}

  getMyTeam(idUsuario: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/myTeam/${idUsuario}`);
  }

  saveAlineacion(data: {
    id_plantilla: number;
    id_jornada:   number;
    titulares:    { id_entry: number; posicion: string }[];
    suplentes:    { id_entry: number }[];
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/saveAlineacion`, data);
  }
}