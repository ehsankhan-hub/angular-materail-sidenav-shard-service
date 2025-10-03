import { Component, HostListener } from '@angular/core';
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
   { id: 4, title: 'Scheduling Change Request', icon: 'apps_outage', color: '#16a34a', isActive: true }, // Initial active card
   { id: 5, title: 'Target Days System', icon: 'track_changes', color: '#16a34a', isActive: false },
   { id: 6, title: 'Rig Management', icon: 'construction', color: '#16a34a', isActive: false },
   { id: 7, title: 'Reporting Metrics', icon: 'insights', color: '#16a34a', isActive: false },
   { id: 8, title: 'Well Planner', icon: 'public', color: '#16a34a', isActive: false },
   { id: 9, title: 'Safety Dashboard', icon: 'health_and_safety', color: '#16a34a', isActive: false },
 ];

 startIndex: number = 0;
 cardsPerPage: number = 5; 

 // FIX: Expose the Math object to the template
 public get Math() {
   return Math;
 }

 ngOnInit(): void {
   // Calculate initial cardsPerPage on load
   this.calculateCardsPerPage(window.innerWidth);
 }

 // Hook into the window resize event to update responsiveness
 @HostListener('window:resize', ['$event'])
 onResize(event: Event) {
   this.calculateCardsPerPage((event.target as Window).innerWidth);
 }

 /**
  * Calculates the number of cards that should be visible based on screen width.
  * This logic mirrors the FlexLayout breakpoints used in the template (fxFlex.lt-md, fxFlex.lt-sm).
  * IMPORTANT CHANGE: On medium screens (960px > width >= 600px), we now set cardsPerPage to 5 
  * to ensure all five default cards are shown in the two-row format (3 + 2).
  * @param width The current window width.
  */
 private calculateCardsPerPage(width: number): void {
   const previousCardsPerPage = this.cardsPerPage;

   if (width < 600) { // Equivalent to FlexLayout 'xs' or .lt-sm (2 cards per row max)
     this.cardsPerPage = 2;
   } else if (width < 960) { // Equivalent to FlexLayout 'sm' or .lt-md (3 cards per row max)
     // FIX: Set cardsPerPage to 5 here to force the display of all five cards in the two-row layout.
     this.cardsPerPage = 5; 
   } else { // Default (5 cards per row max)
     this.cardsPerPage = 5;
   }

   // Adjust startIndex only if the number of cards per page has changed
   if (previousCardsPerPage !== this.cardsPerPage) {
     // Ensure startIndex is valid after the change
     if (this.startIndex + this.cardsPerPage > this.appCards.length) {
       // Move back to show the last possible set of cards
       this.startIndex = Math.max(0, this.appCards.length - this.cardsPerPage);
     }
   }
 }

 // --- Logic ---
 
 /**
  * Returns the array of cards to display.
  * If cardsPerPage is less than total cards (e.g., on mobile), it returns a slice 
  * for navigation mode. Otherwise, it returns the whole array for full list mode.
  */
 get cardsToShow(): AppCard[] {
     if (this.cardsPerPage < this.appCards.length) {
         return this.appCards.slice(this.startIndex, this.startIndex + this.cardsPerPage);
     }
     return this.appCards;
 }

 navigate(direction: 1 | -1): void {
   let newIndex = this.startIndex + direction;
   
   // Boundary check for start
   if (newIndex < 0) {
     newIndex = 0;
   }
   
   // Boundary check for end (ensure the last card is visible)
   const maxStartIndex = this.appCards.length - this.cardsPerPage;
   if (newIndex > maxStartIndex) {
     newIndex = maxStartIndex;
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
