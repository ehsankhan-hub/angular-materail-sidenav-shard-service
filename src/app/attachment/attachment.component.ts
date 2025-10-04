import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GridApi, GridReadyEvent, ColDef } from 'ag-grid-community';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar'; // NEW: Progress Bar
import { FlexLayoutModule } from '@angular/flex-layout';
import { AgGridAngular } from 'ag-grid-angular';
import { BehaviorSubject, delay, Observable, of, tap } from 'rxjs';
import { MatDivider } from "@angular/material/divider"; // For simulation

interface Attachment {
  fileName: string;
  documentType: string;
  createdBy: string;
  updatedBy: string;
  id: string; 
}

@Component({
  selector: 'app-attachments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule, // Ensure this is imported
    AgGridAngular,
    MatDivider
],
  templateUrl: './attachment.component.html',
  styleUrls: ['./attachment.component.css']
})
export class AttachmentComponent implements OnInit {
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  private gridApi!: GridApi;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  searchCtrl = new FormControl<string | null>(null);
  rowData: Attachment[] = []; 
  isDragging: boolean = false;
  
  // NEW: Progress tracking
  isUploading$: Observable<boolean> = of(false); // Observable to control progress visibility
  
  readonly MAX_FILE_SIZE_MB = 5;
  readonly ALLOWED_TYPES = [
    'application/pdf', 'image/jpeg', 'image/png', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  columnDefs: ColDef[] = [
    { 
      headerName: 'File Name', 
      field: 'fileName', 
      sortable: true, 
      filter: true, 
      flex: 2, 
      minWidth: 150,
      headerClass: 'ag-header-left-align' // Apply left align class
    },
    { 
      headerName: 'Document Type', 
      field: 'documentType', 
      sortable: true, 
      filter: true, 
      flex: 1, 
      minWidth: 120,
      headerClass: 'ag-header-left-align'
    },
    { 
      headerName: 'Created By', 
      field: 'createdBy', 
      sortable: true, 
      filter: true, 
      flex: 1, 
      minWidth: 120,
      headerClass: 'ag-header-left-align'
    },
    { 
      headerName: 'Updated By', 
      field: 'updatedBy', 
      sortable: true, 
      filter: true, 
      flex: 1, 
      minWidth: 120,
      headerClass: 'ag-header-left-align'
    },
    {
      headerName: 'Action', 
      field: 'action', 
      width: 100, 
      resizable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ag-grid-action-wrapper';
        
        // Download Button
        const downloadButton = document.createElement('button');
        downloadButton.className = 'mat-icon-button download-btn';
        downloadButton.setAttribute('title', 'Download');
        downloadButton.innerHTML = `<span class="material-icons" style="font-size: 18px; color: #1e88e5;">download</span>`;
        downloadButton.addEventListener('click', (event) => {
            event.stopPropagation();
            alert(`Downloading ${params.data.fileName}`);
        });

        // Delete Button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'mat-icon-button delete-btn';
        deleteButton.setAttribute('title', 'Delete');
        deleteButton.innerHTML = `<span class="material-icons" style="font-size: 18px; color: red;">delete</span>`;
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const componentContext = params.context.componentParent; 
            componentContext.deleteAttachment(params.data);
        });
        
        wrapper.appendChild(downloadButton);
        wrapper.appendChild(deleteButton);
        return wrapper;
      }
    }
  ];

  defaultColDef: ColDef = {
    resizable: true,
    filter: true,
    sortable: true,
  };

  constructor(private snackBar: MatSnackBar) {} 

  ngOnInit(): void {}

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.setGridOption('context', { componentParent: this }); 
  }

  // --- File Input Handlers ---
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
  
  onFileSelected(event: Event | FileList): void {
    let files: FileList | null;

    if (event instanceof FileList) {
      files = event;
    } else {
      const input = event.target as HTMLInputElement;
      files = input.files;
      if (input.value) {
        input.value = ''; 
      }
    }

    if (!files || files.length === 0) {
      return;
    }

    // Start upload simulation
    this.simulateUpload(Array.from(files));
  }
  
  validateFile(file: File): string | null {
    const maxSizeBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds the maximum limit of ${this.MAX_FILE_SIZE_MB}MB.`;
    }
    
    const fileType = file.type;
    if (fileType && !this.ALLOWED_TYPES.includes(fileType)) {
      return `Unsupported file type: ${file.name}.`;
    }
    
    if (this.rowData.some(a => a.fileName === file.name)) {
        return `A file named "${file.name}" is already attached.`;
    }

    return null; 
  }

  // NEW: Upload Simulation with Progress
  simulateUpload(files: File[]): void {
    let validFiles: File[] = [];
    let errorCount = 0;

    // 1. Validate files immediately
    files.forEach(file => {
      const error = this.validateFile(file);
      if (error) {
        this.snackBar.open(error, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        errorCount++;
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) return;

    // 2. Start simulated upload only for valid files
    this.isUploading$ = of(true).pipe(
        delay(1500 + validFiles.length * 200), // Simulate upload time (1.5s base + 0.2s per file)
        tap(() => {
            validFiles.forEach(file => this.addFileToGrid(file));
        }),
        delay(100), // Wait for grid update
        tap(() => {
            this.isUploading$ = of(false); // Hide progress bar
            if (errorCount > 0) {
                this.snackBar.open(`${validFiles.length} file(s) attached successfully. ${errorCount} file(s) failed validation.`, 'Dismiss', { duration: 5000 });
            } else {
                this.snackBar.open(`${validFiles.length} file(s) attached successfully!`, 'Dismiss', { duration: 3000 });
            }
        })
    );
  }

  addFileToGrid(file: File): void {
    const newAttachment: Attachment = {
      id: Date.now().toString() + Math.random(), 
      fileName: file.name,
      documentType: file.type.split('/').pop()?.toUpperCase() || 'UNKNOWN',
      createdBy: 'Current User', 
      updatedBy: 'N/A',
    };

    this.rowData = [...this.rowData, newAttachment];
    if (this.gridApi) {
      this.gridApi.setRowData(this.rowData);
      this.gridApi.sizeColumnsToFit();
    }
  }

  // --- Drag and Drop Handlers ---
  onDragOver(event: DragEvent): void {
    event.preventDefault(); 
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const dataTransfer = event.dataTransfer;
    if (dataTransfer?.files) {
      this.onFileSelected(dataTransfer.files); 
    }
  }
  
  // --- Grid and Action Methods ---
  deleteAttachment(attachment: Attachment): void {
    if (confirm(`Are you sure you want to delete ${attachment.fileName}?`)) {
        this.rowData = this.rowData.filter(a => a.id !== attachment.id);
        this.gridApi.setRowData(this.rowData);
        this.snackBar.open(`File "${attachment.fileName}" deleted.`, 'Dismiss', { duration: 3000 });
    }
  }

  applySearch(): void {
    if (this.gridApi) {
        const searchValue = this.searchCtrl.value ?? '';
        this.gridApi.setQuickFilter(searchValue);
    }
  }
  
  refreshData(): void {
    alert('Refresh data logic triggered.');
  }

  viewDetails(): void {
    alert('View/Edit details logic triggered.');
  }
}

