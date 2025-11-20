import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WellBoreList } from '../wellLink/models/well-bore-logs-list';

@Injectable({ providedIn: 'root' })
export class MultiWellDataService {
  api = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAllWells() {
    return this.http.get(`${this.api}/wells`);
  }

  getWellbores(wellUid: string) {
    return this.http.get(`${this.api}/wellbores?wellUid=${wellUid}`);
  }

  getLogs(wellboreUid: string) {
    return this.http.get(`${this.api}/logs?wellboreUid=${wellboreUid}`);
  }

  getAllWellList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/wells`);
  }

  // getWellBoreList(wellUid: string): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.api}/wellbores?wellUid=${wellUid}`);
  // }

  getWellBoreList(wellUid: string): Observable<WellBoreList> {
    console.log('wellUid ', wellUid);
    return this.http.get<WellBoreList>(
      `${this.api}/wellbores`,
      { params: { wellUid } }
    );
  }
  

  // getWellBoreLogsList(wellboreUid: string): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.api}/logs?wellboreUid=${wellboreUid}`);
  // }

  getWellBoreLogsList(well : any, wellboreUid: string , logID: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/logs?wellboreUid=${wellboreUid}`);
  }
}
