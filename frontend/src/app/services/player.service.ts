
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private baseUrl = 'http://localhost:3000/api/stats';

  constructor(private http: HttpClient) {}

  getTopStats(criterio: string) {
    return this.http.get(`${this.baseUrl}/getTopStats/${criterio}`);
  }

  getFeed(id: number) {
    return this.http.get(`${this.baseUrl}/getFeed/${id}`);
  }

   getPersonalFeed(id: number) {
    return this.http.get(`${this.baseUrl}/getPersonalFeed/${id}`);
  }

   getUnreadCount(id: number) {
    return this.http.get(`${this.baseUrl}/getUnreadCount/${id}`);
  }
   markAsRead(data: any)
  {
    return this.http.post(`${this.baseUrl}/markAsRead`, data);
  }

  getPlayerInfo(data: any)
  {
    return this.http.post(`${this.baseUrl}/getPlayerInfo`, data);
  }
}