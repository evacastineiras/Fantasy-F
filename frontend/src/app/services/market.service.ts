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

   modifyClause(data: any)
  {
    return this.http.post(`${this.apiUrl}/modifyClause`, data)
  }

   payClause(data: any)
  {
    return this.http.post(`${this.apiUrl}/payClause`, data)
  }

  marketSell(data:any)
  {
    return this.http.post(`${this.apiUrl}/marketSell`, data)
  }

   makeOffer(data:any)
  {
    return this.http.post(`${this.apiUrl}/makeOffer`, data)
  }

   acceptOffer(data:any)
  {
    return this.http.post(`${this.apiUrl}/acceptOffer`, data)
  }

   rejectOffer(data:any)
  {
    return this.http.post(`${this.apiUrl}/rejectOffer`, data)
  }

  getPresupuesto(idUsuario: number, idLiga: number): Observable<{ presupuesto: number }> {
  return this.http.get<{ presupuesto: number }>(
    `${this.apiUrl}/presupuesto/${idUsuario}/${idLiga}`
  );
}

getMercadoEstado(): Observable<{ abierto: boolean, mensaje: string }> {
    return this.http.get<{ abierto: boolean, mensaje: string }>(
        `${this.apiUrl}/mercadoEstado`
    );
}

  placeBid(data: {
  id_comprador: number;
  id_jugadora: number;
  id_liga: number;
  montante: number;
}): Observable<any> {
  return this.http.post(`${this.apiUrl}/puja-libre`, data);
}
}
