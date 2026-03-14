import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export interface User {
  userId: number;
  workerId: number;
  fullName: string;
  position: string;
  shift: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private myAppUrl = environment.apiUrl; // Usamos la URL del entorno
  private apiUrl = `${this.myAppUrl}/Auth/login`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public currentUserSignal = signal<User | null>(null);

  // --- NUEVO: Computed para verificar si es ADMIN ---
  public isAdmin = computed(() => {
    const user = this.currentUserSignal();
    return user?.position === 'ADMIN';
  });

  constructor(private http: HttpClient) {
    // IMPORTANTE: Recuperar sesión al inicializar el servicio
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson) as User;
      this.currentUserSubject.next(user);
      this.currentUserSignal.set(user);
    }
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(this.apiUrl, { username, password }).pipe(
      tap(user => {
        if (user) {
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSignal.set(user);
          
          // Nombre siempre en MAYÚSCULAS en el log según tu instrucción
          //console.log(`USUARIO AUTENTICADO: ${user.fullName.toUpperCase()} CON ROL: ${user.position}`);
        }
      })
    );
  }

  getCurrentUser(): User | null {
    if (this.currentUserSubject.value) return this.currentUserSubject.value;
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson) as User;
      this.currentUserSubject.next(user);
      this.currentUserSignal.set(user); // Sincronizamos también el signal
      return user;
    }
    return null;
  }

  logout() {
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null); // Limpiamos el signal
    localStorage.removeItem('currentUser');
  }
}