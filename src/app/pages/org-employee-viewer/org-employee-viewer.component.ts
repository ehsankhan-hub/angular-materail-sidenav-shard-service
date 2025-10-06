import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, startWith, map, forkJoin } from 'rxjs';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select'; 
import { MatChipsModule } from '@angular/material/chips'; // FIX: Imported for chip functionality

// Third-Party Library Imports
import { FlexLayoutModule } from '@angular/flex-layout';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

// Local Imports
import { Organization, Employee } from '../../services/data.service'; 
import { DataService } from '../../services/data.service'; 
import { CheckboxCellRendererComponent } from './checkbox-cell-renderer.component'; 

@Component({
  selector: 'app-org-employee-viewer',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FlexLayoutModule,
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatAutocompleteModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule, 
    MatChipsModule,
    AgGridAngular 
    
  ],
  templateUrl: './org-employee-viewer.component.html',
  styleUrls: ['./org-employee-viewer.component.scss']
})
export class OrgEmployeeViewerComponent implements OnInit {

  // --- Multi-Select Autocomplete State ---
  // Stores array of selected organization codes
  orgControl = new FormControl<string[]>([]); 
  searchInputControl = new FormControl<string>('');
  allOrganizations: Organization[] = [];
  filteredOrganizations$!: Observable<Organization[]>;
  
  // --- Grid State ---
  private mainGridApi!: GridApi;
  private selectedGridApi!: GridApi;
  //mainEmployeeData = signal<Employee[]>([]); 
  mainEmployeeData = signal<Employee[]>([]); 
  selectedEmployeeData = signal<Employee[]>([]); 
  isLoadingEmployees = signal(false);

  // Ag-Grid Definitions
  mainColumnDefs: ColDef[] = this.createColumnDefsMain(false); 
  selectedColumnDefs: ColDef[] = this.createColumnDefs(true); 
  defaultColDef: ColDef = { sortable: true, filter: true, resizable: true };
  // Pass component instance to cell renderer for callback
  gridContext = { parentComponent: this }; 

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    // Load organizations once
    this.dataService.getOrganizations().subscribe(data => {
      this.allOrganizations = data;
    });

    // Setup Autocomplete Filtering
    this.filteredOrganizations$ = this.searchInputControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  // --- Multi-Select Autocomplete Helpers ---

  /** Filters the organization list based on user input. */
  private _filter(value: string): Organization[] {
    const filterValue = value.toLowerCase();
    return this.allOrganizations.filter(
      org => org.name.toLowerCase().includes(filterValue) || org.code.toLowerCase().includes(filterValue)
    );
  }
  
  /** Selects the organization code when an item is clicked in the autocomplete list. */
  onOrgSelected(code: string): void {
    const currentCodes = this.orgControl.value || [];
    if (!currentCodes.includes(code)) {
      this.orgControl.setValue([...currentCodes, code]);
      this.loadEmployeesForSelectedOrgs(); // FIX: Explicitly trigger data load
    }
    this.searchInputControl.setValue(''); 
  }

  /** Removes an organization code when the chip close button is clicked. */
  removeOrg(code: string): void {
    const currentCodes = this.orgControl.value || [];
    this.orgControl.setValue(currentCodes.filter(c => c !== code));
    this.loadEmployeesForSelectedOrgs(); // FIX: Explicitly trigger data load
  }

  // --- Data Loading Logic (FIXED to be explicitly called) ---

  /** Triggers the API calls and updates the main grid data. */
  loadEmployeesForSelectedOrgs(): void {
    const codes = this.orgControl.value || [];

    if (codes.length === 0) {
      this.updateMainGridData([]);
      return;
    }
    
    this.isLoadingEmployees.set(true);
    
    const employeeObservables = codes.map(code => this.dataService.getEmployeesByOrg(code));
    
    forkJoin(employeeObservables).pipe(
      map(employeeArrays => employeeArrays.flat())
    ).subscribe({
        next: (allEmployees) => {
            this.isLoadingEmployees.set(false);
            this.updateMainGridData(allEmployees);
        },
        error: (err) => {
            console.error('Error loading employees:', err);
            this.isLoadingEmployees.set(false);
            this.updateMainGridData([]); 
        }
    });
  }


  // --- Data Management & Movement Logic ---

  /** Updates the main grid data, ensuring selected employees are not duplicated. */
// src/app/org-employee-viewer/org-employee-viewer.component.ts

updateMainGridData(allEmployees: Employee[]): void {
  // ⬅️ SET BREAKPOINT HERE (Check if this line is reached)
  console.log('--- UPDATE MAIN GRID DATA ---'); 
  console.log('1. All Employees Fetched:', allEmployees.length); 
  
  const selectedCodes = new Set(this.selectedEmployeeData().map(e => e.code));
  
  // Filter out employees that are already in the selected list
  const filteredMainData = allEmployees.filter(e => !selectedCodes.has(e.code));
  
  console.log('2. Data after filtering selected:', filteredMainData.length);
  
  this.mainEmployeeData.set(filteredMainData);
  
  // ⬅️ CRITICAL CHECK: Is this block executing?
  if (this.mainGridApi) { 
      console.log('3. mainGridApi is READY. Calling setRowData.');
      this.mainGridApi.setRowData(this.mainEmployeeData());
      this.mainGridApi.sizeColumnsToFit();
  } else {
      console.error('3. ERROR: mainGridApi is NOT ready when data arrived.');
  }
}

  /** Moves an employee between the main and selected grids. */
  moveEmployee(employee: Employee, isMovingToSelected: boolean): void {
    const employeeCode = employee.code; 

    if (isMovingToSelected) {
      // Move FROM Main Grid TO Selected Grid
      this.mainEmployeeData.update(data => data.filter(e => e.code !== employeeCode));
      const newSelected = { ...employee, isSelected: true }; 
      this.selectedEmployeeData.update(data => [...data, newSelected]);

    } else {
      // Move FROM Selected Grid TO Main Grid (if org is still selected)
      this.selectedEmployeeData.update(data => data.filter(e => e.code !== employeeCode));
      
      const selectedOrgCodes = this.orgControl.value || [];
      if (selectedOrgCodes.includes(employee.orgCode)) {
         this.mainEmployeeData.update(data => {
            const returnedEmployee = { ...employee, isSelected: false };
            return [...data, returnedEmployee]; 
         });
      }
    }

    // Refresh Ag-Grid views
    this.mainGridApi?.setRowData(this.mainEmployeeData());
    this.selectedGridApi?.setRowData(this.selectedEmployeeData());
    this.mainGridApi?.sizeColumnsToFit();
    this.selectedGridApi?.sizeColumnsToFit();
  }


  // --- Ag-Grid Helpers ---

  /** Defines the columns for Ag-Grid. The 'isForSelectedGrid' flag sets the checkbox logic. */
  createColumnDefsMain(isForSelectedGrid: boolean): ColDef[] {
    const headerName = isForSelectedGrid ? 'Remove' : 'Select';

    return [
      {
        headerName: headerName,
        field: 'isSelected', 
        cellRenderer: CheckboxCellRendererComponent,
        cellRendererParams: { 
            initialChecked: isForSelectedGrid // Tells the renderer its context
        },
        width: 100,
        pinned: 'left',
        sortable: false,
        filter: false,
        suppressMovable: true,
      },
      // ... (other column definitions)
      // { headerName: 'Org Code', field: 'orgCode', width: 100 },
      { headerName: 'Network ID', field: 'networkId', width: 120 },
      { headerName: 'Full Name', field: 'fullName', flex: 1 },
      // { headerName: 'Job Title', field: 'jobTitle', width: 150 },
      // { headerName: 'Remarks', field: 'remarks', width: 100 }
    ];
  }


  createColumnDefs(isForSelectedGrid: boolean): ColDef[] {
    const headerName = isForSelectedGrid ? 'Remove' : 'Select';

    return [
      {
        headerName: headerName,
        field: 'isSelected', 
        cellRenderer: CheckboxCellRendererComponent,
        cellRendererParams: { 
            initialChecked: isForSelectedGrid // Tells the renderer its context
        },
        width: 100,
        pinned: 'left',
        sortable: false,
        filter: false,
        suppressMovable: true,
      },
      // ... (other column definitions)
      { headerName: 'Org Code', field: 'orgCode', width: 100 },
      { headerName: 'Network ID', field: 'networkId', width: 120 },
      { headerName: 'Full Name', field: 'fullName', flex: 1 },
      { headerName: 'Job Title', field: 'jobTitle', width: 150 },
      { headerName: 'Remarks', field: 'remarks', width: 100 }
    ];
  }

  onMainGridReady(params: GridReadyEvent): void {
    this.mainGridApi = params.api;
    this.mainGridApi.sizeColumnsToFit();
  }

  onSelectedGridReady(params: GridReadyEvent): void {
    this.selectedGridApi = params.api;
    this.selectedGridApi.sizeColumnsToFit();
  }

  onExportSelected(): void {
    console.log('Final Selected Employees:', this.selectedEmployeeData());
    alert(`Exporting ${this.selectedEmployeeData().length} employees...`);
  }
}