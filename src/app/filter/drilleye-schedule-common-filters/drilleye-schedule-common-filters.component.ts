// --- 3. CHILD COMPONENT (drilleye-schedule-common-filters) ---

import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { FilterState, FilterStateService } from "../../services/filter-state.service"; 
/**
 * Simulates the DrilleyeScheduleCommonFiltersComponent.
 * It now reads its configuration directly from the FilterStateService
 * instead of using @Input() decorators.
 */
@Component({
  selector: 'drilleye-schedule-common-filters',
  standalone: true,
  imports: [CommonModule],
  // Template updated to use standard CSS classes instead of Tailwind
  template: `
    <div class="filter-card">
      <h3 class="card-title">Filter Configuration (From Service)</h3>
      <div class="info-grid">
        
        <!-- Combined Request and Schedule numbers -->
        <div class="info-item full-width">
          <span class="label">Request / Schedule:</span>
          <span class="value value-mono">R: {{ filterState().rqstNumber }} / S: {{ filterState().schdNumber }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">Virtual Group:</span>
          <span class="value value-mono">{{ filterState().virtualGroup }}</span>
        </div>
      </div>

      <div class="filter-section">
        <h4 class="section-title">Boolean Filters:</h4>
        <div class="boolean-grid">
          @for (key of booleanKeys; track key) {
            <div class="boolean-item">
              <span class="truncate">{{ key }}:</span>
              <span 
                class="boolean-value"
                [ngClass]="filterState()[key] ? 'state-true' : 'state-false'"
              >
                {{ filterState()[key] ? 'TRUE' : 'FALSE' }}
              </span>
            </div>
          }
        </div>
      </div>

      <!-- Button is always enabled, only state property toggles -->
      <button
        (click)="onFilterClicked()"
        class="action-button"
      >
        Run Filter (Updates State)
      </button>

      <p class="status-message" [ngClass]="filterState().disableFilter ? 'status-red' : 'status-green'">
        Filter is {{ filterState().disableFilter ? 'disabled' : 'enabled' }} (via Service State)
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* Card Styling */
    .filter-card {
        padding: 16px;
        background-color: #ffffff;
        border: 1px solid #c7d2fe; /* light indigo 200 */
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .card-title {
        font-size: 1.125rem; /* text-lg */
        font-weight: 600; /* font-semibold */
        color: #4f46e5; /* indigo 700 */
        margin-bottom: 8px;
    }

    /* Info Grid (using Flexbox for simplicity) */
    .info-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 0.875rem; /* text-sm */
    }
    .info-item {
        flex: 1 1 45%; /* Flex Layout: Each item takes up about half the width */
        min-width: 150px;
    }
    .full-width {
        flex: 1 1 100%;
        margin-bottom: 8px;
    }
    .label {
        font-weight: 500; /* font-medium */
    }
    .value {
        margin-left: 8px;
        color: #374151; /* gray-700 */
    }
    .value-mono {
        font-family: monospace;
    }

    /* Boolean Filter Section */
    .filter-section {
        padding-top: 8px;
        border-top: 1px solid #eef1ff; /* indigo 100 */
    }
    .section-title {
        font-size: 1rem; /* text-md */
        font-weight: 500;
        margin-bottom: 8px;
        color: #4b5563; /* gray-600 */
    }
    .boolean-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 0.75rem; /* text-xs */
    }
    .boolean-item {
        flex: 1 1 calc(33.333% - 8px); /* 3 columns layout on desktop, using calc for gaps */
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #f9fafb; /* gray 50 */
        padding: 4px 8px;
        border-radius: 4px;
        min-width: 100px;
    }
    
    /* Responsive adjustment for boolean grid */
    @media (max-width: 600px) {
        .boolean-item {
            flex: 1 1 calc(50% - 8px); /* 2 columns on smaller screens */
        }
    }
    
    .truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 70%; 
    }
    .boolean-value {
        font-weight: 700;
    }
    .state-true { color: #16a34a; /* green-600 */ }
    .state-false { color: #dc2626; /* red-600 */ }

    /* Button Styling */
    .action-button {
        width: 100%;
        background-color: #6366f1; /* indigo-500 */
        color: white;
        font-weight: 700;
        padding: 8px 16px;
        border-radius: 8px;
        transition: background-color 0.15s ease-in-out;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .action-button:hover {
        background-color: #4f46e5; /* indigo-600 */
    }
    .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Status Message */
    .status-message {
        text-align: center;
        font-size: 0.75rem; /* text-xs */
    }
    .status-red {
        color: #ef4444; /* red-500 */
    }
    .status-green {
        color: #10b981; /* green-500 */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// FIX: Removed 'export'. This child component is imported by App, so it doesn't need to be externally exported in this context.
export class DrilleyeScheduleCommonFiltersComponent {
  // Inject the service
  private filterService = Inject(FilterStateService);
  public filterState = this.filterService.filterState;

  // Helper to dynamically display all boolean properties
  public booleanKeys: (keyof FilterState)[] = [
    'showEngLovFilter', 'showBiLovFilter', 'showFieldLovFilter', 'showOpLovFilter',
    'showRigLovFilter', 'showFluidLovFilter', 'showShoreLovFilter', 'showTypeLovFilter',
    'showBpAreaLovFilter', 'yearStyle'
  ];

  // This replaces the @Output() (onFilterClicked)
  // Instead of emitting, it updates the central shared service state.
  onFilterClicked(): void {
    const newRqst = Math.floor(Math.random() * (900000 - 100000 + 1)) + 100000;
    this.filterService.simulateFilterClicked(newRqst);
  }
}