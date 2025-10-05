import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Organization {
  code: string;
  name: string;
}

export interface Employee {
  code: string;
  networkId: string;
  fullName: string;
  jobTitle: string;
  remarks: string;
  orgCode: string; // Used to filter employees by organization
}
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000'; // JSON Server URL

  constructor(private http: HttpClient) { }

  /**
   * Fetches the list of all organizations.
   */
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/organizations`);
  }

  /**
   * Fetches employees filtered by the selected organization code.
   * JSON Server allows filtering with query parameters like ?orgCode=ORG001
   */
  getEmployeesByOrg(orgCode: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/employees?orgCode=${orgCode}`);
  }
}