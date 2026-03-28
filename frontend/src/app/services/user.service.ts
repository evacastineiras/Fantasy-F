import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {

    private baseUrl    = 'http://localhost:3000/api/league';
    private authUrl    = 'http://localhost:3000/api';
    private _usuario$ = new BehaviorSubject<any>(this.getUsuario());
    usuario$ = this._usuario$.asObservable();

    constructor(private http: HttpClient) {}


    getUsuario(): any {
        return JSON.parse(localStorage.getItem('usuario') || '{}');
    }

    getUsuario$(): Observable<any> {
        return this.usuario$;
    }

   
    setUsuario(user: any): void {
        localStorage.setItem('usuario', JSON.stringify(user));
        this._usuario$.next(user);
    }

    logout(): void {
        localStorage.removeItem('usuario');
        this._usuario$.next({});
    }

    refreshUsuario(): Observable<any> {
    const usuario = this.getUsuario();
    console.log('refreshUsuario — id:', usuario.id); // temporal para diagnosticar
    if (!usuario?.id) {
        console.warn('refreshUsuario llamado sin usuario logueado');
        return new Observable(obs => obs.complete());
    }
    return this.http.get(`${this.authUrl}/me/${usuario.id}`).pipe(
        tap((user: any) => this.setUsuario(user))
    );
}

    setPresupuesto(presupuesto: number): void {
        this._patchUsuario({ presupuesto });
    }

    setIdLiga(id_liga: number): void {
        this._patchUsuario({ id_liga });
    }

    setIdPlantilla(id_plantilla: number): void {
        this._patchUsuario({ id_plantilla });
    }

    setProfileImage(profileImage: string): void {
        this._patchUsuario({ profileImage });
    }

    setUsername(username: string): void {
        this._patchUsuario({ username });
    }

    private _patchUsuario(patch: Partial<any>): void {
        const actual = this.getUsuario();
        this.setUsuario({ ...actual, ...patch });
    }


    crearLiga(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/createLeague`, data);
    }

    unirseALigaAleatoria(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/publicLeague`, data);
    }

    unirseALigaPrivada(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/privateLeague`, data);
    }

    updateName(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/updateName`, data);
    }

    cambiarLiga(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/changeLeague`, data);
    }

    verClasificacion(idUsuario: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/getClasificacion/${idUsuario}`);
    }
}