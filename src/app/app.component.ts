import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SupportTicketComponent } from './components/support-ticket/support-ticket.component';
import { SupportAnnouncementComponent } from './components/support-announcement/support-announcement.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SupportTicketComponent, SupportAnnouncementComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'CasaDescanso';
}
