import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AgGridModule } from 'ag-grid-angular';
import { GridOptions, ColDef, RowNode, IRowNode, GridApi } from 'ag-grid-community';
import { AgGridDialogComponent } from './ag-grid-dialog/ag-grid-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar'; 
@Component({
    selector: 'app-partners',
    standalone: true, 
    imports: [AgGridModule,CommonModule,MatButtonModule],
    templateUrl: './partners.component.html',
    styleUrl: './partners.component.css'
})
export class PartnersComponent  implements AfterViewInit {
  isBrowser = false;
  selectedRows: any[] = []; // store all selected rows
  columnDefs: ColDef[] = [
    { field: 'id', sortable: true, filter: true },
    { field: 'name', sortable: true, filter: true },
    { field: 'department', sortable: true, filter: true },
  ];

  public columnSelectedDefs: ColDef[] = [
    { field: 'id', sortable: true, filter: true },
    { field: 'make', sortable: true, filter: true },
    { field: 'model', sortable: true, filter: true },
    { field: 'price', sortable: true, filter: true }
  ];

  rowData = [
    { id: 1, name: 'John Doe', department: 'ODD' },
    { id: 2, name: 'Jane Smith', department: 'ADC' },
    { id: 3, name: 'Bob Lee', department: 'ODC' },
    { id: 4, name: 'Alice White', department: 'UDC' },
  ];

  selectedRow: IRowNode | null = null;
  gridApi!: GridApi;

  gridOptions: GridOptions = {
    rowSelection: 'single',
    animateRows: true,
    domLayout: 'autoHeight', // grid height adjusts automatically
    defaultColDef: {
      sortable: true,
       headerClass: 'my-custom-header',
      filter: true,
      resizable: true, // allow resizing
      flex: 1, // auto width columns
      minWidth: 100,
      cellClass: 'ag-cell'
    },
    onGridReady: (params) => {
      this.gridApi = params.api;
      this.gridApi.forEachNode((node: IRowNode) => {
        if (!this.selectedRow && node.data.department === 'UDC') {
          node.setSelected(true);
          this.selectedRow = node;
        }
      });
      this.gridApi.redrawRows();
    },
    onRowClicked: (event) => {
      this.selectedRow = event.node;
      event.api.redrawRows();
    },
    rowClassRules: {
      'highlight-udc': (params) =>
        params.data.department === 'UDC' && params.node !== this.selectedRow,
      'highlight-pink': (params) => params.node === this.selectedRow,
    },
  };
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object,private dialog: MatDialog,private snackBar: MatSnackBar) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  
  openDialog() {
    const dialogRef = this.dialog.open(AgGridDialogComponent, {
      width: '80%',
      height: '50%',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed',result);
      const exists = this.selectedRows.some(r => r.id === result.id);

      if (!exists) {
        this.selectedRows.push(result); // push selected row into array
        this.selectedRows = [...this.selectedRows]; 
      }
      else{
        this.snackBar.open(`Row with Id ${result.id} already exists!`, 'Close', {
          duration: 3000,       // auto close in 3 sec
          panelClass: ['warn-snackbar'] // optional custom style
        });
      }
    });
  }
  onRowClicked(event: any) {
    console.log('Row clicked:', event.data);
   // this.dialogRef.close(event.data); // pass row data back to parent
  }

  ngAfterViewInit() {
    // No additional logic needed; handled in onGridReady
  }
}