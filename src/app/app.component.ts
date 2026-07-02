import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupportTicketComponent } from './components/support-ticket/support-ticket.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SupportTicketComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'CasaDescanso-Front';
}
