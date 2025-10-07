


// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { Observable, forkJoin, map, startWith } from 'rxjs';

// // Angular Material
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatAutocompleteModule } from '@angular/material/autocomplete';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// // Layout and AG Grid
// import { FlexLayoutModule } from '@angular/flex-layout';
// import { AgGridAngular } from 'ag-grid-angular';
// import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

// // Mock Services / Models
// import { Organization, Employee, DataService } from '../../services/data.service';

// @Component({
//   selector: 'app-org-employee-viewer',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     FlexLayoutModule,
//     MatCardModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatAutocompleteModule,
//     MatButtonModule,
//     MatIconModule,
//     MatChipsModule,
//     MatSnackBarModule,
//     AgGridAngular,
//   ],
//   templateUrl: './org-employee-viewer.component.html',
//   styleUrls: ['./org-employee-viewer.component.scss'],
// })
// export class OrgEmployeeViewerComponent implements OnInit {
//   // --- Form Controls ---
//   orgControl = new FormControl<string[]>([]);
//   searchInputControl = new FormControl<string>('');
//   allOrganizations: Organization[] = [];
//   filteredOrganizations$!: Observable<Organization[]>;

//   // --- Signals ---
//   mainEmployeeData = signal<Employee[]>([]);
//   selectedEmployeeData = signal<Employee[]>([]);
//   isLoadingEmployees = signal(false);

//   // --- AG Grid API ---
//   private mainGridApi!: GridApi;
//   private selectedGridApi!: GridApi;

//   // --- Computed ---
//   isProcessEnabled = computed(() => this.selectedEmployeeData().length > 0);

//   // --- Column Definitions ---
//   mainColumnDefs: ColDef[] = [
//     {
//       headerName: '',
//       checkboxSelection: true,
//       headerCheckboxSelection: true,
//       width: 50,
//     },
//     { headerName: 'Org Code', field: 'orgCode', width: 120 },
//     { headerName: 'Network ID', field: 'networkId', width: 120 },
//     { headerName: 'Full Name', field: 'fullName', flex: 1 },
//     { headerName: 'Job Title', field: 'jobTitle', width: 150 },
//   ];

//   selectedColumnDefs: ColDef[] = [
//     {
//       headerName: '',
//       checkboxSelection: true,
//       headerCheckboxSelection: true,
//       width: 50,
//     },
//     { headerName: 'Org Code', field: 'orgCode', width: 120 },
//     { headerName: 'Network ID', field: 'networkId', width: 120 },
//     { headerName: 'Full Name', field: 'fullName', flex: 1 },
//     { headerName: 'Job Title', field: 'jobTitle', width: 150 },
//   ];

//   defaultColDef: ColDef = { sortable: true, filter: true, resizable: true };

//   constructor(private dataService: DataService, private snackBar: MatSnackBar) {}

//   ngOnInit(): void {
//     this.dataService.getOrganizations().subscribe((data) => (this.allOrganizations = data));
//     this.filteredOrganizations$ = this.searchInputControl.valueChanges.pipe(
//       startWith(''),
//       map((value) => this._filter(value || ''))
//     );
//    // this.getEmployeesByCr(123);
//   }

//   private _filter(value: string): Organization[] {
//     const filterValue = value.toLowerCase();
//     return this.allOrganizations.filter(
//       (org) =>
//         org.name.toLowerCase().includes(filterValue) ||
//         org.code.toLowerCase().includes(filterValue)
//     );
//   }

//   onOrgSelected(code: string): void {
//     const currentCodes = this.orgControl.value || [];
//     if (!currentCodes.includes(code)) {
//       this.orgControl.setValue([...currentCodes, code]);
//       this.loadEmployeesForSelectedOrgs();
//     }
//     this.searchInputControl.setValue('');
//   }

//   removeOrg(code: string): void {
//     const currentCodes = this.orgControl.value || [];
//     this.orgControl.setValue(currentCodes.filter((c) => c !== code));
//     this.loadEmployeesForSelectedOrgs();
//   }

//   loadEmployeesForSelectedOrgs(): void {
//     const codes = this.orgControl.value || [];
//     if (codes.length === 0) {
//       this.mainEmployeeData.set([]);
//       return;
//     }

//     this.isLoadingEmployees.set(true);
//     const employeeRequests = codes.map((c) => this.dataService.getEmployeesByOrg(c));

//     forkJoin(employeeRequests)
//       .pipe(map((arrays) => arrays.flat()))
//       .subscribe({
//         next: (employees) => {
//           this.isLoadingEmployees.set(false);
//           this.mainEmployeeData.set(employees);
//           this.mainGridApi?.setGridOption('rowData', employees);
//         },
//         error: () => {
//           this.isLoadingEmployees.set(false);
//           this.mainEmployeeData.set([]);
//         },
//       });
//   }

//   onMainGridReady(params: GridReadyEvent): void {
//     this.mainGridApi = params.api;
//     this.mainGridApi.sizeColumnsToFit();

//     this.mainGridApi.addEventListener('selectionChanged', () => {
//       const selectedRows = this.mainGridApi.getSelectedRows();
//       if (selectedRows.length > 0) {
//         // Move selected rows to Selected Employees
//         const updatedSelected = [...this.selectedEmployeeData(), ...selectedRows];
//         this.selectedEmployeeData.set(updatedSelected);

//         // Remove from Main Grid
//         const remaining = this.mainEmployeeData().filter(
//           (emp) => !selectedRows.some((sel) => sel.networkId === emp.networkId)
//         );
//         this.mainEmployeeData.set(remaining);
//         this.mainGridApi.applyTransaction({ add: remaining });
//         this.selectedGridApi.applyTransaction({ add: selectedRows });
//       }
//     });
//   }

//   onSelectedGridReady(params: GridReadyEvent): void {
//     this.selectedGridApi = params.api;
//     this.selectedGridApi.sizeColumnsToFit();
//   }

//   // changeReques:any;
//   // getEmployeesByCr(chId:number): void {
//   //   this.dataService.getEmployeesByCr(chId).subscribe(data => {
//   //     console.log('data', data);
//   //     this.changeReques=data
//   //   })
//   // }

//   onProcessSelected(): void {
//     const selected = this.selectedEmployeeData();
//     if (selected.length === 0) return;
// console.log(' selected ',selected)
//     // Mock send to backend (JSON Server)
//     this.dataService.sendProcessedEmployees(selected).subscribe({
//       next: () => this.snackBar.open('Employees processed successfully!', 'OK', { duration: 2000 }),
//       error: () => this.snackBar.open('Error processing employees', 'OK', { duration: 2000 }),
//     });
//   }
// }

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, forkJoin, map, startWith } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Layout and AG Grid
import { FlexLayoutModule } from '@angular/flex-layout';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

// Models / Service
import { Organization, Employee, DataService } from '../../services/data.service';

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
    MatChipsModule,
    MatSnackBarModule,
    AgGridAngular,
  ],
  templateUrl: './org-employee-viewer.component.html',
  styleUrls: ['./org-employee-viewer.component.scss'],
})
export class OrgEmployeeViewerComponent implements OnInit {
  // --- Form Controls ---
  orgControl = new FormControl<string[]>([]);
  searchInputControl = new FormControl<string>('');
  allOrganizations: Organization[] = [];
  filteredOrganizations$!: Observable<Organization[]>;

  // --- Signals ---
  mainEmployeeData = signal<Employee[]>([]);
  selectedEmployeeData = signal<Employee[]>([]);
  isLoadingEmployees = signal(false);

  // tracks whether user has selected (checked) rows inside the Selected grid
  selectedGridHasSelection = signal(false);

  // --- AG Grid API refs ---
  private mainGridApi!: GridApi;
  private selectedGridApi!: GridApi;

  // --- computed for button enablement (enabled when a checkbox is clicked in Selected grid) ---
  isProcessEnabled = computed(() => this.selectedGridHasSelection());

  // --- Column defs ---
  mainColumnDefs: ColDef[] = [
    { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 50 },
    { headerName: 'Org Code', field: 'orgCode', width: 120 },
    { headerName: 'Network ID', field: 'networkId', width: 120 },
    { headerName: 'Full Name', field: 'fullName', flex: 1 },
    { headerName: 'Job Title', field: 'jobTitle', width: 150 },
  ];

  selectedColumnDefs: ColDef[] = [
    { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 50 },
    { headerName: 'Org Code', field: 'orgCode', width: 120 },
    { headerName: 'Network ID', field: 'networkId', width: 120 },
    { headerName: 'Full Name', field: 'fullName', flex: 1 },
    { headerName: 'Job Title', field: 'jobTitle', width: 150 },
  ];

  defaultColDef: ColDef = { sortable: true, filter: true, resizable: true };

  // make transactions reliable by identifying rows via networkId
  getRowId = (params: any) => params.data?.networkId?.toString();

  constructor(private dataService: DataService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // load orgs for autocomplete
    this.dataService.getOrganizations().subscribe((data) => (this.allOrganizations = data));
    this.filteredOrganizations$ = this.searchInputControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );

    // preload any existing approvers from mock DB
    this.loadExistingApprovers();
  }

  private _filter(value: string): Organization[] {
    const filterValue = value.toLowerCase();
    return this.allOrganizations.filter(
      (org) =>
        org.name.toLowerCase().includes(filterValue) ||
        org.code.toLowerCase().includes(filterValue)
    );
  }

  onOrgSelected(code: string): void {
    const currentCodes = this.orgControl.value || [];
    if (!currentCodes.includes(code)) {
      this.orgControl.setValue([...currentCodes, code]);
      this.loadEmployeesForSelectedOrgs();
    }
    this.searchInputControl.setValue('');
  }

  removeOrg(code: string): void {
    const currentCodes = this.orgControl.value || [];
    this.orgControl.setValue(currentCodes.filter((c) => c !== code));
    this.loadEmployeesForSelectedOrgs();
  }

  /** Load employees for selected org codes; filter out those already in Selected grid.
   *  Use applyTransaction diffs so grid updates are delta-based (AG Grid v34 friendly).
   */
  loadEmployeesForSelectedOrgs(): void {
    const codes = this.orgControl.value || [];
    if (codes.length === 0) {
      // clear main grid via transaction
      const old = this.mainEmployeeData();
      if (this.mainGridApi && old.length) {
        this.mainGridApi.applyTransaction({ remove: [...old] });
      }
      this.mainEmployeeData.set([]);
      return;
    }

    this.isLoadingEmployees.set(true);
    const employeeRequests = codes.map((c) => this.dataService.getEmployeesByOrg(c));

    forkJoin(employeeRequests)
      .pipe(map((arrays) => arrays.flat()))
      .subscribe({
        next: (employees) => {
          this.isLoadingEmployees.set(false);

          // remove those already in selectedEmployeeData
          const existIds = new Set(this.selectedEmployeeData().map((s) => s.networkId));
          const filtered = employees.filter((e) => !existIds.has(e.networkId));

          // compute diff vs current main data and apply transaction
          const oldMain = this.mainEmployeeData();
          const diff = this._diffByKey(oldMain, filtered, 'networkId');

          // update signal (source of truth)
          this.mainEmployeeData.set(filtered);

          // apply transaction with only non-empty ops
          if (this.mainGridApi) {
            const tx: any = {};
            if (diff.toRemove.length) {
              const removeObjs = oldMain.filter((r) => diff.toRemove.includes(r.networkId));
              tx.remove = removeObjs;
            }
            if (diff.toAdd.length) tx.add = diff.toAdd;
            if (diff.toUpdate.length) tx.update = diff.toUpdate;

            if (Object.keys(tx).length) {
              this.mainGridApi.applyTransaction(tx);
            }
            this.mainGridApi.sizeColumnsToFit();
          }
        },
        error: () => {
          this.isLoadingEmployees.set(false);
          const old = this.mainEmployeeData();
          if (this.mainGridApi && old.length) {
            this.mainGridApi.applyTransaction({ remove: [...old] });
          }
          this.mainEmployeeData.set([]);
        },
      });
  }

  /** Load pre-existing approvers and populate Selected grid */
  loadExistingApprovers(): void {
    // adjust chId or endpoint as needed (you're using getEmployeesByCr)
    this.dataService.getEmployeesByCr(123).subscribe({
      next: (approvers) => {
        const existing = approvers || [];
        this.selectedEmployeeData.set(existing);

        // if selected grid already ready, add via transaction
        if (this.selectedGridApi && existing.length) {
          this.selectedGridApi.applyTransaction({ add: existing });
          this.selectedGridApi.sizeColumnsToFit();
        }
      },
      error: (err) => {
        console.error('Error loading existing approvers', err);
      },
    });
  }

  onMainGridReady(params: GridReadyEvent): void {
    this.mainGridApi = params.api;
    this.mainGridApi.sizeColumnsToFit();

    // if main signal already has rows, ensure they are present in grid
    const currentMain = this.mainEmployeeData();
    if (currentMain && currentMain.length) {
      this.mainGridApi.applyTransaction({ add: currentMain });
    }

    // when user selects rows in main grid: remove them from main and add to selected
    this.mainGridApi.addEventListener('selectionChanged', () => {
      const selectedRows: Employee[] = this.mainGridApi.getSelectedRows() || [];
      if (selectedRows.length === 0) return;

      // 1) remove from main grid (by data objects)
      this.mainGridApi.applyTransaction({ remove: selectedRows });

      // 2) add to selected grid (avoid duplicates)
      const existingIds = new Set(this.selectedEmployeeData().map((s) => s.networkId));
      const toAdd = selectedRows.filter((r) => !existingIds.has(r.networkId));
      if (toAdd.length) {
        if (this.selectedGridApi) {
          this.selectedGridApi.applyTransaction({ add: toAdd });
        }
      }

      // 3) update signals
      const remaining = this.mainEmployeeData().filter(
        (emp) => !selectedRows.some((sel) => sel.networkId === emp.networkId)
      );
      this.mainEmployeeData.set(remaining);

      const mergedSelected = [...this.selectedEmployeeData(), ...toAdd];
      this.selectedEmployeeData.set(mergedSelected);
    });
  }

  onSelectedGridReady(params: GridReadyEvent): void {
    this.selectedGridApi = params.api;
    this.selectedGridApi.sizeColumnsToFit();

    // populate preloaded selected rows if present
    const preloaded = this.selectedEmployeeData();
    if (preloaded && preloaded.length) {
      this.selectedGridApi.applyTransaction({ add: preloaded });
    }

    // keep track of whether user has checked rows inside the Selected grid
    this.selectedGridApi.addEventListener('selectionChanged', () => {
      const count = this.selectedGridApi.getSelectedRows().length || 0;
      this.selectedGridHasSelection.set(count > 0);
    });
  }

  onProcessSelected(): void {
    const selectedAll = this.selectedEmployeeData();
    if (!selectedAll || selectedAll.length === 0) return;

    // submit all selected rows (preloaded + newly added) to backend
    this.dataService.sendProcessedEmployees(selectedAll).subscribe({
      next: () => {
        this.snackBar.open('Employees processed successfully!', 'OK', { duration: 2000 });
        // optionally deselect any checkboxes and clear has-selection flag:
        this.selectedGridApi?.deselectAll();
        this.selectedGridHasSelection.set(false);
      },
      error: (err) => {
        console.error('Error sending processed employees', err);
        this.snackBar.open('Error processing employees', 'OK', { duration: 2000 });
      },
    });
  }

  // Utility: return { toAdd: Employee[], toRemove: string[] (ids), toUpdate: Employee[] }
  private _diffByKey(oldArr: Employee[], newArr: Employee[], key: keyof Employee) {
    const oldMap = new Map<string, Employee>(oldArr.map((r) => [String(r[key]), r]));
    const newMap = new Map<string, Employee>(newArr.map((r) => [String(r[key]), r]));

    const toAdd: Employee[] = [];
    const toUpdate: Employee[] = [];
    const toRemove: string[] = [];

    for (const n of newArr) {
      const id = String(n[key]);
      const old = oldMap.get(id);
      if (!old) {
        toAdd.push(n);
      } else if (JSON.stringify(old) !== JSON.stringify(n)) {
        toUpdate.push(n);
      }
    }

    for (const o of oldArr) {
      const id = String(o[key]);
      if (!newMap.has(id)) {
        toRemove.push(id);
      }
    }

    return { toAdd, toRemove, toUpdate };
  }
}
