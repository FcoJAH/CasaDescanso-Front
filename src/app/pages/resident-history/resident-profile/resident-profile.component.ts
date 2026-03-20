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
}