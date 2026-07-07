import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportService, SupportTicketResponse } from '../../../services/support.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css']
})
export class TicketsComponent implements OnInit {
  private supportService = inject(SupportService);
  
  tickets = signal<SupportTicketResponse[]>([]);
  isLoading = signal(true);
  error = signal('');

  ticketToResolve = signal<number | null>(null);

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.isLoading.set(true);
    this.supportService.getAllTickets().subscribe({
      next: (data: SupportTicketResponse[]) => {
        this.tickets.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error(err);
        this.error.set('Error al cargar tickets');
        this.isLoading.set(false);
      }
    });
  }

  confirmResolve(id: number) {
    this.ticketToResolve.set(id);
  }

  cancelResolve() {
    this.ticketToResolve.set(null);
  }

  executeResolve() {
    const id = this.ticketToResolve();
    if (id === null) return;

    this.supportService.resolveTicket(id).subscribe({
      next: () => {
        this.ticketToResolve.set(null);
        this.loadTickets(); // Recargar para actualizar estados
      },
      error: (err: any) => {
        console.error(err);
        this.ticketToResolve.set(null);
        alert('Hubo un problema al resolver el ticket');
      }
    });
  }
}
