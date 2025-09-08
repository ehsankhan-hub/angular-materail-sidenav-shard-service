import { Component, OnInit } from '@angular/core';
import { ScheduleCommunicationService,FilterConfiguration } from '../services/schedule-communication.service'; 

@Component({
  selector: 'app-schedule-filters',
  standalone: true,
  imports: [],
  templateUrl: './schedule-filters.component.html',
  styleUrl: './schedule-filters.component.css'
})
export class ScheduleFiltersComponent implements OnInit {
  // Now holds all the configuration data from the service
  filterConfig: FilterConfiguration | undefined;

  constructor(private scheduleService: ScheduleCommunicationService) { }

  ngOnInit(): void {
    // Subscribe to the config observable to get the current and future states
    this.scheduleService.filterConfig$.subscribe(config => {
      this.filterConfig = config;
      console.log('Child: Received new filter configuration:', this.filterConfig);
    });
  }

  onChildButtonClick(): void {
    const eventData = { message: 'Filter button was clicked!', timestamp: new Date() };
    this.scheduleService.notifyFilterClicked(eventData);
  }
}