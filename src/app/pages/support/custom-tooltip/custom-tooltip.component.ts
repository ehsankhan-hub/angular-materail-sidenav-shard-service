import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-custom-tooltip',
  standalone: true,
  imports: [MatMenuModule, NgFor],
  templateUrl: './custom-tooltip.component.html',
  styleUrls: ['./custom-tooltip.component.css'] 
})
export class CustomTooltipComponent implements OnInit {
  @Input({ required: true }) logData: any; 

  // 1. PUBLIC: Expose MatMenu instance for [matMenuTriggerFor] binding in Parent
  @ViewChild(MatMenu) public menuReference!: MatMenu; 
  
  // 2. PRIVATE: Internal trigger instance to execute open/close actions
  @ViewChild(MatMenuTrigger) private menuTrigger!: MatMenuTrigger; 
  
  // Data and Timer
  jsonData: { key: string; val: string }[] = [];
  private menuTimer: any;

  ngOnInit() {
    this.mapDataForTable();
  }

  // Maps the flat JSON object into the Key/Value array for the table
  private mapDataForTable(): void {
    if (this.logData) {
      this.jsonData = [
        { key: 'Mnemonic', val: this.logData.mnemonic },
        { key: 'Display Name', val: this.logData.displayName },
        { key: 'Unit', val: this.logData.unit },
        { key: 'Well ID', val: this.logData.wellId },
        { key: 'Range', val: `${this.logData.min} - ${this.logData.max}` }
      ];
    }
  }

  // === Public Methods Called by the Template (For Debounce/Smooth Hover) ===
  
  /** Cancels the close timer and opens the menu immediately. */
  public openTooltip(): void {
    if (this.menuTimer) {
      clearTimeout(this.menuTimer); // Stop the close timer if it was running
    }
    // Check if the trigger is ready before opening
    if (this.menuTrigger) {
      this.menuTrigger.openMenu();
    }
  }

  /** Starts a timer to close the menu after a brief delay (100ms debounce). */
  public closeTooltip(): void {
    if (this.menuTrigger) {
      this.menuTimer = setTimeout(() => {
        this.menuTrigger.closeMenu();
      }, 100);
    }
  }
}