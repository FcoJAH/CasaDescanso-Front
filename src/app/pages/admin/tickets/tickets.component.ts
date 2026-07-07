import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportService, SupportTicketResponse } from '../../../../services/support.service';

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

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.isLoading.set(true);
    this.supportService.getAllTickets().subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Error al cargar tickets');
        this.isLoading.set(false);
      }
    });
  }

  resolveTicket(id: number) {
    if (!confirm('¿Estás seguro de marcar este ticket como resuelto?')) return;
    
    this.supportService.resolveTicket(id).subscribe({
      next: () => {
        this.loadTickets(); // Recargar para actualizar estados
      },
      error: (err) => {
        console.error(err);
        alert('Hubo un problema al resolver el ticket');
      }
    });
  }
}
