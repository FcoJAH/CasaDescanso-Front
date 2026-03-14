import { Component, OnInit, signal, inject } from '@angular/core';
import { EmpleadosService } from '../empleados/empleados.service';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-check-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './check-history.component.html',
    styleUrls: ['./check-history.component.css']
})
export class CheckHistoryComponent implements OnInit {
    private empleadosService = inject(EmpleadosService);
    private attendanceService = inject(AttendanceService);
    private router = inject(Router);

    empleados = signal<any[]>([]);
    empleadoSeleccionado = signal<any>(null);
    isDeleted = signal(false);
    isError = signal(false);
    errorMessage = signal('');

    viewMode = signal<'selection' | 'history'>('selection');
    employees = signal<any[]>([]);
    history = signal<any[]>([]);
    loading = signal(false);

    ngOnInit() {
        this.cargarEmpleados();
    }

    cargarEmpleados() {
        // Filtrar opcionalmente los que ya están activos para no llenar la lista
        this.empleadosService.getActiveEmployers().subscribe(data => this.empleados.set(data));
    }

    onSeleccionar(event: any) {
        const seleccionado = this.empleados().find(u => u.id == event.target.value);
        this.empleadoSeleccionado.set(seleccionado || null);
    }

    consultarHistorial(userId: number) {
        this.loading.set(true);
        this.isError.set(false); // Limpiamos errores previos

        this.attendanceService.getAttendanceHistory(userId).subscribe({
            next: (data) => {
                // Sincronizamos todas las señales de datos
                this.history.set(data);        // Para el PDF original
                this.allHistory.set(data);     // Para el respaldo de filtros
                this.historyFiltered.set(data); // Lo que el HTML lee actualmente

                this.viewMode.set('history');
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error al obtener historial:', err);
                this.isError.set(true);
                this.errorMessage.set('No se pudo cargar el historial del empleado.');
                this.loading.set(false);
            }
        });
    }

    // Agrega esta función a tu componente
    private async obtenerDireccion(lat: number, lng: number): Promise<string> {
        if (!lat || !lng) return 'Ubicación no disponible';

        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const response = await fetch(url);
            const data = await response.json();
            return data.display_name || 'Dirección no encontrada';
        } catch (error) {
            return 'Error al obtener dirección';
        }
    }

    todoElHistorial = signal<boolean>(true);
    fechaInicio = signal<string>('');
    fechaFin = signal<string>('');

    // El historial original que viene del servidor
    allHistory = signal<any[]>([]);

    // El historial filtrado que se muestra en pantalla
    historyFiltered = signal<any[]>([]);

    aplicarFiltro() {
        // Si "Todo el historial" está marcado, mostramos todo
        if (this.todoElHistorial()) {
            this.historyFiltered.set(this.allHistory());
            return;
        }

        // Si no está marcado y hay fechas, filtramos
        if (this.fechaInicio() && this.fechaFin()) {
            const inicioStr = this.fechaInicio();
            const finStr = this.fechaFin();

            const filtrados = this.allHistory().filter(record => {
                const fechaRecord = new Date(record.date).toISOString().split('T')[0];
                return fechaRecord >= inicioStr && fechaRecord <= finStr;
            });
            this.historyFiltered.set(filtrados);
        }
    }

    // Se llama cuando cambia el checkbox
    toggleTodoHistorial() {
        if (this.todoElHistorial()) {
            this.fechaInicio.set('');
            this.fechaFin.set('');
        }
        this.aplicarFiltro();
    }

    async descargarPDF(userName: string = this.empleadoSeleccionado().fullName) {
        this.loading.set(true);
        const rawData = this.historyFiltered();

        // Transformamos los datos para incluir las direcciones
        const dataConDirecciones = await Promise.all(rawData.map(async (r) => ({
            ...r,
            direccionIn: await this.obtenerDireccion(r.latitudeIn, r.longitudeIn),
            direccionOut: r.checkOut ? await this.obtenerDireccion(r.latitudeOut, r.longitudeOut) : '---'
        })));

        const doc = new jsPDF();
        const logoUrl = '../images/CD_Logo_Pequeno.png';

        const img = new Image();
        img.src = logoUrl;

        // Esperamos a que la imagen cargue para generarlo correctamente
        img.onload = () => {
            this.generarEstructuraPDF(doc, img, userName, dataConDirecciones);
            this.loading.set(false);
        };

        // Si hay error cargando la imagen (ruta mal escrita), generamos el PDF sin logo
        img.onerror = () => {
            this.generarEstructuraPDF(doc, img, userName, dataConDirecciones);
            this.loading.set(false);
        };
    }

    private generarEstructuraPDF(doc: jsPDF, logoImg: HTMLImageElement | null, userName: string, data: any[]) {
        // Definición de colores con Tipado Estricto (Tuplas)
        const azulCorp: [number, number, number] = [0, 91, 181];
        const azulOscuro: [number, number, number] = [44, 62, 80];
        const blancoHumo: [number, number, number] = [248, 249, 250];

        // --- ENCABEZADO CORPORATIVO ---
        doc.setFillColor(...azulCorp);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Hogares Fraternales de Juancatlán A.C.', 14, 25);

        if (logoImg) {
            // Posición X: 165, Y: 5, Ancho: 30, Alto: 30
            doc.addImage(logoImg, 'PNG', 165, 5, 30, 30);
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('SISTEMA DE GESTIÓN DE ASISTENCIA', 14, 32);

        // --- INFORMACIÓN DEL REPORTE ---
        doc.setTextColor(...azulOscuro);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLE DEL HISTORIAL', 14, 55);

        doc.setLineWidth(0.5);
        doc.setDrawColor(...azulCorp);
        doc.line(14, 57, 80, 57);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`EMPLEADO: ${userName}`, 14, 65);
        doc.text(`FECHA EMISIÓN: ${new Date().toLocaleDateString().toUpperCase()}`, 140, 65);

        // --- TABLA DE REGISTROS ---
        autoTable(doc, {
            startY: 75,
            head: [['FECHA', 'ENTRADA', 'LUGAR ENTRADA', 'SALIDA', 'LUGAR SALIDA', 'ESTADO']],
            body: data.map(r => [
                new Date(r.date).toLocaleDateString(),
                new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                r.direccionIn,
                r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---',
                r.checkOut ? r.direccionOut : '---',
                r.checkOut ? 'COMPLETADO' : 'EN TURNO'
            ]),
            headStyles: {
                fillColor: azulCorp,
                textColor: [255, 255, 255] as [number, number, number],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: blancoHumo
            },
            bodyStyles: {
                textColor: azulOscuro
            }
        });

        doc.save(`REPORTE_${userName}_${new Date().getTime()}.pdf`);
    }

    resetVista() {
        this.isError.set(false);
        this.empleadoSeleccionado.set(null);
    }

    reset() {
        this.isError.set(false);
        this.empleadoSeleccionado.set(null);
    }

    finalizar() {
        this.router.navigate(['/empleados']);
    }
}