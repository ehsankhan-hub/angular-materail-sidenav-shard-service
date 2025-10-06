import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AgGridAngular } from 'ag-grid-angular';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    FlexLayoutModule,
    AgGridAngular
  ],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css'
})
export class FileUploadComponent {
  isDragOver = false;

  rowData: any[] = [];
  columnDefs = [
    { headerName: 'File Name', field: 'fileName', flex: 2 },
    { headerName: 'Document Type', field: 'documentType', flex: 1 },
    { headerName: 'Created By', field: 'createdBy', flex: 1 },
    { headerName: 'Updated By', field: 'updatedBy', flex: 1 },
    {
      headerName: 'Action',
      cellRenderer: (params: any) => {
        return `<button class="delete-btn">Delete</button>`;
      },
      flex: 1,
    },
  ];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 120,
  };

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.handleFiles(files);
  }

  handleFiles(files: FileList) {
    Array.from(files).forEach(file => {
      this.rowData.push({
        fileName: file.name,
        documentType: file.type || 'Unknown',
        createdBy: 'Admin',
        updatedBy: 'Admin'
      });
    });
    this.rowData = [...this.rowData]; // Refresh AG Grid
  }
}