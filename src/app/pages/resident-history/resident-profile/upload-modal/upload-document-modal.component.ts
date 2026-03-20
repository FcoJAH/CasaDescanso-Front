import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ResidentDocsService } from '../../../../services/resident-docs.service';

@Component({
  selector: 'app-upload-document-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-document-modal.component.html',
  styleUrl: './upload-document-modal.component.css'
})
export class UploadDocumentModalComponent {
  // Inputs desde el componente padre
  residentId = input.required<number>();
  workerId = input<number>(1);
  private docsService = inject(ResidentDocsService);

  // Eventos para comunicar con el padre
  onClose = output<void>();
  onSuccess = output<void>();

  // Estado del formulario con Signals
  docName = signal('');
  detalleRecurso = signal('');
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  async upload() {
    const file = this.selectedFile();
    if (!file || !this.docName()) return;

    this.isUploading.set(true);

    // Construcción del FormData para el POST de Cloudinary/DotNet
    const formData = new FormData();
    formData.append('File', file);
    formData.append('ResidentId', this.residentId().toString());
    formData.append('DocName', this.docName());
    formData.append('DetalleRecurso', this.detalleRecurso());
    formData.append('WorkerId', this.workerId().toString());

    try {
      await this.docsService.uploadDocument(formData).toPromise();

      this.onSuccess.emit(); // Avisar al padre que refresque la tabla
      this.close();
    } catch (error) {
      console.error('Error al subir el documento:', error);
    } finally {
      this.isUploading.set(false);
    }
  }

  close() {
    this.onClose.emit();
  }
}