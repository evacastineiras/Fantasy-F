import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private baseUrl = 'http://localhost:3000/api';
  public readonly backendUrl = 'http://localhost:3000';
  justRegistered = false;

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post(`${this.baseUrl}/login`, { email, password });
  }

  register(data: any) {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  editProfile(data: any)
  {
    return this.http.post(`${this.baseUrl}/editProfile`, data)
  }

  deleteProfile(id:any)
  {
    return this.http.delete(`${this.baseUrl}/deleteProfile/${id}`);
  }

  changePassword(data: any)
  {
    return this.http.post(`${this.baseUrl}/changePassword`, data)
  }

 getBudgetValue(idUsuario: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/getBudgetValue/${idUsuario}`);
}
}
