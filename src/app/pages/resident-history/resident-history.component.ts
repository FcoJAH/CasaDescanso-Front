import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResidentesService } from '../residentes/residentes.service';

@Component({
  selector: 'app-resident-history',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule],
  templateUrl: './resident-history.component.html',
  styleUrl: './resident-history.component.css'
})
export class ResidentHistoryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public miFormulario!: FormGroup;

  // Signals para el manejo del popup (muy Angular 19)
  errorMessage = signal('');
  showPopup = signal(false);

  isRegistered = signal(false);
  registeredData = signal<{ username: string; message: string } | null>(null);
  usuarioLogueado = signal<any>(null);
  residentes = signal<any[]>([]);
  usuarios = signal<any[]>([]);
  residentId = signal('');

  ngOnInit() {
    // 1. INICIALIZAR EL FORMULARIO (Esto hace que aparezca la opción por defecto)
    this.miFormulario = this.fb.group({
      residentId: ['', Validators.required]
    });

    this.cargarCatalogos();
  }

  private residentesService = inject(ResidentesService);

  cargarCatalogos() {
    this.residentesService.obtenerActivos().subscribe({
      next: (data) => {
        // Aquí se llena el catálogo que usa el @for del HTML
        this.residentes.set(data);
      },
      error: () => this.errorMessage.set('Error al conectar con la base de datos de residentes')
    });
  }

  goToProfile(event: any) {
    const id = event.target.value;
    if (id) {
      this.router.navigate(['/resident-profile', id]);
    }
  }
}