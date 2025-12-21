// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { WellBoreList } from '../wellLink/models/well-bore-logs-list';

// @Injectable({ providedIn: 'root' })
// export class MultiWellDataService {
//   api = 'http://localhost:3000';

//   constructor(private http: HttpClient) {}

//   getAllWells() {
//     return this.http.get(`${this.api}/wells`);
//   }

//   getWellbores(wellUid: string) {
//     return this.http.get(`${this.api}/wellbores?wellUid=${wellUid}`);
//   }

//   getLogs(wellboreUid: string) {
//     return this.http.get(`${this.api}/logs?wellboreUid=${wellboreUid}`);
//   }

//   getAllWellList(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.api}/wells`);
//   }

//   // getWellBoreList(wellUid: string): Observable<any[]> {
//   //   return this.http.get<any[]>(`${this.api}/wellbores?wellUid=${wellUid}`);
//   // }

//   getWellBoreList(wellUid: string): Observable<WellBoreList> {
//     console.log('wellUid ', wellUid);
//     return this.http.get<WellBoreList>(
//       `${this.api}/wellbores`,
//       { params: { wellUid } }
//     );
//   }
  

//   // getWellBoreLogsList(wellboreUid: string): Observable<any[]> {
//   //   return this.http.get<any[]>(`${this.api}/logs?wellboreUid=${wellboreUid}`);
//   // }

//   getWellBoreLogsList(well : any, wellboreUid: string , logID: string): Observable<any[]> {
//     return this.http.get<any[]>(`${this.api}/logs?wellboreUid=${wellboreUid}`);
//   }

// //// new code 




// }


import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Well, WellBore, WellBoreList, WellBoreLogsList } from '../models/well'; 



// Base URL for the JSON Server
const API_BASE_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class MultiWellDataService {
  private http = inject(HttpClient);

  getAllWellList(): Observable<Well[]> {
    return this.http.get<Well[]>(`${API_BASE_URL}/wells`);
  }

  getWellBoreList(selectedValue: Well): Observable<WellBoreList> {
    const wellUid = selectedValue.uid;
    return this.http.get<any>(`${API_BASE_URL}/wellbores`).pipe(
      map(data => ({
        wellbores: data[wellUid] || [],
        SuppMsgOut: 'OK'
      } as WellBoreList))
    );
  }

  getWellBoreLogsList(
    well: Well,
    wellbore: WellBore,
    indexType: string
  ): Observable<WellBoreLogsList> {
    const wellboreUid = wellbore.uid;
    return this.http.get<any>(`${API_BASE_URL}/logs`).pipe(
      map(data => ({
        logs: data[wellboreUid] || [],
        depthLogs: data[wellboreUid] || [],
        timeLogs: [],
        SuppMsgOut: 'OK',
      } as WellBoreLogsList))
    );
  }
}
