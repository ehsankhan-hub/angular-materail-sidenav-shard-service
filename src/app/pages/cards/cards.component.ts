import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

interface DashboardItem {
  title: string;
  icon: string;
  route: string;
  active?: boolean;
}
@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [MatCardModule,CommonModule,MatIconModule,FlexLayoutModule],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.css'
})
export class CardsComponent { 
  dashboardItems: DashboardItem[] = [
    {
      title: 'Cost Review Workflow',
      icon: 'attach_money',
      route: '/cost-review'
    },
    {
      title: 'Drilling Schedule',
      icon: 'calendar_month',
      route: '/drilling-schedule'
    },
    {
      title: 'Platform Editor',
      icon: 'layers',
      route: '/platform-editor'
    },
    {
      title: 'Scheduling Change Request',
      icon: 'sync_alt',
      route: '/schedule-change',
      active: true // green background as in your image
    },
    {
      title: 'Target Days System',
      icon: 'track_changes',
      route: '/target-days'
    }
  ];

  constructor(private router: Router) {}

  // goTo(route: string): void {
  //   this.router.navigate([route]);
  // }
  goTo(item: DashboardItem): void {
    this.dashboardItems.forEach(i => i.active = false); // reset all cards
    item.active = true; // set clicked card active
    this.router.navigate([item.route]);
  }
}