import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

// Service and Models
import { Employee, Organization, ReviewrsService } from '../../services/reviewrs.service'; 


// AG Grid Imports
import { AgGridAngular } from 'ag-grid-angular';
import { GridApi, GridReadyEvent, ColDef, RowClickedEvent } from 'ag-grid-community';

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For loading state

// Flex Layout
import { FlexLayoutModule } from '@angular/flex-layout';


@Component({
  selector: 'app-reviewers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,

    // Material Modules
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,

    // Layout/Grid Modules
    FlexLayoutModule,
    AgGridAngular,
  ],
  templateUrl: './reviewers.component.html',
  styleUrls: ['./reviewers.component.css']
})
export class ReviewersComponent implements OnInit {
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  private gridApi!: GridApi;
  // *** NEW PROPERTY ***
  selectedEmployee: Employee | null = null;
  // Autocomplete properties
  organizationSearchCtrl = new FormControl<Organization | string>('');
  filteredOrganizations!: Observable<Organization[]>;
  allOrganizations: Organization[] = [];
  selectedOrganizations: Organization[] = [];

  // AG Grid properties
  rowData: Employee[] = []; // Now holds Employee data
  loadingEmployees = false;

  columnDefs: ColDef[] = [
    { headerName: 'Network ID', field: 'networkId', sortable: true, filter: true, width: 120 },
    { headerName: 'Full Name', field: 'fullName', sortable: true, filter: true, flex: 1 },
    { headerName: 'Job Title', field: 'jobTitle', sortable: true, filter: true, flex: 1 },
    { headerName: 'Organization', field: 'orgId', sortable: true, filter: true, 
      valueGetter: params => {
        // Look up the organization name based on orgId
        const org = this.allOrganizations.find(o => o.id === params.data.orgId);
        return org ? org.name : 'Unknown';
      },
      flex: 1 
    },
    { headerName: 'Remarks', field: 'remarks', editable: true, flex: 1,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: { maxLength: 500, rows: 4 }
    },
    // Action column (Remove)
    {
      headerName: 'X',
      width: 50,
      suppressMovable: true,
      resizable: false,
      filter: false,
      sortable: false,
      cellRenderer: (params: any) => {
        const eDiv = document.createElement('div');
        eDiv.className = 'ag-grid-cell-actions';
        eDiv.innerHTML = `<button class="remove-btn" mat-icon-button color="warn" style="height: 24px; width: 24px; line-height: 24px;" matTooltip="Remove">
                            <mat-icon style="font-size: 18px; height: 18px; width: 18px;">delete_forever</mat-icon>
                          </button>`;
        const button = eDiv.querySelector('.remove-btn');
        if (button) {
          button.addEventListener('click', () => this.removeEmployeeFromGrid(params.data));
        }
        return eDiv;
      }
    }
  ];

  defaultColDef: ColDef = { resizable: true, filter: true, sortable: true };


  constructor(private dataService: ReviewrsService) {}

  ngOnInit(): void {
    // 1. Fetch all organizations for the initial list
    this.dataService.getOrganizations().subscribe(orgs => {
      this.allOrganizations = orgs;
      
      // 2. Set up autocomplete filtering
      this.filteredOrganizations = this.organizationSearchCtrl.valueChanges.pipe(
        startWith(''),
        map(value => (typeof value === 'string' ? value : value?.name || '')),
        map(name => this._filter(name))
      );
    });
  }

  // Autocomplete filtering logic
  private _filter(value: string): Organization[] {
    const filterValue = value.toLowerCase();
    const currentSelectedCodes = new Set(this.selectedOrganizations.map(o => o.code));

    return this.allOrganizations.filter(org =>
      !currentSelectedCodes.has(org.code) && // Don't show already selected organizations
      (org.name.toLowerCase().includes(filterValue) || org.code.toLowerCase().includes(filterValue))
    );
  }

  // Display function for autocomplete
  displayOrganization(org: Organization): string {
    return org ? `${org.name} (${org.code})` : '';
  }

  // --- Organization Selection (Key Logic Change) ---
  onOrganizationSelected(event: any): void {
    const organization: Organization = event.option.value;
    if (!organization) return;

    if (!this.selectedOrganizations.find(o => o.code === organization.code)) {
      this.selectedOrganizations.push(organization);
      this.organizationSearchCtrl.setValue(''); // Clear the input

      // FETCH EMPLOYEES and add them to the grid
      this.fetchAndAddEmployees(organization);
    }
  }

  fetchAndAddEmployees(organization: Organization): void {
    this.loadingEmployees = true;
    this.dataService.getEmployeesByOrganization(organization.code).subscribe({
      next: (employees) => {
        // Filter out employees already in the grid (if employee IDs conflict across orgs)
        const existingIds = new Set(this.rowData.map(e => e.id));
        const newEmployees = employees.filter(emp => !existingIds.has(emp.id));
        
        // Add new employees to the existing rowData array
        this.rowData = [...this.rowData, ...newEmployees]; 
        
        if (this.gridApi) {
            this.gridApi.setRowData(this.rowData); // Update the grid
            // this.gridApi.sizeColumnsToFit();
        }
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
      },
      complete: () => {
        this.loadingEmployees = false;
      }
    });
  }

  // Remove an Organization (removes all its employees from the grid)
  removeSelectedOrganization(organization: Organization): void {
    // 1. Remove organization from selected list
    this.selectedOrganizations = this.selectedOrganizations.filter(o => o.code !== organization.code);
    
    // 2. Remove all employees belonging to this organization from rowData
    this.rowData = this.rowData.filter(emp => emp.orgId !== organization.id);
    
    if (this.gridApi) {
        this.gridApi.setRowData(this.rowData);
    }
     // *** FIX: Re-run autocomplete filtering to include the removed organization ***
   this.organizationSearchCtrl.updateValueAndValidity(); 
  }

  // Remove a single employee from the AG Grid table
// reviewers.component.ts

// ... (other code above) ...

// Remove a single employee from the AG Grid table
removeEmployeeFromGrid(employeeToRemove: Employee): void {
  this.rowData = this.rowData.filter(emp => emp.id !== employeeToRemove.id);
  
  // Flag to see if the organization chip needs removing
  let organizationRemoved = false; 

  // Check if we removed the last employee of an organization, and remove the organization chip if so
  const orgEmployees = this.rowData.filter(emp => emp.orgId === employeeToRemove.orgId);
  if (orgEmployees.length === 0) {
      // Removed the last employee of this organization, so remove the organization chip as well
      this.selectedOrganizations = this.selectedOrganizations.filter(o => o.id !== employeeToRemove.orgId);
      organizationRemoved = true;
  }

  if (this.gridApi) {
      this.gridApi.setRowData(this.rowData);
  }
  
  // *** FIX: Only re-run the autocomplete filter if an organization was actually removed ***
  if (organizationRemoved) {
    this.organizationSearchCtrl.updateValueAndValidity();
  }
}

// ... (rest of the component) ...

  // AG Grid Ready Event
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  onGeneralSearch(): void {
    // This could trigger a search for organizations or employees not in the current list
    console.log('General search triggered for:', this.organizationSearchCtrl.value);
  }

  // *** NEW METHOD: Handle row click to set the selected employee ***
  onRowClicked(event: RowClickedEvent): void {
    // The data property of the event contains the Employee object
    this.selectedEmployee = event.data as Employee;
    console.log('Employee selected:', this.selectedEmployee);
  }
}