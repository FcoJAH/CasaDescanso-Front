import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesService } from '../roles.service';

@Component({
  selector: 'app-ver-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-roles.component.html',
  styleUrls: ['./ver-roles.component.css']
})
export class VerRolesComponent implements OnInit {
  private rolesService = inject(RolesService);
  
  roles = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.rolesService.getRoles().subscribe({
      next: (data) => {
        this.roles.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.isLoading.set(false);
      }
    });
  }
}