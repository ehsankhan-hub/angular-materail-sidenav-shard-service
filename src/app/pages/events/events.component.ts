import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
// Import FlexLayoutModule for fxLayout and fxFlex directives
import { FlexLayoutModule } from '@angular/flex-layout'; 
import { CommonModule } from '@angular/common';
// Define a simple structure for the card data
interface AppCard {
    id: number;
    title: string;
    icon: string;
    color: string;
    isActive: boolean;
  }
@Component({
    selector: 'app-events',
    standalone: true, 
    imports: [MatIconModule,CommonModule, MatCardModule, MatButtonModule, FlexLayoutModule],
   
     templateUrl: './events.component.html',
     styleUrl: './events.component.css'

})
export class EventsComponent {
  
  // --- Data ---
  appCards: AppCard[] = [
    { id: 1, title: 'Cost Review Workflow', icon: 'account_tree', color: '#16a34a', isActive: false },
    { id: 2, title: 'Drilling Schedule', icon: 'calendar_month', color: '#16a34a', isActive: false },
    { id: 3, title: 'Platform Editor', icon: 'layers', color: '#16a34a', isActive: false },
    { id: 4, title: 'Scheduling Change Request', icon: 'apps_outage', color: '#16a34a', isActive: true }, // Active card
    { id: 5, title: 'Target Days System', icon: 'track_changes', color: '#16a34a', isActive: false },
    { id: 6, title: 'Rig Management', icon: 'construction', color: '#16a34a', isActive: false },
    { id: 7, title: 'Reporting Metrics', icon: 'insights', color: '#16a34a', isActive: false },
    { id: 8, title: 'Well Planner', icon: 'public', color: '#16a34a', isActive: false },
    { id: 9, title: 'Safety Dashboard', icon: 'health_and_safety', color: '#16a34a', isActive: false },
  ];

  startIndex: number = 0;
  // This value is purely for display logic and doesn't rely on window resizing events
  cardsPerPage: number = 5; 

  // FIX: Expose the Math object to the template
  public get Math() {
    return Math;
  }

  // --- Logic ---
  
  get visibleCards(): AppCard[] {
    return this.appCards.slice(this.startIndex, this.startIndex + this.cardsPerPage);
  }

  navigate(direction: 1 | -1): void {
    const newIndex = this.startIndex + direction;
    
    // Boundary check for start
    if (newIndex < 0) {
      this.startIndex = 0;
      return;
    }
    
    // Boundary check for end (ensure the last card is visible)
    if (newIndex > this.appCards.length - this.cardsPerPage) {
      this.startIndex = this.appCards.length - this.cardsPerPage;
      return;
    }
    
    this.startIndex = newIndex;
  }

  /**
   * Helps Angular track items in the *ngFor loop for performance.
   * This is generally good practice and can sometimes fix unexpected rendering issues.
   */
  trackByCardId(index: number, card: AppCard): number {
    return card.id;
  }

  /**
   * Sets the clicked card as active and deactivates all others.
   * @param cardId The ID of the card to set as active.
   */
  selectCard(cardId: number): void {
    this.appCards = this.appCards.map(card => ({
      ...card,
      isActive: card.id === cardId,
    }));
  }
}