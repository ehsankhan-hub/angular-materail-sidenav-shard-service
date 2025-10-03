import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs'; // Make sure forkJoin and of are imported

// Interface matching the new row data structure
export interface RowData {
  id: number;
  rigCode: string;
  rigName: string;
  location: string;
  rigType: string;
  opPlanFlag: 'Y' | 'N';
  companyCode: string;
  companyName: string;
  justificatio: string;
  // Add metadata for tracking changes
  _status?: 'inserted' | 'updated' | 'deleted' | 'persisted';
  _isNew?: boolean; // Flag for newly added rows not yet persisted
  _original?: any; // To store original data for update comparison
}


@Injectable({
  providedIn: 'root'
})
export class RigsDataService {
  private apiUrl = 'http://localhost:3000/items'; // JSON Server endpoint

  constructor(private http: HttpClient) {}

  getInitialData(): Observable<RowData[]> {
    return this.http.get<RowData[]>(this.apiUrl);
  }

  // New: Add an item (POST)
  addItem(item: Partial<RowData>): Observable<RowData> {
    return this.http.post<RowData>(this.apiUrl, item);
  }

  // New: Update an item (PUT/PATCH)
  updateItem(id: number, item: Partial<RowData>): Observable<RowData> {
    // JSON Server expects a PUT to replace the whole resource or PATCH to update fields.
    // We'll use PATCH for partial updates.
    return this.http.patch<RowData>(`${this.apiUrl}/${id}`, item);
  }

  // Existing: Delete items (forkJoin for multiple DELETEs)
  deleteItems(ids: number[]): Observable<any> {
    const deleteRequests = ids.map(id => {
      return this.http.delete(`${this.apiUrl}/${id}`);
    });
    return deleteRequests.length > 0 ? forkJoin(deleteRequests) : of([]);
  }
}