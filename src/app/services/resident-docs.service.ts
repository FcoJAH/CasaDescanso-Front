import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
    providedIn: 'root'
})
export class ResidentDocsService {
    private http = inject(HttpClient);

    private apiUrl = environment.apiUrl;

    // --- SECCIÓN: RESIDENTES ---

    // Obtener los datos generales (Francisco Alcalá, etc.)
    getResidentById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/Residents/${id}`);
    }

    // --- SECCIÓN: DOCUMENTOS (TABLA) ---

    // Obtener historial de documentos por Residente
    getDocumentsByResident(residentId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/ResidentDocuments/by-resident/${residentId}`);
    }

    // Subir un documento nuevo (Acta, Contrato, etc.)
    // Simplificamos la función para que reciba el objeto FormData directamente
    uploadDocument(formData: FormData): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}/ResidentDocuments/upload-to-resident`,
            formData
        );
    }

    // --- SECCIÓN: FOTO DE PERFIL (CASO ESPECIAL) ---

    // Obtener la URL de la que se llame "ProfilePhoto"
    getProfilePhoto(residentId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/ResidentDocuments/${residentId}/profile-photo`);
    }

    // Subir o actualizar la foto de perfil específicamente
    uploadProfilePhoto(residentId: number, file: File, workerId: number): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workerId', workerId.toString());

        // Este es el endpoint que creamos en ResidentDocsController
        return this.http.post<any>(`${this.apiUrl}/ResidentDocuments/${residentId}/upload-profile-photo`, formData);
    }

    uploadResidentPhoto(id: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.patch(`${this.apiUrl}/ResidentDocuments/${id}/upload-photo`, formData);
    }

    // Borrar documento (si llegas a implementarlo en el back)
    deleteDocument(documentId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/ResidentDocuments/${documentId}`);
    }
}