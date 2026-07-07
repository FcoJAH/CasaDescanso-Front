import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environments';
import * as signalR from '@microsoft/signalr';

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
  
  private hubConnection: signalR.HubConnection | undefined;
  public ticketResolvedEvent = new Subject<any>();
  public newTicketEvent = new Subject<any>();

  startConnection() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const hubUrl = environment.apiUrl.replace('/api', '/hubs/notifications');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR conectadísimo!'))
      .catch(err => console.error('Error conectando a SignalR:', err));

    this.hubConnection.on('ReceiveTicketResolved', (data) => {
      this.ticketResolvedEvent.next(data);
    });

    this.hubConnection.on('ReceiveNewTicket', (data) => {
      this.newTicketEvent.next(data);
    });
  }

  stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

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

  getSistemasNotifications(): Observable<ResolvedTicketNotification[]> {
    return this.http.get<ResolvedTicketNotification[]>(`${this.apiUrl}/notifications/sistemas`);
  }

  markTicketAsRead(id: number): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.apiUrl}/notifications/mark-read/${id}`, {});
  }
}
