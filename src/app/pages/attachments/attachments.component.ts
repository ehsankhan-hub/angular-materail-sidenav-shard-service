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


interface Attachment {
  fileName: string;
  documentType: string;
  createdBy: string;
  updatedBy: string;
  id: string; // Unique ID
}

@Component({
  selector: 'app-attachments',
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

    // AG Grid
    AgGridAngular,
  ],
  templateUrl: './attachments.component.html',
  styleUrls: ['./attachments.component.css']
})
export class AttachmentsComponent implements OnInit {
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  private gridApi!: GridApi;

  // *** FILE INPUT REFERENCE ***
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  // ****************************

  searchCtrl = new FormControl<string | null>(null); // Corrected type: string | null
  
  // Data for the grid, representing attached files
  rowData: Attachment[] = []; 

  // *** VALIDATION CONSTANTS ***
  readonly MAX_FILE_SIZE_MB = 5;
  readonly ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  // ****************************

  columnDefs: ColDef[] = [
    // ... (existing column definitions, no change needed here) ...
    { headerName: 'File Name', field: 'fileName', sortable: true, filter: true, flex: 2, minWidth: 150 },
    { headerName: 'Document Type', field: 'documentType', sortable: true, filter: true, flex: 1, minWidth: 120 },
    { headerName: 'Created By', field: 'createdBy', sortable: true, filter: true, flex: 1, minWidth: 120 },
    { headerName: 'Updated By', field: 'updatedBy', sortable: true, filter: true, flex: 1, minWidth: 120 },
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
        downloadButton.innerHTML = `<span class="material-icons" style="font-size: 18px; color: var(--mat-primary-500);">download</span>`;
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
            // Need component context to call deleteAttachment
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

  // Inject MatSnackBar for user feedback
  constructor(private snackBar: MatSnackBar) {} 

  ngOnInit(): void {
    // Initial data load if needed
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    // Pass component context for cell renderer
    this.gridApi.setGridOption('context', { componentParent: this }); 
  }

  // *** 1. METHOD TO OPEN FILE DIALOG ***
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
  
  // *** 2. METHOD TO HANDLE FILE SELECTION AND VALIDATION ***
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const validationError = this.validateFile(file);

    if (validationError) {
      this.snackBar.open(validationError, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      // Reset the file input so the user can select the same file again if they fix it
      input.value = ''; 
      return;
    }

    // File is valid, add it to the rowData
    this.addFileToGrid(file);
    input.value = ''; // Reset input
  }
  
  // *** 3. FILE VALIDATION LOGIC ***
  validateFile(file: File): string | null {
    // Check Max Size
    const maxSizeBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds the maximum limit of ${this.MAX_FILE_SIZE_MB}MB.`;
    }
    
    // Check Type
    const fileType = file.type;
    if (fileType && !this.ALLOWED_TYPES.includes(fileType)) {
      return `Unsupported file type. Allowed types: ${this.ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}.`;
    }
    
    // Check for duplicate names (optional, but good practice)
    if (this.rowData.some(a => a.fileName === file.name)) {
        return `A file named "${file.name}" is already attached.`;
    }

    return null; // File is valid
  }

  // *** 4. ADD FILE TO GRID ***
  addFileToGrid(file: File): void {
    const newAttachment: Attachment = {
      id: Date.now().toString(), // Simple unique ID
      fileName: file.name,
      documentType: file.type.split('/').pop()?.toUpperCase() || 'UNKNOWN',
      createdBy: 'Current User', // Replace with dynamic user data
      updatedBy: 'N/A',
    };

    this.rowData = [...this.rowData, newAttachment];
    if (this.gridApi) {
      this.gridApi.setRowData(this.rowData);
      this.gridApi.sizeColumnsToFit();
      this.snackBar.open(`File "${file.name}" added successfully!`, 'Dismiss', { duration: 3000 });
    }
  }

  // Action Methods (updated deleteAttachment)
  deleteAttachment(attachment: Attachment): void {
    if (confirm(`Are you sure you want to delete ${attachment.fileName}?`)) {
        this.rowData = this.rowData.filter(a => a.id !== attachment.id);
        this.gridApi.setRowData(this.rowData);
        this.snackBar.open(`File "${attachment.fileName}" deleted.`, 'Dismiss', { duration: 3000 });
    }
  }

  applySearch(): void {
    if (this.gridApi) {
        // FIX for 'string | null' error: Use nullish coalescing (??)
        const searchValue = this.searchCtrl.value ?? '';
        this.gridApi.setQuickFilter(searchValue);
    }
  }
  
  refreshData(): void {
    alert('Refresh data logic triggered.');
    // In a real app, this would call your service to reload rowData
  }

  viewDetails(): void {
    alert('View/Edit details logic triggered.');
  }
}