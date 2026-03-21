import { Component, OnInit, inject, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ResidentDocsService } from '../../../services/resident-docs.service';
import { ResidentesService } from '../../residentes/residentes.service';
import { Router } from '@angular/router';
import { ValidationPopupComponent } from '../../../utils/popup/validation-popup.component';
import { SuccessConfig } from '../../../utils/success/success-config.model';
import { SuccessViewComponent } from '../../../utils/success/success-view.component';
import { UploadDocumentModalComponent } from './upload-modal/upload-document-modal.component';
import { PDFDocument } from 'pdf-lib';
import { lastValueFrom } from 'rxjs';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-resident-profile',
    standalone: true,
    imports: [CommonModule, ValidationPopupComponent,
        SuccessViewComponent, UploadDocumentModalComponent
    ],
    templateUrl: './resident-profile.component.html',
    styleUrls: ['./resident-profile.component.css']
})
export class ResidentProfileComponent implements OnInit {
    // Inyección de dependencias (Modern Angular 19 style)
    private route = inject(ActivatedRoute);
    private docsService = inject(ResidentDocsService);
    private router = inject(Router);

    private residentesService = inject(ResidentesService);

    // Signals para manejar el estado de la pantalla
    resident = signal<any>(null);
    documents = signal<any[]>([]);
    loading = signal<boolean>(true);

    showPopup = signal(false);
    showValidationPopup = signal(false);
    formErrors = signal<string[]>([]);
    showSuccess = signal(false);
    isModalAddOpen = signal(false);
    exitoSubida = signal(false);

    // DENTRO de tu clase ResidentProfileComponent
    getFechaHoraGDL(): string {
        return new Date().toLocaleString("es-MX", {
            timeZone: "America/Mexico_City",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Formato 24h para nombres de archivo es mejor
        }).replace(/[/,:]/g, '-').replace(/\s/g, '_');
        // Esto último limpia la cadena para que sea segura para un nombre de archivo
    }

    configuracionExito: SuccessConfig = {
        titulo: 'SUBIDA EXITOSA!',
        mensaje: 'Se subio correctamente la nueva foto.',
        botonPrincipal: 'Cerrar',
        botonSecundario: 'Volver a seleccionar residente'
    };

    configuracionExitoSubida: SuccessConfig = {
        titulo: 'SUBIDA EXITOSA!',
        mensaje: 'Se subio correctamente el documento al expediente',
        botonPrincipal: 'Cerrar',
        botonSecundario: 'Volver a seleccionar residente'
    };

    ngOnInit(): void {
        // 1. Capturamos el ID de la URL (ej: /resident-profile/1)
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.loadAllData(Number(id));
        }
    }

    async loadAllData(id: number) {
        this.loading.set(true);
        try {
            // Cargamos datos del residente y sus documentos en paralelo
            await Promise.all([
                this.getResidentInfo(id),
                this.loadDocuments(id)
            ]);
        } catch (error) {
            console.error('Error al cargar el perfil:', error);
        } finally {
            this.loading.set(false);
        }
    }

    alSalir() {
        this.showSuccess.set(false);
        this.exitoSubida.set(false);
        this.alRecargar();
    }

    mostrarModalExito() {
        this.exitoSubida.set(true);
    }

    alRecargar() {
        this.loadDocuments(this.resident().id)
    }

    // Obtener información general del residente
    getResidentInfo(id: number) {
        this.residentesService.obtenerResidentePorId(id).subscribe({
            next: (data) => {
                this.resident.set(data);
                this.checkProfilePhoto(id);
            },
            error: (err) => console.error('Error resident info:', err)
        });
    }

    // Buscar específicamente la foto marcada como "ProfilePhoto"
    checkProfilePhoto(id: number) {
        this.docsService.getProfilePhoto(id).subscribe({
            next: (res) => {
                if (res && res.documentUrl) {
                    // Actualizamos el objeto resident con la foto encontrada en documentos
                    this.resident.update(current => ({ ...current, photoPath: res.documentUrl }));
                }
            },
            error: (err) => {
                console.log("No hay foto");
                if (err.status === 404) {
                    this.documents.set([]); // Limpiamos la lista sin lanzar error crítico
                } else {
                    console.error('Error inesperado:', err);
                }
            }
        });
    }

    // Cargar la tabla de documentos
    loadDocuments(id: number) {
        this.docsService.getDocumentsByResident(id).subscribe({
            next: (docs) => {
                this.documents.set(docs);
            },
            error: (err) => {
                if (err.status === 404) {
                    this.documents.set([]); // Limpiamos la lista sin lanzar error crítico
                } else {
                    console.error('Error inesperado:', err);
                }
            }
        });
    }

    // --- ACCIONES DE LA PÁGINA ---

    fileInput = viewChild<ElementRef<HTMLInputElement>>('photoInput');

    onPhotoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];

        // --- VALIDACIÓN: SOLO IMÁGENES ---
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Formato no válido. Por favor selecciona una imagen (JPG, PNG, WEBP).');
            input.value = ''; // Limpiar el input
            return;
        }

        // Validación opcional de tamaño (ej: 3MB)
        if (file.size > 3 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Máximo 3MB.');
            return;
        }

        this.uploadProfilePhoto(file);
    }

    private uploadProfilePhoto(file: File) {
        const id = this.resident()?.id;
        if (!id) return;

        this.docsService.uploadResidentPhoto(id, file).subscribe({
            next: (res) => {
                this.showSuccess.set(true);
                this.resident.update(current => ({
                    ...current,
                    photoPath: res.photoPath
                }));
            },
            error: (err) => {
                const mensaje = err.error?.message || 'Error de conexión con el servidor';

                this.formErrors.set([mensaje]);

                this.showPopup.set(true);
                this.showValidationPopup.set(true);

                console.error('Error al subir foto:', err);
            }
        });
    }

    preview(url: string) {
        if (url) {
            window.open(url, '_blank');
        } else {
            console.warn("Este documento no tiene una URL válida de Cloudinary.");
            return;
        }
    }

    download(doc: any) {
        // Forzamos descarga mediante el flag de Cloudinary 'fl_attachment'
        const downloadUrl = doc.documentUrl.replace('/upload/', '/upload/fl_attachment/');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', doc.documentName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    openUploadModal() {
        //this.fileInput()?.nativeElement.click();
        this.isModalAddOpen.set(true);
    }

    openPerfil() {
        this.fileInput()?.nativeElement.click();
    }

    volverMenu() {
        this.router.navigate(['/resident-history']);
    }

    async generarCaratulaExpediente(doc: jsPDF, residente: any) {
        // --- ENCABEZADO ---
        doc.setFontSize(24);
        doc.setTextColor(24, 90, 157); // Azul profesional
        const nombreCompleto = `${residente.firstName} ${residente.lastName} ${residente.middleName}`;
        doc.text(nombreCompleto, 15, 25);

        // --- FOTO DEL RESIDENTE ---
        // Usamos photoPath que es donde guardas la URL de Cloudinary
        const fotoUrl = residente.photoPath;
        if (fotoUrl) {
            try {
                const imgData = await this.getBase64ImageFromUrl(fotoUrl);
                // Marco para la foto
                doc.setDrawColor(200);
                doc.rect(150, 15, 40, 45);
                doc.addImage(imgData, 'JPEG', 151, 16, 38, 43);
            } catch (e) {
                console.warn("No se pudo cargar la foto del perfil en el PDF");
            }
        }

        // --- DATOS BÁSICOS ---
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`ID: ${residente.id}`, 15, 35);
        const fechaLimpia = residente.birthDate ? residente.birthDate.split('T')[0] : 'N/A';
        doc.text(`Fecha de nacimiento: ${fechaLimpia}`, 15, 42);
        const ingresoLimpio = residente.admissionDate ? residente.admissionDate.split('T')[0] : 'N/A';
        doc.text(`Fecha de ingreso: ${ingresoLimpio}`, 15, 49)
        doc.text(`NSS: ${residente.nss || 'No registrado'}`, 15, 56);

        // --- SECCIÓN: CONTACTO DE EMERGENCIA ---
        doc.setFontSize(13);
        doc.setTextColor(24, 90, 157);
        doc.text("CONTACTO DE EMERGENCIA", 15, 72);
        doc.setDrawColor(24, 90, 157);
        doc.line(15, 67, 80, 67); // Subrayado decorativo

        autoTable(doc, {
            startY: 77,
            margin: { left: 15 },
            tableWidth: 120,
            theme: 'striped',
            headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50] },
            body: [
                ['Nombre', residente.emergencyContactName + (' (' + residente.emergencyContactRelation + ')' || '') || 'No asignado'],
                ['Teléfono', residente.emergencyContactPhone || 'No asignado'],
            ],
        });

        // --- SECCIÓN: DATOS MÉDICOS ---
        const finalY = (doc as any).lastAutoTable.finalY || 90;
        doc.setFontSize(13);
        doc.setTextColor(180, 0, 0); // Rojo para destacar sección médica
        doc.text("INFORMACIÓN MÉDICA", 15, finalY + 15);

        autoTable(doc, {
            startY: finalY + 18,
            margin: { left: 15 },
            // 1. Quitamos 'width' de 'styles'
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            // 2. Usamos 'columnStyles' para definir el ancho por índice de columna
            columnStyles: {
                0: { cellWidth: 40, fontStyle: 'bold' }, // La primera columna (Nombre del campo)
                1: { cellWidth: 'auto' }                  // La segunda columna (Valor)
            },
            body: [
                ['Tipo de Sangre', residente.bloodType || 'Sin dato'],
                [
                    'Alergias',
                    {
                        content: residente.allergies || 'NINGUNA',
                        styles: { textColor: [200, 0, 0], fontStyle: 'bold' }
                    }
                ],
                ['Diagnósticos', residente.diagnosedDiseases || 'Sin registros'],
                ['Observaciones', residente.observations || 'Sin observaciones']
            ],
        });
    }

    async descargarExpedienteUnificado() {
        this.loading.set(true);
        const residenteFull = this.resident();
        const residente = this.resident().id;

        try {
            // 1. GENERAR CARÁTULA CON JSPDF
            const docJsPDF = new jsPDF('p', 'mm', 'a4');
            await this.generarCaratulaExpediente(docJsPDF, residenteFull);

            // Convertir jsPDF a bytes que pdf-lib pueda leer
            const caratulaBytes = docJsPDF.output('arraybuffer');
            const pdfUnificado = await PDFDocument.load(caratulaBytes);

            // 1. Obtenemos los documentos
            const documentos = await lastValueFrom(
                this.docsService.getDocumentsByResident(residente)
            );

            // Validamos que existan documentos para iterar
            if (!documentos || documentos.length === 0) {
                console.warn("No se encontraron documentos para este residente.");
                this.loading.set(false);
                return;
            }

            for (const doc of documentos) {
                // --- VALIDACIÓN CRÍTICA ---
                // Si el objeto doc es nulo o la propiedad url no existe, saltamos al siguiente
                if (!doc?.documentUrl) {
                    console.error(`Omitiendo documento con ID ${doc?.id}: URL no válida.`);
                    continue;
                }

                const url = doc.documentUrl;

                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                    const buffer = await response.arrayBuffer();

                    // Limpiamos la URL de parámetros de Cloudinary (?v=...) para detectar extensión
                    const cleanUrl = url.split('?')[0].toLowerCase();

                    if (cleanUrl.endsWith('.pdf')) {
                        const pdfExistente = await PDFDocument.load(buffer);
                        const paginasCopiadas = await pdfUnificado.copyPages(
                            pdfExistente,
                            pdfExistente.getPageIndices()
                        );
                        paginasCopiadas.forEach((p) => pdfUnificado.addPage(p));
                    }
                    else if (this.isImage(cleanUrl)) {
                        const pagina = pdfUnificado.addPage([595, 842]); // Tamaño A4

                        const imagen = cleanUrl.endsWith('.png')
                            ? await pdfUnificado.embedPng(buffer)
                            : await pdfUnificado.embedJpg(buffer);

                        const { width, height } = imagen.scale(1);
                        const escala = Math.min(550 / width, 750 / height);
                        const dims = imagen.scale(escala);

                        // Dibujar imagen centrada
                        pagina.drawImage(imagen, {
                            x: (595 - dims.width) / 2,
                            y: 842 - dims.height - 60,
                            width: dims.width,
                            height: dims.height,
                        });

                        pagina.drawText(`Documento: ${doc.docName || 'Sin Título'}`, {
                            x: 30,
                            y: 810,
                            size: 12
                        });
                    }
                } catch (fileError) {
                    // Si un archivo falla, registramos el error pero NO detenemos el bucle
                    console.error(`No se pudo procesar el archivo: ${doc.docName}`, fileError);
                }
            }

            // 2. Guardar y descargar
            const pdfBytes = await pdfUnificado.save();
            this.descargarArchivo(pdfBytes, `EXPEDIENTE_${this.resident().firstName}_${this.resident().lastName}_${this.getFechaHoraGDL()}.pdf`);

        } catch (error) {
            console.error("Error general al unir documentos:", error);
        } finally {
            this.loading.set(false);
        }
    }

    // Convierte una URL de imagen (Cloudinary) a Base64 para jsPDF
    private async getBase64ImageFromUrl(imageUrl: string): Promise<string> {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(reader.result as string), false);
            reader.onerror = () => reject(new Error("Error al convertir imagen a Base64"));
            reader.readAsDataURL(blob);
        });
    }

    // Función auxiliar de imagen actualizada
    private isImage(url: string | null | undefined): boolean {
        if (!url) return false;
        const path = url.split('?')[0].toLowerCase();
        return /\.(jpg|jpeg|png|webp|avif)$/.test(path);
    }

    private descargarArchivo(bytes: Uint8Array, nombre: string) {
        // Forzamos la creación de un nuevo Uint8Array para que TS no se queje de ArrayBufferLike
        const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nombre;
        link.click();

        // Limpieza de memoria (importante para archivos grandes)
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }
}