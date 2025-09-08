import { Component, OnInit } from '@angular/core';
import { ScheduleCommunicationService } from '../services/schedule-communication.service'; 
import { ScheduleFiltersComponent } from '../schedule-filters/schedule-filters.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [ScheduleFiltersComponent,CommonModule],
  templateUrl: './parent.component.html',
  styleUrl: './parent.component.css'
})
export class ParentComponent implements OnInit {
  receivedEvent: any;

  constructor(private scheduleService: ScheduleCommunicationService) { }

  ngOnInit(): void {
    this.scheduleService.filterClicked$.subscribe(eventData => {
      this.receivedEvent = eventData;
      console.log('Parent: Received event from child:', eventData);
    });
  }

  // This method simulates a filter change from the parent
  // It now calls the service to update the shared state
  updateChildFilter(): void {
    const newConfig = {
      mode: 'advanced',
      showEngLovFilter: false,
      showFieldLovFilter: false,
      showOpLovFilter: false,
      showFluidLovFilter: false,
      showTypeLovFilter: false,
      showBpAreaLovFilter: false,
      schdNumber: 12345
    };
    this.scheduleService.updateFilterConfig(newConfig);
  }
}
