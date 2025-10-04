import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; // Import ElementRef
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GridApi, GridReadyEvent, ColDef } from 'ag-grid-community';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // For notifications

// Layout/Grid Imports
import { FlexLayoutModule } from '@angular/flex-layout';
import { AgGridAngular } from 'ag-grid-angular';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';


interface Attachment {
  fileName: string;
  documentType: string;
  createdBy: string;
  updatedBy: string;
  id: string; // Unique ID
}

// NEW: Interface for tracking individual file upload progress
interface ProgressItem {
  id: number;
  fileName: string;
  progress: number; // 0 to 100
  style: 'green' | 'blue' | 'yellow'; // To match the image's distinct styles
  status: 'uploading' | 'complete' | 'error';
}

@Component({
  selector: 'app-file-prog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    
    // Material Modules
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule, // Include SnackBar
    MatProgressBarModule, // THIS IS THE FIX
    MatDividerModule, // FIX: Added MatDividerModule
    // AG Grid
    AgGridAngular,
  ],
  templateUrl: './file-prog.component.html',
  styleUrl: './file-prog.component.css'
})
export class FileProgComponent implements OnInit {
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  private gridApi!: GridApi;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  // State for the component
  searchCtrl = new FormControl<string | null>(null);
  rowData: Attachment[] = []; 
  isDragging: boolean = false;
  
  // Progress tracking state
  uploadingFiles: ProgressItem[] = [];
  nextProgressId = 0;
  
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
      headerClass: 'ag-header-left-align' // Ensures left alignment
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

  // --- File Input & Drag/Drop Handlers ---
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
    
    // Start upload process for all selected files
    this.startUploadProcess(Array.from(files));
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

  // Main upload process orchestration
  startUploadProcess(files: File[]): void {
    const newUploads: ProgressItem[] = [];
    // Cycle through distinct styles
    const styles: ProgressItem['style'][] = ['green', 'blue', 'yellow'];
    let styleIndex = 0;
    let errorCount = 0;

    files.forEach(file => {
      const error = this.validateFile(file);
      
      if (error) {
        this.snackBar.open(error, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        errorCount++;
      } else {
        const item: ProgressItem = {
          id: this.nextProgressId++,
          fileName: file.name,
          progress: 0,
          style: styles[styleIndex++ % styles.length],
          status: 'uploading'
        };
        newUploads.push(item);
      }
    });

    if (newUploads.length === 0) return;

    // Add valid uploads to the tracking list
    this.uploadingFiles = [...this.uploadingFiles, ...newUploads];
    
    // Start simulation for each new file
    newUploads.forEach(item => {
      this.simulateProgress(item);
    });
  }

  // Simulation function for individual file progress
  simulateProgress(item: ProgressItem): void {
    const interval = setInterval(() => {
      // Find the item in the live array
      const currentItemIndex = this.uploadingFiles.findIndex(i => i.id === item.id);
      if (currentItemIndex === -1) {
        clearInterval(interval);
        return;
      }
      const currentItem = this.uploadingFiles[currentItemIndex];

      if (currentItem.progress < 100) {
        // Increase progress randomly
        currentItem.progress += Math.floor(Math.random() * 15) + 5;
        if (currentItem.progress > 100) currentItem.progress = 100;
        
        // Update the array immutably to trigger change detection
        this.uploadingFiles = [...this.uploadingFiles]; 

      } else {
        clearInterval(interval);
        currentItem.status = 'complete';
        this.addFileToGrid(currentItem.fileName);
        
        // Remove item after a short delay (visual completion buffer)
        setTimeout(() => {
          this.uploadingFiles = this.uploadingFiles.filter(i => i.id !== item.id);
          this.snackBar.open(`"${item.fileName}" attached successfully!`, 'Dismiss', { duration: 3000 });
        }, 800);
      }
    }, 200); // Update every 200ms
  }

  // Adds file name to the AG Grid row data
  addFileToGrid(fileName: string): void {
    const newAttachment: Attachment = {
      id: Date.now().toString() + Math.random(), 
      fileName: fileName,
      documentType: fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN', 
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
      // Use onFileSelected to delegate files for validation/upload
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
