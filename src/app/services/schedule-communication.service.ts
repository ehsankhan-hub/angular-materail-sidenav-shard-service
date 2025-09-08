// src/app/schedule-communication.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

// Define an interface for the filter configuration data for type safety
export interface FilterConfiguration {
  mode: any;
  detailFilterObject: any;
  showEngLovFilter: boolean;
  showFieldLovFilter: boolean;
  showOpLovFilter: boolean;
  showFluidLovFilter: boolean;
  showTypeLovFilter: boolean;
  showBpAreaLovFilter: boolean;
  yearStyle: any;
  schdNumber: number;
  virtualGroup: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleCommunicationService {

  // BehaviorSubject to manage the filter configuration state
  // It's initialized with a default state to ensure components always have a value
  private filterConfigSubject = new BehaviorSubject<FilterConfiguration>({
    mode: null,
    detailFilterObject: null,
    showEngLovFilter: true, // You can set a different default value
    showFieldLovFilter: true,
    showOpLovFilter: true,
    showFluidLovFilter: true,
    showTypeLovFilter: true,
    showBpAreaLovFilter: true,
    yearStyle: null,
    schdNumber: 0,
    virtualGroup: ''
  });
  public filterConfig$ = this.filterConfigSubject.asObservable();

  // Subject for child -> parent communication (the event)
  private filterClickedSubject = new Subject<any>();
  public filterClicked$ = this.filterClickedSubject.asObservable();

  constructor() { }

  // Method for the parent to call to update the configuration data
  updateFilterConfig(config: Partial<FilterConfiguration>) {
    // Merge the new config with the current value
    const updatedConfig = { ...this.filterConfigSubject.getValue(), ...config };
    this.filterConfigSubject.next(updatedConfig);
  }

  // Method for the child to call when its filter button is clicked
  notifyFilterClicked(eventData: any) {
    console.log('Service: Broadcasting filter click event:', eventData);
    this.filterClickedSubject.next(eventData);
  }
}