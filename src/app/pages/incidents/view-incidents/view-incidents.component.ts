import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { IncidentsService } from '../incidents.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-view-incidents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-incidents.component.html',
  styleUrls: ['./view-incidents.component.css']
})
export class ViewIncidentsComponent implements OnInit {
  private incidentesService = inject(IncidentsService);

  residentes = signal<any[]>([]);
  incidentes = signal<any[]>([]);
  residenteSeleccionadoId = signal<number | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.cargarResidentes();
  }

  cargarResidentes() {
    this.incidentesService.getResindets().subscribe(data => this.residentes.set(data));
  }

  onResidentChange(event: any) {
    const id = Number(event.target.value);
    this.residenteSeleccionadoId.set(id);
    this.cargarIncidentes(id);
  }

  cargarIncidentes(id: number) {
    this.loading.set(true);
    this.incidentesService.getIncidentsByResident(id).subscribe({
      next: (data) => {
        this.incidentes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  generarPDF(incidente: any) {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // --- CONFIGURACIÓN DE FORMATO (Basado en imagen cargada) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 91, 181); // Azul Corporativo
    doc.text("HOJA DE REPORTE DE INCIDENCIAS", 105, 25, { align: 'center' }); // 

    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80); // Azul Oscuro
    
    // Fecha y Hora [cite: 2, 3]
    const fechaFormat = new Date(incidente.date).toLocaleDateString();
    const horaFormat = new Date(incidente.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    doc.text(`FECHA: ${fechaFormat}`, 20, 45); // 
    doc.text(`HORA: ${horaFormat}`, 120, 45); // 
    doc.text(`RESIDENTE: ${incidente.residentFullName.toUpperCase()}`, 20, 55);

    // Línea divisoria
    doc.setDrawColor(224, 228, 232);
    doc.line(20, 60, 190, 60);

    // Descripción de los hechos 
    doc.text("DESCRIPCIÓN DE LOS HECHOS", 20, 70); // 
    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(incidente.description.toUpperCase(), 170);
    doc.text(splitText, 20, 80);

    // Información del Personal 
    const footerY = 250;
    doc.line(20, footerY - 5, 190, footerY - 5);
    doc.setFont("helvetica", "bold");
    doc.text("PERSONAL QUE REPORTA", 20, footerY); // [cite: 5]
    doc.setFont("helvetica", "normal");
    doc.text(`(NOMBRE, CARGO Y FIRMA): ${incidente.registeredByUsername.toUpperCase()}`, 20, footerY + 10); // [cite: 6]

    // Nombre de la institución 
    doc.setFontSize(8);
    doc.text("HOGARES FRATERNALES DE JUANACATLÁN A.C.", 105, 285, { align: 'center' }); // 

    // Abrir en nueva pestaña
    window.open(doc.output('bloburl'), '_blank');
  }
}