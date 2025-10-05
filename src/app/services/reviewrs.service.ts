import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
//import { Employee, Organization } from './models'; // Assuming models are defined

// --- Mock Data ---
export interface Organization {
  id: number;
  code: number; // The value to link to employees
  name: string;
}

export interface Employee {
  id: string;
  code: number;
  networkId: string;
  fullName: string;
  jobTitle: string;
  remarks: string;
}
const MOCK_ORGANIZATIONS: Organization[] = [
  { id: 100, code: 1110023, name: 'Organization Alpha' },
  { id: 101, code: 2220043, name: 'Organization Beta' },
  { id: 102, code: 3330053, name: 'Organization Gamma' },
];

const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', code: 1110023, networkId: '30002070', fullName: 'Piet Erang Apple', jobTitle: 'Engineer', remarks: 'Success ' },
  { id: '2', code: 1110023, networkId: '30002071', fullName: 'Jane Doe', jobTitle: 'Manager', remarks: 'Success ' },
  { id: '3', code: 2220043, networkId: '30003100', fullName: 'John Smith', jobTitle: 'Team Lead', remarks: 'Success ' },
  { id: '4', code: 3330053, networkId: '30004501', fullName: 'Alice Johnson', jobTitle: 'Designer', remarks: 'Success ' },
  { id: '5', code: 3330053, networkId: '30004502', fullName: 'Bob Brown', jobTitle: 'Architect', remarks: 'Success ' },
];

@Injectable({
  providedIn: 'root',
})
export class ReviewrsService {
  // Simulate fetching a list of organizations for the Autocomplete
  getOrganizations(): Observable<Organization[]> {
    // Simulate API delay
    return of(MOCK_ORGANIZATIONS).pipe(delay(200));
  }

  // Simulate fetching employees for a specific organization
  getEmployeesByOrganization(code: number): Observable<Employee[]> {
    const org = MOCK_ORGANIZATIONS.find(o => o.code === code);
    if (!org) {
      return of([]);
    }
    const employees = MOCK_EMPLOYEES.filter(emp => emp.code === org.code);
    return of(employees).pipe(delay(300));
  }
}