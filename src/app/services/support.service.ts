import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface SupportTicketRequest {
  description: string;
  currentUrl: string;
  reporterName: string;
  reporterRole: string;
  localTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Support`;

  sendTicket(ticket: SupportTicketRequest): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/ticket`, ticket);
  }
}
