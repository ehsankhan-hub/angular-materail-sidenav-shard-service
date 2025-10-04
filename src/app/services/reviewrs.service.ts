import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
//import { Employee, Organization } from './models'; // Assuming models are defined

// --- Mock Data ---
export interface Organization {
  id: string;
  code: string; // The value to link to employees
  name: string;
}

export interface Employee {
  id: string;
  orgId: string;
  networkId: string;
  fullName: string;
  jobTitle: string;
  remarks: string;
}
const MOCK_ORGANIZATIONS: Organization[] = [
  { id: '100', code: 'OA', name: 'Organization Alpha' },
  { id: '101', code: 'OB', name: 'Organization Beta' },
  { id: '102', code: 'OC', name: 'Organization Gamma' },
];

const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', orgId: '100', networkId: '30002070', fullName: 'Piet Erang Apple', jobTitle: 'Engineer', remarks: 'Success ' },
  { id: '2', orgId: '100', networkId: '30002071', fullName: 'Jane Doe', jobTitle: 'Manager', remarks: 'Success ' },
  { id: '3', orgId: '101', networkId: '30003100', fullName: 'John Smith', jobTitle: 'Team Lead', remarks: 'Success ' },
  { id: '4', orgId: '102', networkId: '30004501', fullName: 'Alice Johnson', jobTitle: 'Designer', remarks: 'Success ' },
  { id: '5', orgId: '102', networkId: '30004502', fullName: 'Bob Brown', jobTitle: 'Architect', remarks: 'Success ' },
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
  getEmployeesByOrganization(orgCode: string): Observable<Employee[]> {
    const org = MOCK_ORGANIZATIONS.find(o => o.code === orgCode);
    if (!org) {
      return of([]);
    }
    const employees = MOCK_EMPLOYEES.filter(emp => emp.orgId === org.id);
    return of(employees).pipe(delay(300));
  }
}