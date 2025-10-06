// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { FlexLayoutModule } from '@angular/flex-layout';
// import { AgGridModule } from 'ag-grid-angular';
// import { HttpClientModule, HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
// import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';

// @Component({
//   selector: 'app-file-upload',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatButtonModule,
//     MatCardModule,
//     MatProgressBarModule,
//     MatSnackBarModule,
//     FlexLayoutModule,
//     AgGridModule,
//     HttpClientModule
//   ],
//   template: `
//     <mat-card fxLayout="column" fxLayoutGap="16px" class="upload-container">
//       <!-- Top actions -->
//       <div fxLayout="row" fxLayoutAlign="start center" fxLayoutGap="12px" class="top-actions">
//         <button
//           mat-raised-button
//           color="primary"
//           (click)="uploadSelected()"
//           [disabled]="selectedCount === 0 || uploading"
//         >
//           Submit ({{selectedCount}})
//         </button>

//         <button
//           mat-stroked-button
//           color="warn"
//           (click)="clearSelected()"
//           [disabled]="selectedCount === 0 || uploading"
//         >
//           Clear Selected
//         </button>
//       </div>

//       <!-- Upload progress -->
// <!-- Upload progress -->
// <div *ngIf="uploading" class="progress-section" fxLayout="column" fxLayoutAlign="center stretch">
//   <div class="custom-progress-bar">
//     <div
//       class="progress-fill"
//       [style.width.%]="uploadProgress"
//     ></div>
//   </div>
//   <div class="progress-text">{{uploadProgress}}% Uploading...</div>
// </div>


//       <!-- Upload Box -->
//       <div
//         class="upload-box"
//         fxLayout="column"
//         fxLayoutAlign="center center"
//         (drop)="onFileDropped($event)"
//         (dragover)="onDragOver($event)"
//         (dragleave)="onDragLeave($event)"
//         [class.dragover]="isDragOver"
//       >
//         <p>Drag & Drop files here</p>
//         <span>or</span>
//         <button mat-raised-button color="accent" (click)="fileInput.click()">
//           + Attach Document
//         </button>
//         <input
//           #fileInput
//           type="file"
//           multiple
//           hidden
//           (change)="onFileSelected($event)"
//         />
//       </div>

//       <!-- AG Grid Table -->
//       <div class="table-wrapper">
//         <ag-grid-angular
//           class="ag-theme-alpine"
//           style="width: 100%; height: 360px;"
//           [rowData]="rowData"
//           [columnDefs]="columnDefs"
//           [defaultColDef]="defaultColDef"
//           rowSelection="multiple"
//           (gridReady)="onGridReady($event)"
//           (selectionChanged)="onSelectionChanged()"
//         >
//         </ag-grid-angular>
//       </div>
//     </mat-card>
//   `,
//   styles: [`

// .custom-progress-bar {
//   width: 100%;
//   height: 20px;
//   background: #eee;
//   border-radius: 10px;
//   overflow: hidden;
//   position: relative;
//   box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
// }

// .progress-fill {
//   height: 100%;
//   background: repeating-linear-gradient(
//     -45deg,
//     #ff1744,
//     #ff1744 10px,
//     #ff4569 10px,
//     #ff4569 20px
//   );
//   border-radius: 10px 0 0 10px;
//   animation: move-stripes 1s linear infinite;
//   transition: width 0.5s ease-out;
// }

// @keyframes move-stripes {
//   0% { background-position: 0 0; }
//   100% { background-position: 40px 0; }
// }

// .progress-text {
//   text-align: center;
//   font-size: 14px;
//   margin-top: 6px;
//   color: #e53935;
//   font-weight: 600;
// }

//     .upload-container {
//       padding: 16px;
//       background: #fafafa;
//       border-radius: 8px;
//       box-shadow: 0 2px 6px rgba(0,0,0,0.06);
//     }

    

//     .top-actions { gap: 8px; align-items: center; }

//     .upload-box {
//       border: 2px dashed #ccc;
//       border-radius: 8px;
//       text-align: center;
//       padding: 28px;
//       transition: border-color 0.2s ease, background 0.2s ease;
//       user-select: none;
//       background: #fff;
//     }

//     .upload-box.dragover {
//       border-color: #3f51b5;
//       background: #f3f4ff;
//     }

//     .progress-section {
//       padding: 4px 0 0;
//     }

//     .progress-text {
//       text-align: center;
//       font-size: 14px;
//       margin-top: 4px;
//       color: #3f51b5;
//       font-weight: 500;
//     }

//     .delete-btn {
//       background: #f44336;
//       color: #fff;
//       border: none;
//       border-radius: 6px;
//       padding: 4px 8px;
//       cursor: pointer;
//     }
//   `]
// })
// export class FileUploadComponent {
//   isDragOver = false;
//   uploading = false;
//   uploadProgress = 0;
//   selectedCount = 0;

//   private gridApi!: GridApi;
//   private uploadUrl = '/api/files/upload'; // ⚙️ update with your backend URL

//   rowData: any[] = [];

//   columnDefs: ColDef[] = [
//     {
//       headerName: '',
//       checkboxSelection: true,
//       headerCheckboxSelection: true,
//       width: 50,
//       pinned: 'left' as const,
//     },
//     { headerName: 'File Name', field: 'fileName', flex: 2 },
//     { headerName: 'Document Type', field: 'documentType', flex: 1 },
//     { headerName: 'Created By', field: 'createdBy', flex: 1 },
//     { headerName: 'Updated By', field: 'updatedBy', flex: 1 },
//     {
//       headerName: 'Action',
//       field: 'action',
//       width: 110,
//       cellRenderer: (params: any) => {
//         const btn = document.createElement('button');
//         btn.innerText = 'Delete';
//         btn.className = 'delete-btn';
//         btn.addEventListener('click', (e) => {
//           e.stopPropagation();
//           params.api.applyTransaction({ remove: [params.data] });
//         });
//         return btn;
//       },
//     },
//   ];

//   defaultColDef: ColDef = {
//     resizable: true,
//     sortable: true,
//     filter: true,
//     minWidth: 120,
//   };

//   constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

//   onGridReady(event: GridReadyEvent) {
//     this.gridApi = event.api;
//   }

//   onSelectionChanged() {
//     const selected = this.gridApi.getSelectedRows();
//     this.selectedCount = selected.length;
//   }

//   // Drag and drop handlers
//   onFileDropped(event: DragEvent) {
//     event.preventDefault();
//     this.isDragOver = false;
//     if (event.dataTransfer?.files?.length) {
//       this.addFiles(event.dataTransfer.files);
//     }
//   }

//   onDragOver(event: DragEvent) {
//     event.preventDefault();
//     this.isDragOver = true;
//   }

//   onDragLeave(event: DragEvent) {
//     event.preventDefault();
//     this.isDragOver = false;
//   }

//   onFileSelected(event: any) {
//     const files: FileList = event.target.files;
//     if (files?.length) {
//       this.addFiles(files);
//       event.target.value = '';
//     }
//   }

//   private addFiles(files: FileList) {
//     const rows = Array.from(files).map(file => ({
//       id: `${Date.now()}_${Math.random()}`,
//       file,
//       fileName: file.name,
//       documentType: file.type || 'Unknown',
//       createdBy: 'Admin',
//       updatedBy: 'Admin'
//     }));

//     if (this.gridApi) {
//       this.gridApi.applyTransaction({ add: rows });
//     } else {
//       this.rowData = [...this.rowData, ...rows];
//     }
//   }

//   clearSelected() {
//     const selected = this.gridApi.getSelectedRows();
//     if (selected?.length) {
//       this.gridApi.applyTransaction({ remove: selected });
//       this.selectedCount = 0;
//     }
//   }

//   uploadSelected() {
//     const selected: any[] = this.gridApi.getSelectedRows();
//     if (!selected || selected.length === 0) return;

//     const form = new FormData();
//     selected.forEach((r) => {
//       form.append('files', r.file, r.fileName);
//     });

//     this.uploading = true;
//     this.uploadProgress = 0;

//     this.http.post(this.uploadUrl, form, {
//       reportProgress: true,
//       observe: 'events'
//     }).subscribe({
//       next: (event: HttpEvent<any>) => {
//         debugger
      
//         if (event.type === HttpEventType.UploadProgress && event.total) {
//           const realProgress = Math.round((100 * event.loaded) / event.total);
//           // Smooth simulated slower animation for demo
//           if (realProgress > this.uploadProgress) {
//             const diff = realProgress - this.uploadProgress;
//             let i = 0;
//             const interval = setInterval(() => {
//               this.uploadProgress += 1;
//               i++;
//               if (i >= diff) clearInterval(interval);
//             }, 6000000); // increase time (ms) to make slower
//           }
//         } 
//         else if (event.type === HttpEventType.Response) {
//           // ✅ Upload completed
//           this.uploading = false;
//           this.uploadProgress = 100;
//           this.snackBar.open('✅ Files uploaded to file server successfully!', 'Close', {
//             duration: 4000,
//             panelClass: ['success-snackbar']
//           });

//           // Clear all rows from grid
//           this.gridApi.setRowData([]);
//           this.rowData = [];
//           this.selectedCount = 0;
//         }
//       },
//       error: () => {
//         this.uploading = false;
//         this.uploadProgress = 0;
//         this.snackBar.open('❌ Upload failed. Please try again.', 'Close', {
//           duration: 4000,
//           panelClass: ['error-snackbar']
//         });
//       }
//     });
//   }
// }
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    FlexLayoutModule,
    AgGridAngular
  ],
  template: `
    <mat-card fxLayout="column" fxLayoutGap="10px" class="upload-container">

      <div
        class="upload-box"
        fxLayout="column"
        fxLayoutAlign="center center"
        (drop)="onFileDropped($event)"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        [class.dragover]="isDragOver"
      >
        <p>Drag & Drop files here</p>
        <span>or</span>
        <button mat-raised-button color="primary" (click)="fileInput.click()">+ Attach Document</button>
        <input #fileInput type="file" multiple hidden (change)="onFileSelected($event)" />
      </div>

      <div fxLayout="row" fxLayoutAlign="end center">
        <button mat-raised-button color="accent" [disabled]="!selectedCount" (click)="uploadSelected()">
          Submit ({{selectedCount}} Selected)
        </button>
      </div>

      <div class="ag-theme-alpine table-wrapper">
        <ag-grid-angular
          style="width: 100%; height: 350px;"
          [rowData]="rowData"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          rowSelection="multiple"
          (gridReady)="onGridReady($event)"
          (selectionChanged)="onSelectionChanged()"
        ></ag-grid-angular>
      </div>
    </mat-card>
  `,
  styles: [`
    .upload-container {
      padding: 20px;
      background: #fafafa;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .upload-box {
      border: 2px dashed #ccc;
      border-radius: 10px;
      text-align: center;
      padding: 30px;
      transition: border-color 0.3s ease;
    }
    .upload-box.dragover {
      border-color: #3f51b5;
      background-color: #f3f4ff;
    }
    .delete-btn {
      background: #f44336;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
    }
    .progress-container {
      width: 100%;
      height: 16px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
    }
    .progress-bar {
      height: 100%;
      width: 0%;
      background: repeating-linear-gradient(
        -45deg,
        #ff1744,
        #ff1744 10px,
        #ff4569 10px,
        #ff4569 20px
      );
      border-radius: 10px 0 0 10px;
      animation: move-stripes 1s linear infinite;
      transition: width 0.3s ease-out;
    }
    @keyframes move-stripes {
      0% { background-position: 0 0; }
      100% { background-position: 40px 0; }
    }
  `]
})
export class FileUploadComponent {
  isDragOver = false;
  rowData: any[] = [];
  selectedCount = 0;
  private gridApi!: GridApi;

  constructor(private snackBar: MatSnackBar) {}

  columnDefs: ColDef[] = [
    { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 50, pinned: 'left' },
    { headerName: 'File Name', field: 'fileName', flex: 2 },
    { headerName: 'Document Type', field: 'documentType', flex: 1 },
    {
      headerName: 'Progress',
      field: 'progress',
      flex: 1,
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.className = 'progress-container';

        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.style.width = `${params.value || 0}%`;

        container.appendChild(bar);
        params.data._progressBarRef = bar; // Keep reference for live update
        return container;
      }
    },
    {
      headerName: 'Action',
      width: 110,
      cellRenderer: (params: any) => {
        const btn = document.createElement('button');
        btn.innerText = 'Delete';
        btn.className = 'delete-btn';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          params.api.applyTransaction({ remove: [params.data] });
        });
        return btn;
      },
    },
  ];

  defaultColDef: ColDef = { resizable: true, sortable: true, filter: true, minWidth: 120 };

  onGridReady(event: any) {
    this.gridApi = event.api;
    event.api.sizeColumnsToFit();
  }

  onSelectionChanged() {
    this.selectedCount = this.gridApi.getSelectedRows().length;
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) this.handleFiles(event.dataTransfer.files);
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
    event.target.value = '';
  }

  handleFiles(files: FileList) {
    const newFiles = Array.from(files).map(file => ({
      file,
      fileName: file.name,
      documentType: file.type || 'Unknown',
      progress: 0
    }));
    this.rowData = [...this.rowData, ...newFiles];
  }

  uploadSelected() {
    const selectedRows = this.gridApi.getSelectedRows();
    if (!selectedRows.length) return;
    selectedRows.forEach(row => this.simulateUpload(row));
  }

  /** Real-time simulated upload with live bar update */
  simulateUpload(row: any) {
    row.progress = 0;
    const barEl = row._progressBarRef;
    let progress = 0;

    const interval = setInterval(() => {
      progress += 5; // Increase per tick
      row.progress = progress;
      if (barEl) barEl.style.width = `${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);
        this.snackBar.open(`✅ ${row.fileName} uploaded successfully`, 'Close', { duration: 2000 });
        setTimeout(() => {
          this.rowData = this.rowData.filter(r => r !== row);
          this.gridApi.setRowData(this.rowData);
          this.selectedCount = 0;
        }, 1000);
      }
    }, 300); // 300ms * 20 = 6 seconds upload
  }
}
