import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';
import { GridOptions, ColDef, RowNode, IRowNode, GridApi } from 'ag-grid-community';
@Component({
    selector: 'app-partners',
    standalone: true, 
    imports: [AgGridModule,CommonModule],
    templateUrl: './partners.component.html',
    styleUrl: './partners.component.css'
})
export class PartnersComponent  implements AfterViewInit {
  isBrowser = false;

  columnDefs: ColDef[] = [
    { field: 'id', sortable: true, filter: true },
    { field: 'name', sortable: true, filter: true },
    { field: 'department', sortable: true, filter: true },
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
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit() {
    // No additional logic needed; handled in onGridReady
  }
}