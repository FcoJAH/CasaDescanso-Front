import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResidentesService } from '../residentes/residentes.service';
import { VitalSignsService } from '../signos-vitales/signos-vitales.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
    selector: 'app-reporte-signos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [DatePipe],
    templateUrl: './reporte-signos.component.html',
    styleUrls: ['./reporte-signos.component.css']
})
export class ReporteSignosComponent implements OnInit {
    private residentesService = inject(ResidentesService);
    private signosService = inject(VitalSignsService);
    private datePipe = inject(DatePipe);
    private router = inject(Router);

    empleados = signal<any[]>([]);
    empleadoSeleccionado = signal<any>(null);
    isError = signal(false);
    errorMessage = signal('');
    loading = signal(false);

    todoElHistorial = signal<boolean>(true);
    fechaInicio = signal<string>('');
    fechaFin = signal<string>('');
    allHistory = signal<any[]>([]);

    ngOnInit() {
        this.cargarResidentes();
    }

    cargarResidentes() {
        this.residentesService.obtenerActivos().subscribe({
            next: (data) => this.empleados.set(data),
            error: () => {
                this.isError.set(true);
                this.errorMessage.set('Error al cargar la lista de residentes.');
            }
        });
    }

    onSeleccionar(event: any) {
        const id = Number(event.target.value);
        const seleccionado = this.empleados().find(u => u.id === id);
        this.empleadoSeleccionado.set(seleccionado || null);
        if (seleccionado) this.consultarHistorial(id);
    }

    consultarHistorial(residenteId: number) {
        this.loading.set(true);
        this.signosService.obtenerSignosVitalesPorResidente(residenteId).subscribe({
            next: (data) => {
                this.allHistory.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.isError.set(true);
                this.errorMessage.set('No se pudo obtener el historial clínico.');
                this.loading.set(false);
            }
        });
    }

    toggleTodoHistorial() {
        if (this.todoElHistorial()) {
            this.fechaInicio.set('');
            this.fechaFin.set('');
        }
    }

    private calcularEdad(fechaNacimiento: string): string {
        if (!fechaNacimiento) return '--';
        const nacimiento = new Date(fechaNacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
        return edad >= 0 ? edad.toString() : '--';
    }

    descargarPDF(nombreResidente: string) {
        const residente = this.empleadoSeleccionado();
        if (!residente) return;

        this.loading.set(true);

        let registros = this.allHistory();

        // 1. Filtrar IDs válidos y únicos
        const workerIds = [...new Set(registros
            .map(r => r.recordedByUserId)
            .filter(id => id !== undefined && id !== null && id !== 0)
        )];

        //console.log('IDs de trabajadores a consultar:', workerIds);

        if (workerIds.length === 0) {
            this.generarPDFConFirmas(registros, {});
            this.loading.set(false);
            return;
        }

        // 2. Peticiones con validación de propiedad
        const workerRequests = workerIds.map(id =>
            this.signosService.getWorkerDetail(id).pipe(
                map(worker => {
                    //console.log(`Trabajador ${id} obtenido:`, worker);
                    const name = worker.fullName || worker.fullname || worker.name || 'SISTEMA';
                    return { id, fullName: name };
                }),
                catchError(err => {
                    console.error(`Error obteniendo trabajador ${id}:`, err);
                    return of({ id, fullName: 'SISTEMA' });
                })
            )
        );

        forkJoin(workerRequests).subscribe({
            next: (workers) => {
                const workersMap = workers.reduce((acc: any, curr) => {
                    acc[curr.id] = curr.fullName;
                    return acc;
                }, {});

                this.generarPDFConFirmas(registros, workersMap);
                this.loading.set(false);
            },
            error: () => {
                this.generarPDFConFirmas(registros, {});
                this.loading.set(false);
            }
        });
    }

    private generarPDFConFirmas(registros: any[], workersMap: any) {
        const doc = new jsPDF('p', 'mm', 'a4');
        const residente = this.empleadoSeleccionado();
        const safeUpper = (val: any) => val ? String(val).toUpperCase() : '---';

        const azulCorp: [number, number, number] = [0, 91, 181];
        const negro: [number, number, number] = [0, 0, 0];
        const grisFirma: [number, number, number] = [200, 200, 200];

        // --- ENCABEZADO ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...azulCorp);
        doc.text('HOGARES FRATERNALES DE JUANACATLÁN A.C.', 105, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(...negro);
        doc.text('HOJA CLÍNICA DE REGISTRO DE SIGNOS VITALES', 105, 22, { align: 'center' });

        // --- CUADRO DE INFORMACIÓN ---
        doc.setLineWidth(0.2);
        doc.setDrawColor(0, 0, 0);
        doc.rect(10, 28, 190, 32);

        doc.setFontSize(8.5);
        doc.text(`NOMBRE: ${residente.firstName + ' ' + residente.lastName + ' ' + residente.middleName}`, 15, 35);
        doc.text(`FECHA DE NACIMIENTO: ${residente.birthDate?.split('T')[0] || '--'}`, 15, 40);
        doc.text(`CONTACTO DE URGENCIA: ${residente.emergencyContactPhone}`, 15, 45);
        doc.text(`NOMBRE DE CONTACTO: ${residente.emergencyContactName}`, 15, 50);
        doc.text(`ENFERMEDADES: ${safeUpper(residente.diagnosedDiseases)}`, 15, 55);

        doc.text(`ALERGIAS: ${safeUpper(residente.allergies)}`, 110, 35);
        doc.text(`EDAD: ${this.calcularEdad(residente.birthDate)} AÑOS`, 110, 40);
        doc.text(`SEXO: ${residente.gender}`, 110, 45);
        doc.text(`N.S.S.: ${safeUpper(residente.nss)}`, 110, 50);
        doc.setTextColor(200, 0, 0);
        doc.setTextColor(...negro);
        doc.text(`OBSERVACIONES: ${safeUpper(residente.observations)}`, 110, 55);

        // --- TABLA DE SIGNOS VITALES ---
        autoTable(doc, {
            startY: 63,
            head: [['FECHA', 'HORARIO', 'T/A', 'F. CARD', 'F. RESP', 'SAT.', 'TEMP.', 'GLUC.', 'FIRMA']],
            body: registros.map(r => {
                const fechaHora = new Date(r.recordedAt);
                const nombreFirma = workersMap[r.recordedByUserId] || 'SISTEMA';

                return [
                    this.datePipe.transform(fechaHora, 'dd/MM/yyyy') || '--',
                    this.datePipe.transform(fechaHora, 'HH:mm') || '--',
                    r.bloodPressure || '--',
                    r.heartRate || '--',
                    r.respiratoryFrequency || '--',
                    r.oxygenSaturation ? r.oxygenSaturation + '%' : '--',
                    r.temperature ? r.temperature + '°C' : '--',
                    r.glucoseLevel || '--',
                    r.recordedBy
                ];
            }),
            didParseCell: (data) => {
                // Si la celda es de la columna "FIRMA" (índice 8)
                if (data.section === 'body' && data.column.index === 8) {
                    data.cell.styles.textColor = grisFirma; // Aplicamos el gris claro
                    data.cell.styles.fontSize = 6; // Un poco más pequeña para dar espacio a la firma real
                }
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: negro,
                fontSize: 7.5,
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.1,
                lineColor: [150, 150, 150]
            },
            bodyStyles: {
                fontSize: 7.5,
                halign: 'center',
                textColor: [30, 30, 30]
            },
            theme: 'grid'
        });

        // Pie de página
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount} - Generado por Sistema Hogares Fraternales de Juanacatlán A.C.`, 105, 285, { align: 'center' });
        }

        doc.save(`HOJA_CLINICA_${safeUpper(residente.fullName)}.pdf`);
    }

    resetVista() {
        this.isError.set(false);
        this.empleadoSeleccionado.set(null);
    }
}