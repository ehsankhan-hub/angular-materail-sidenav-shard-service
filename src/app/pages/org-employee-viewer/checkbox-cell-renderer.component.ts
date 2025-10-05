import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatCheckboxModule } from '@angular/material/checkbox';
// Note: Employee interface is only needed if you specifically reference Employee properties, 
// but including it for context clarity.
import { Employee } from '../../services/data.service'; 

@Component({
  selector: 'app-checkbox-cell-renderer',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      <mat-checkbox 
        [checked]="checked"
        (change)="onCheckboxChange($event.checked)">
      </mat-checkbox>
    </div>
  `,
})
export class CheckboxCellRendererComponent implements ICellRendererAngularComp,OnInit {
  ngOnInit(): void {
    console.log('CheckboxCellRendererComponent ',this.params);
  }
  private params!: ICellRendererParams;
  public checked: boolean = false;


  agInit(params: ICellRendererParams): void {
    this.params = params;
    // FIX APPLIED HERE: Using optional chaining (?. ) for safe access
    this.checked = !!params.colDef?.cellRendererParams?.['initialChecked'];
  }

  onCheckboxChange(newCheckedState: boolean): void {
    // FIX APPLIED HERE: Safely access initialChecked property
    const isMovingToSelected = !this.params.colDef?.cellRendererParams?.['initialChecked'];

    // Safely check for the existence of context and parentComponent
    if (this.params.context?.['parentComponent']) {
      this.params.context['parentComponent'].moveEmployee(
        this.params.data as Employee, 
        isMovingToSelected
      );
    }
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    // FIX APPLIED HERE: Using optional chaining (?. ) for safe access
    this.checked = !!params.colDef?.cellRendererParams?.['initialChecked'];
    return true;
  }
}