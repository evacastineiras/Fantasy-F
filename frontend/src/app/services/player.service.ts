
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private baseUrl = 'http://localhost:3000/api/stats';

  constructor(private http: HttpClient) {}

  getTopStats(criterio: string) {
    return this.http.get(`${this.baseUrl}/getTopStats/${criterio}`);
  }

  getPlayerInfo(data: any)
  {
    return this.http.post(`${this.baseUrl}/getPlayerInfo`, data);
  }
}