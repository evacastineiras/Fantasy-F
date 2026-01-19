import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})

export class UserService 
{
    private baseUrl = 'http://localhost:3000/api/league';
    constructor(private http: HttpClient) {}

    getUsuario()
    {
        return JSON.parse(localStorage.getItem('usuario')|| '{}');
    }

    logout()
    {
        localStorage.removeItem('usuario');
    }

    crearLiga(data:any)
    {
        return this.http.post(`${this.baseUrl}/createLeague`, data);
    } 

    unirseALigaAleatoria(data:any)
    {
        return(this.http.post(`${this.baseUrl}/publicLeague`, data));
    }

    unirseALigaPrivada(data: any)
    {
        return(this.http.post(`${this.baseUrl}/privateLeague`, data));
    }

    cambiarLiga(data: any)
    {
        return(this.http.post(`${this.baseUrl}/changeLeague`, data))
    }
}
