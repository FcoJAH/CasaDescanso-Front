import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { IncidentsService } from '../incidents.service';
import jsPDF from 'jspdf';
import { lastValueFrom } from 'rxjs';

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

  obtenerFechaHoraGDL(): string {
    return new Date().toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Ejemplo de salida: "21/03/2026, 13:15:00"

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

  async generarPDF(incidente: any) {
    try {
      incidente.id
      // 1. Forzamos el tipo a 'any' (objeto) para que TS no busque un array
      const data = await lastValueFrom(this.incidentesService.getResidentsById(incidente.residentId)) as any;

      if (!data) return;

      // 2. Hacemos lo mismo con el trabajador (asegúrate de usar el ID correcto del trabajador)
      const dataWork = await lastValueFrom(this.incidentesService.getWorkerById(incidente.registeredByUserId)) as any;

      if (!dataWork) return;

      // 3. Construcción de nombres con validación de nulos (filter quita los null/undefined)
      const nombreCompleto = [
        data.firstName,
        data.lastName,
        data.middleName
      ].filter(n => n && n !== 'N/A').join(' ');

      const nombreCompletoWork = [
        dataWork.firstName,
        dataWork.lastName,
        dataWork.middleName
      ].filter(n => n && n !== 'N/A').join(' ');

      // Ahora puedes usar estas variables en tu jsPDF sin errores de compilación
      console.log("Residente:", nombreCompleto);
      console.log("Trabajador:", nombreCompletoWork);

      this.siGenerarPDF(incidente, nombreCompleto, nombreCompletoWork)

    } catch (error) {
      console.error("Error al obtener datos para el PDF", error);
    }
  }

  siGenerarPDF(incidente: any, nombreCompleto: string, nombreWork: string) {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    // Definición de colores con Tipado Estricto (Tuplas)
    const azulCorp: [number, number, number] = [0, 91, 181];
    const img = new Image();
    img.src = '../images/CD_Logo_Pequeno.png';
    const azulOscuro: [number, number, number] = [44, 62, 80];

    // --- ENCABEZADO CORPORATIVO ---
    doc.setFillColor(...azulCorp);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Hogares Fraternales de Juancatlán A.C.', 14, 25);

    if (img) {
      // Posición X: 165, Y: 5, Ancho: 30, Alto: 30
      doc.addImage(img, 'PNG', 165, 5, 30, 30);
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('HOJA DE REPORTE DE INCIDENCIAS', 14, 32);

    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80); // Azul Oscuro

    // Fecha y Hora [cite: 2, 3]
    const fechaFormat = new Date(incidente.date).toLocaleDateString();
    const horaFormat = new Date(incidente.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    doc.text(`FECHA: ${fechaFormat}`, 20, 50); // 
    doc.text(`HORA: ${horaFormat}`, 120, 50); // 
    doc.text(`RESIDENTE: ${nombreCompleto}`, 20, 60);

    // Línea divisoria
    doc.setDrawColor(224, 228, 232);
    doc.line(20, 65, 190, 65);

    // Descripción de los hechos 
    doc.text("DESCRIPCIÓN DE LOS HECHOS", 20, 75); // 
    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(incidente.description.toUpperCase(), 170);
    doc.text(splitText, 20, 85);

    // Información del Personal 
    const footerY = 250;
    doc.line(20, footerY - 5, 190, footerY - 5);
    doc.setFont("helvetica", "bold");
    doc.text("PERSONAL QUE REPORTA", 20, footerY); // [cite: 5]
    doc.setFont("helvetica", "normal");
    doc.text(`(NOMBRE, CARGO Y FIRMA): ${nombreWork}`, 20, footerY + 10); // [cite: 6]

    // Nombre de la institución 
    doc.setFontSize(8);
    doc.text("HOGARES FRATERNALES DE JUANACATLÁN A.C.", 105, 285, { align: 'center' }); // 

    // Abrir en nueva pestaña
    window.open(doc.output('bloburl'), '_blank');
  }
}