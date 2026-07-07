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
  screenshotBase64?: string;
}

export interface SupportTicketResponse {
  id: number;
  reporterUserId: number;
  reporterName: string;
  reporterRole: string;
  currentUrl: string;
  description: string;
  status: string;
  isReadByReporter: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface ResolvedTicketNotification {
  id: number;
  description: string;
  currentUrl: string;
  resolvedAt: string;
  isReadByReporter: boolean;
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

  // --- ADMIN (SISTEMAS) ENDPOINTS ---
  getAllTickets(): Observable<SupportTicketResponse[]> {
    return this.http.get<SupportTicketResponse[]>(`${this.apiUrl}/tickets`);
  }

  resolveTicket(id: number): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.apiUrl}/tickets/${id}/resolve`, {});
  }

  // --- USER NOTIFICATIONS ENDPOINTS ---
  getMyResolvedTickets(): Observable<ResolvedTicketNotification[]> {
    return this.http.get<ResolvedTicketNotification[]>(`${this.apiUrl}/notifications/my-resolved-tickets`);
  }

  markTicketAsRead(id: number): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.apiUrl}/notifications/mark-read/${id}`, {});
  }
}
