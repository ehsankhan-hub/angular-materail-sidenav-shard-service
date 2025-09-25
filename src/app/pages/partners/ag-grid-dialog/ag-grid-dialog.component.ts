import { Component } from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-ag-grid-dialog',
  standalone: true,
  imports: [AgGridModule,MatDialogModule,CommonModule],
  templateUrl: './ag-grid-dialog.component.html',
  styleUrl: './ag-grid-dialog.component.css'
})
export class AgGridDialogComponent {
  isBrowser = false;
  constructor(private dialogRef: MatDialogRef<AgGridDialogComponent>) {}
 // Column definitions for AG Grid
 public columnDefs: ColDef[] = [
  { field: 'id', sortable: true, filter: true },
  { field: 'make', sortable: true, filter: true },
  { field: 'model', sortable: true, filter: true },
  { field: 'price', sortable: true, filter: true }
];

// Row data for AG Grid
public rowData = [

  {id:1, make: 'Toyota', model: 'Celica', price: 35000 },
  { id:2, make: 'Ford', model: 'Mondeo', price: 32000 },
  { id:3, make: 'Porsche', model: 'Boxster', price: 72000 }
];

  // Event fired when row is clicked
  onRowClicked(event: any) {
    console.log('Row clicked:', event.data);
    this.dialogRef.close(event.data); // pass row data back to parent
  }
}
