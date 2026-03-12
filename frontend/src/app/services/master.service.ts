
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MasterService {
  private baseUrl = 'http://localhost:3000/api/master';

  constructor(private http: HttpClient) {}

   
  getInitialData(id_usuario: number) {
    return this.http.get(`${this.baseUrl}/getInitialData/${id_usuario}`);
  }

  getVirtualDate()
  {
    return this.http.get(`${this.baseUrl}/getVirtualDate`);
  }

  nextDay(data:any) {
    return this.http.post(`${this.baseUrl}/nextDay`, data);
  }

}