import { Component, OnInit } from '@angular/core';
import { GridApi, GridReadyEvent, ColDef, RowNode, GridOptions } from 'ag-grid-community';
// Keeping this import as requested, even though IGetRowIdParams is the conventional type
import { GetRowIdParams } from 'ag-grid-community'; 
import { RigsDataService, RowData } from '../../services/rigs-data.service'; 
import { MatDialog } from '@angular/material/dialog'; 
import { FlexLayoutModule } from '@angular/flex-layout';
import { forkJoin, Observable, of } from 'rxjs'; // Ensure 'of' is imported for deleteItems fallback
import { AgGridModule } from 'ag-grid-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip'; // Added MatTooltipModule
import { FormsModule } from '@angular/forms';

// FIX: Define an extended type for internal state tracking to resolve TypeScript error.
export type GridRowData = RowData & {
  _status: 'persisted' | 'inserted' | 'updated' | 'deleted';
  _isNew?: boolean;
  _original?: Partial<RowData>; // Stores original values for comparison
};

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [
    AgGridModule, 
    MatButtonModule, 
    MatSnackBarModule, 
    FlexLayoutModule,
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatIconModule,
    FormsModule,
    MatTooltipModule // Include Tooltip Module
  ],
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
})
export class TrainingComponent implements OnInit {
  private gridApi!: GridApi;
  public rowData: GridRowData[] = [];
  public columnDefs: ColDef[] = [];
  public rowSelection: 'multiple' = 'multiple';
  public defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    editable: true, 
  };
  public rowClassRules = {
    'ag-row-deleted': (params: RowNode) => (params.data as GridRowData)._status === 'deleted',
    'ag-row-inserted': (params: RowNode) => (params.data as GridRowData)._status === 'inserted',
    'ag-row-updated': (params: RowNode) => (params.data as GridRowData)._status === 'updated',
  };

  public insertedRigsCount: number = 0;
  public updatedRigsCount: number = 0;
  public deletedRigsCount: number = 0;
  public searchText: string = '';
  public canEdit: boolean = false;
  public canDelete: boolean = false;
  public canUpdate: boolean = false; 
  private initialRowData: GridRowData[] = []; 
  private newRowIdCounter: number = -1; 

  constructor(
    private dataService: RigsDataService, 
    private dialog: MatDialog,
    private snackBar: MatSnackBar // Injected MatSnackBar for non-blocking notifications
  ) {
    this.columnDefs = this.setupColumnDefinitions();
  }

  ngOnInit(): void {
    this.fetchInitialData();
  }
  
  /**
   * Helper to display a non-blocking message.
   * @param message The message to display.
   * @param action The action label (e.g., 'Close').
   */
  private showMessage(message: string, action: string = 'Close'): void {
    this.snackBar.open(message, action, {
      duration: 3000,
      panelClass: ['snackbar-style']
    });
  }

  // --- AG Grid Setup ---
  private setupColumnDefinitions(): ColDef[] {
    return [
      {
        headerName: '', 
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        width: 60,
        minWidth: 60,
        maxWidth: 60,
        resizable: false,
        suppressMovable: true,
        pinned: 'left'
      },
      { field: 'rigCode', headerName: 'Rig Code', minWidth: 120, editable: true },
      { field: 'rigName', headerName: 'Rig Name', minWidth: 150, editable: true },
      { field: 'location', headerName: 'Location', minWidth: 150, editable: true },
      { field: 'rigType', headerName: 'Rig Type', minWidth: 120, editable: true },
      { field: 'opPlanFlag', headerName: 'Op Plan Flag', minWidth: 100, editable: true,
        cellEditor: 'agSelectCellEditor', 
        cellEditorParams: {
          values: ['Y', 'N']
        },
        // Using valueFormatter for visual text, keeping data as Y/N
        valueFormatter: (params: any) => params.value === 'Y' ? 'Yes' : (params.value === 'N' ? 'No' : params.value) 
      },
      { field: 'companyCode', headerName: 'Company Code', minWidth: 120, editable: true },
      { field: 'companyName', headerName: 'Company Name', minWidth: 150, editable: true },
      { field: 'justificatio', headerName: 'Justification', minWidth: 200, editable: true }
    ];
  }

  // --- Data Handling ---
  private fetchInitialData(): void {
    this.dataService.getInitialData().subscribe({
      next: (data: any[]) => {
        console.log('Fetched initial data:', JSON.stringify(data) );
        // Map fetched data, adding status and ID for AG Grid tracking. 
        // This array holds the immutable source of truth objects.
        this.initialRowData = data.map((row: RowData) => ({ ...row, _status: 'persisted' } as GridRowData));
        console.log('Mapped initial data:', JSON.stringify(this.initialRowData));
        // FIX: Use map and spread to create new object instances for rowData.
        // This prevents AG Grid from mutating the shared object references in this.initialRowData.
        this.rowData = this.initialRowData.map(row => ({ ...row }));

        this.updateCounts();
        this.canUpdate = this.hasPendingChanges();
      },
      error: (err: any) => {
        console.error('Failed to fetch initial data. Is JSON Server running?', err);
        this.showMessage('Failed to fetch data. Check API connection.', 'Error');
      }
    });
  }

  // --- Grid Events ---
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onSelectionChanged(): void {
    const selectedNodes = this.gridApi.getSelectedNodes();
    this.canEdit = selectedNodes.length === 1; 
    this.canDelete = selectedNodes.length > 0;
    this.canUpdate = this.hasPendingChanges(); 
  }

  /**
   * Handles a cell value change event from the grid.
   * This is where we capture the original state if the row is edited for the first time.
   */
  onCellValueChanged(event: any): void {
    const updatedRow: GridRowData = event.data;

    if (updatedRow._isNew) {
      // New row status must remain 'inserted'
      updatedRow._status = 'inserted';
    } else if (updatedRow._status !== 'deleted') {
      // Only mark as updated if it's an existing (persisted) row that isn't deleted
      
      // If this is the first change, capture the original state before setting status to 'updated'
      if (!updatedRow._original) {
          // Find the original pristine row from the source array
          const originalRow = this.initialRowData.find(r => r.id === updatedRow.id);
          
          if (originalRow) {
            const originalData: Partial<RowData> = {};
            // Keys to check for RowData fields (excluding internal tracking fields)
            const rowDataKeys: (keyof RowData)[] = ['rigCode', 'rigName', 'location', 'rigType', 'opPlanFlag', 'companyCode', 'companyName', 'justificatio'];
            
            // Explicitly copy only the clean data fields
            rowDataKeys.forEach(key => {
                if (key in originalRow) {
                    // Copy the original value from the PRISTINE row
                    (originalData as any)[key] = (originalRow as any)[key];
                }
            });
            updatedRow._original = originalData;
          } else {
             // Should not happen for persisted rows
             updatedRow._original = {};
          }
      }

      // Mark status as updated
      updatedRow._status = 'updated';
    }
    
    // Force grid to re-render to update row styling/status visually
    this.gridApi.applyTransaction({ update: [updatedRow] }); 
    this.updateCounts();
    this.canUpdate = this.hasPendingChanges();
  }

  // --- Action Handlers ---

  onAddRig(): void {
    const newRig: GridRowData = {
      id: this.newRowIdCounter--, 
      rigCode: 'NEW',
      rigName: 'New Rig',
      location: 'Alld',
      rigType: 'PVLTD',
      opPlanFlag: 'N',
      companyCode: '003',
      companyName: 'New Company',
      justificatio: 'User Added',
      _status: 'inserted', 
      _isNew: true 
    };
    this.rowData = [newRig, ...this.rowData]; 
    this.gridApi.setRowData(this.rowData); 
    this.gridApi.ensureIndexVisible(0); 
    this.updateCounts();
    this.canUpdate = this.hasPendingChanges();
  }

  onEditRig(): void {
    const selectedNodes = this.gridApi.getSelectedNodes();
    if (selectedNodes.length === 1) {
      const firstCol = this.columnDefs.find(col => col.field)?.field;
      if (firstCol) {
          this.gridApi.startEditingCell({
              rowIndex: selectedNodes[0].rowIndex!,
              colKey: firstCol
          });
      }
    }
  }

  onDeleteRig(): void {
    const selectedNodes = this.gridApi.getSelectedNodes();
    if (selectedNodes.length === 0) return;

    // Cast data to GridRowData to access _status
    const rowsToMark = selectedNodes.map(node => node.data as GridRowData).filter(row => row && row._status !== 'deleted');
    
    if (rowsToMark.length === 0) return;

    // NOTE: Using a simple JS confirmation for the deletion prompt
    if (confirm(`Are you sure you want to mark ${rowsToMark.length} rig(s) for deletion?`)) {
        
        const updatedRowData: GridRowData[] = this.rowData.map(row => {
            if (rowsToMark.some(r => Number(r.id) === Number(row.id))) {
                return { ...row, _status: 'deleted' };
            }
            return row;
        });

        this.rowData = updatedRowData;
        this.gridApi.setRowData(this.rowData); 
        this.gridApi.deselectAll();
        this.updateCounts();
        this.canUpdate = this.hasPendingChanges();
    }
  }

  onUpdateRigs(): void {
    this.gridApi.stopEditing(); 
    
    // 1. Filter rows by status
    const inserted = this.rowData.filter(row => row._status === 'inserted'); 
    const updated = this.rowData.filter(row => row._status === 'updated');
    const deleted = this.rowData.filter(row => row._status === 'deleted' && !row._isNew); 
    const locallyDeletedNew = this.rowData.filter(row => row._status === 'deleted' && row._isNew);

    const apiCalls: Observable<any>[] = [];
    const rowDataKeys: (keyof RowData)[] = ['id','rigCode', 'rigName', 'location', 'rigType', 'opPlanFlag', 'companyCode', 'companyName', 'justificatio'];

    /**
     * @description Normalizes a value for reliable string comparison. 
     * Treats null, undefined, and empty/whitespace string as a single 'empty' state (null).
     */
    const normalizeForComparison = (value: any): string | null => {
        if (value === null || value === undefined) return null;
        const s = String(value).trim();
        return s === '' ? null : s;
    };

    // 1. Process inserted rows (POST)
    inserted.forEach(row => {
      const { id, _status, _isNew, _original, ...itemToSend } = row as GridRowData;
      apiCalls.push(this.dataService.addItem(itemToSend as RowData));
    });

    // 2. Process updated rows (PATCH)
    let successfullyUpdatedRowsCount = 0;
    updated.forEach(row => {
      const changedFields: Partial<RowData> = {};
      
      rowDataKeys.forEach(key => {
        if (row._original && row._original.hasOwnProperty(key)) {
            const currentValue = row[key];
            const originalValue = row._original[key];
            
            // CRITICAL: Use the robust normalizer for accurate single-cell change detection
            const normalizedCurrent = normalizeForComparison(currentValue);
            const normalizedOriginal = normalizeForComparison(originalValue);

            if (normalizedCurrent !== normalizedOriginal) {
                // If a difference is found, add the current raw value to the payload.
                (changedFields as any)[key] = currentValue;
            }
        }
      });
      
      if (Object.keys(changedFields).length > 0) {
        // Only call update if changes were detected
        apiCalls.push(this.dataService.updateItem(row.id, changedFields));
        successfullyUpdatedRowsCount++;
      } else {
        // FIX: If no changes were detected (e.g., user typed the same value back in), 
        // revert status to 'persisted' and remove _original to clean up state
        row._status = 'persisted';
        delete row._original;
        console.warn(`Row ID ${row.id} marked as 'updated' but no field changes detected. Reverting status.`);
      }
    });

    // 3. Process deleted rows (DELETE)
    const backendDeletedIds = deleted.map(row => row.id);
    if (backendDeletedIds.length > 0) {
        // NOTE: Assuming dataService.deleteItems can handle multiple IDs (forkJoin required it)
        apiCalls.push(this.dataService.deleteItems(backendDeletedIds));
    }

    if (apiCalls.length > 0 || locallyDeletedNew.length > 0) {
      forkJoin(apiCalls).subscribe({
        next: () => {
          this.showMessage('All changes saved successfully!'); 
          // Re-fetch initial data to refresh the grid with server-assigned IDs and reset state
          this.fetchInitialData(); 
          this.gridApi.deselectAll();
        },
        error: (err) => {
          console.error('Error saving changes:', err);
          this.showMessage('Failed to save some changes. Check console.', 'Error');
          this.canUpdate = this.hasPendingChanges();
        }
      });
    } else {
        this.showMessage('No pending changes to save.');
        // If updates were reverted due to no diff, ensure the grid and counts are updated
        this.gridApi.redrawRows();
        this.updateCounts();
        this.canUpdate = this.hasPendingChanges();
    }
  }

  // --- Utility Methods ---

  private hasPendingChanges(): boolean {
    return this.rowData.some(row => row._status !== 'persisted');
  }

  private updateCounts(): void {
    this.insertedRigsCount = this.rowData.filter(row => row._status === 'inserted').length;
    this.updatedRigsCount = this.rowData.filter(row => row._status === 'updated').length;
    this.deletedRigsCount = this.rowData.filter(row => row._status === 'deleted').length;
  }

  onSearchInput(): void {
    this.gridApi.setQuickFilter(this.searchText);
  }

  getRowId(params: GetRowIdParams): string {
    const row = params.data as GridRowData;
    // Use the temporary negative ID for new rows, and the server ID for persisted/updated rows
    return row._isNew ? `new-${row.id}` : `persisted-${row.id}`;
  }
}