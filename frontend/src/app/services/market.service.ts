import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  private apiUrl = 'http://localhost:3000/api/market';

  constructor(private http: HttpClient) { }

   getMarketPlayers(idUsuario: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/marketPlayers/${idUsuario}`);
  }
}
