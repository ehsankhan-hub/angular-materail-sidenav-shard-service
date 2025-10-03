import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DrilleyeScheduleCommonFiltersComponent } from '../drilleye-schedule-common-filters/drilleye-schedule-common-filters.component';
import { FilterStateService } from '../../services/filter-state.service';
// --- 4. PARENT COMPONENT (APP) ---

/**
 * The main application component that acts as the parent of the filter component.
 * It also demonstrates reading the shared state.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  // The components are now resolved correctly by their class names within this file.
  imports: [CommonModule, DrilleyeScheduleCommonFiltersComponent],
  // Template updated to use standard CSS classes instead of Tailwind
  template: `
    <!-- Removed Tailwind script -->
    <div class="app-container">
      <h1 class="app-title">Shared Filter State Example</h1>
      <p class="app-description">
        This demonstrates how a **Shared Service** with signals replaces dozens of
        <code>@Input()</code> bindings for cleaner component communication.
      </p>

      <div class="main-content">
        <!-- MAT-CARD Simulation -->
        @if (isCridValid()) {
          <div class="card host-card">
            <h2 class="host-title">
              <span class="host-subtitle">Component Host:</span> Schedule Filters
            </h2>
            <!-- The Child Component is rendered here -->
            <drilleye-schedule-common-filters />
          </div>
        } @else {
          <div class="card error-card">
            Filter Card is hidden because CRID is null.
          </div>
        }

        <!-- STATE MONITOR (A third component reading the shared state) -->
        <div class="card monitor-card">
          <h3 class="monitor-title">
            Global State Monitor (Read by a different component)
          </h3>
          <p class="monitor-description">
            Watch these values change when you click the "Run Filter" button above.
          </p>
          <div class="monitor-data">
            <!-- Displaying both Request and Schedule numbers here -->
            <div class="data-row separator">
                <span class="data-label">Request / Schedule:</span>
                <span class="data-value data-green">
                  R: {{ sharedState().rqstNumber }} / S: {{ sharedState().schdNumber }}
                </span>
            </div>
            <div class="data-row">
                <span class="data-label">disableFilter:</span>
                <span 
                  class="data-value"
                  [ngClass]="sharedState().disableFilter ? 'data-red' : 'data-green'"
                >
                  {{ sharedState().disableFilter }}
                </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Global Styles */
    :root {
        --color-primary: #6366f1; /* indigo-500 */
        --color-secondary: #fcd34d; /* yellow-300 */
        --color-bg: #f3f4f6; /* gray-100 */
        --color-text-dark: #1f2937; /* gray-800 */
    }
    
    .app-container {
      min-height: 100vh;
      padding: 1rem;
      background-color: var(--color-bg);
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'Inter', sans-serif;
    }

    .app-title {
      font-size: 2rem; 
      font-weight: 800; /* font-extrabold */
      color: var(--color-text-dark);
      margin-bottom: 1.5rem;
      border-bottom: 4px solid #a5b4fc; /* indigo-400 */
      padding-bottom: 0.5rem;
      text-align: center;
    }

    .app-description {
      color: #4b5563; /* gray-600 */
      margin-bottom: 2rem;
      max-width: 32rem; /* max-w-xl */
      text-align: center;
    }

    /* Main Content Area (Uses Flexbox for vertical stacking and centering) */
    .main-content {
        width: 100%;
        max-width: 32rem; /* max-w-lg */
        display: flex;
        flex-direction: column;
        gap: 24px; /* space-y-6 */
    }

    /* Base Card Style */
    .card {
      padding: 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
    }

    /* Host Card (Parent of the Filter Component) */
    .host-card {
        background-color: white;
    }
    .host-title {
        font-size: 1.25rem; /* text-xl */
        font-weight: 700; /* font-bold */
        color: #4f46e5; /* indigo-600 */
        margin-bottom: 1rem;
    }
    .host-subtitle {
        color: #9ca3af; /* gray-400 */
        font-size: 0.875rem; /* text-sm */
        font-weight: 400;
        display: block;
    }

    /* Error Card */
    .error-card {
        background-color: #fee2e2; /* red-100 */
        color: #b91c1c; /* red-700 */
    }

    /* Monitor Card */
    .monitor-card {
        background-color: #1f2937; /* gray-800 */
        color: white;
    }
    .monitor-title {
        font-size: 1.125rem; /* text-lg */
        font-weight: 600; /* font-semibold */
        color: var(--color-secondary);
        margin-bottom: 0.75rem;
    }
    .monitor-description {
        font-size: 0.875rem; /* text-sm */
        margin-bottom: 1rem;
    }
    .monitor-data {
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .data-row {
        display: flex;
        justify-content: space-between;
        padding-top: 4px;
    }
    .data-row.separator {
        border-bottom: 1px solid #374151; /* gray-700 */
        padding-bottom: 4px;
    }
    .data-label {
        font-weight: 500; /* font-medium */
    }
    .data-value {
        font-family: monospace;
        font-size: 0.875rem; /* text-sm */
    }
    .data-green { color: #84cc16; /* lime-500 */ }
    .data-red { color: #f87171; /* red-400 */ }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentComponent {
  // Simulate the conditional display logic from the original mat-card
  private crid = signal<number | null>(12345);
  public isCridValid = signal<boolean>(this.crid() !== null);

  // Inject the shared service and expose the state for the monitor section
  private filterService = inject(FilterStateService);
  public sharedState = this.filterService.filterState;

  // In a real app, you might call this to hide the card:
  // ngAfterViewInit() {
  //   setTimeout(() => this.crid.set(null), 5000);
  // }
}

