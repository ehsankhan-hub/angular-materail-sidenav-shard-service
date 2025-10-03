import { ChangeDetectionStrategy, Component, signal, Signal, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- 1. INTERFACES & TYPES ---

// Define the structure of the detailFilterObject inline
export interface DetailFilterObject {
  id: string;
  name: string;
}

/** Interface defining the complete structure of the application's filter state,
 * derived from the properties in your component image. */
export interface FilterState {
  mode: string;
  // Updated to use the inline interface or an anonymous type
  detailFilterObject: DetailFilterObject; 
  rqstNumber: number;
  schdNumber: number;
  virtualGroup: string;
  showEngLovFilter: boolean;
  showBiLovFilter: boolean;
  showFieldLovFilter: boolean;
  showOpLovFilter: boolean;
  showRigLovFilter: boolean;
  showFluidLovFilter: boolean;
  showShoreLovFilter: boolean;
  showTypeLovFilter: boolean;
  showBpAreaLovFilter: boolean;
  yearStyle: boolean;
  disableFilter: boolean;
}

// --- 2. THE SHARED SERVICE ---

/**
 * Service to manage and share the global filter state using Signals.
 * Any component can inject this service to read or update the state.
 */
@Injectable({
  providedIn: 'root'
})
// FIX: Removed 'export'. This prevents the Angular compiler from misinterpreting the service as a required component import.
export class FilterStateService {
  // Initial state derived from the property defaults/bindings in your images
  private initialFilterState: FilterState = {
    mode: 'requestMode',
    // Initialized detailFilterObject as a plain object literal
    detailFilterObject: { id: 'F001', name: 'Initial Filter Set' },
    rqstNumber: 481078,
    schdNumber: 455765,
    virtualGroup: 'PEASD_TEST',
    // The template bindings in image 1 overrode some of these to false.
    showEngLovFilter: false,
    showBiLovFilter: false,
    showFieldLovFilter: false,
    showOpLovFilter: false,
    showRigLovFilter: true, // Only this one remains true from the defaults
    showFluidLovFilter: false,
    showShoreLovFilter: false,
    showTypeLovFilter: false,
    showBpAreaLovFilter: false,
    yearStyle: false,
    disableFilter: false, // Initial state is FALSE (enabled)
  };

  // Signal holding the single source of truth for all filter configuration
  private state = signal<FilterState>(this.initialFilterState);

  // Public readonly access to the state signal
  public filterState: Signal<FilterState> = this.state.asReadonly();

  /** Updates the state by merging partial new data with the current state. */
  public updateFilterState(newState: Partial<FilterState>): void {
    this.state.update(current => ({ ...current, ...newState }));
  }

  /** Simulates the filter click output by setting a new rqstNumber and toggling disableFilter. */
  public simulateFilterClicked(newRqstNumber: number): void {
    // MODIFICATION: The toggling logic remains here to update the state property.
    const currentState = this.state(); 

    this.updateFilterState({
      rqstNumber: newRqstNumber,
      schdNumber: newRqstNumber - 200,
      disableFilter: !currentState.disableFilter, // Toggle the state
    });
  }
}