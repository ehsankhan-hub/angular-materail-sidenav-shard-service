import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealTimeDisplayComponent } from '../../wellboreview/realTimeDisplay/realTimeDisplay.component';
import { ITracks } from '../../../models/chart/tracks';
import { WellDataService } from '../../../service/well-service/well.service';
import { CircularGaugeComponent } from '../../gauge/circular-gauge/circular-gauge.component';
import { LinearGaugeComponent } from '../../gauge/linear-gauge/linear-gauge.component';
import { NumericGaugeComponent } from '../../gauge/numeric-gauge/numeric-gauge.component';

@Component({
  selector: 'app-goc-lwd-density-display',
  standalone: true,
  imports: [
    CommonModule,
    RealTimeDisplayComponent,
    CircularGaugeComponent,
    LinearGaugeComponent,
    NumericGaugeComponent
  ],
  templateUrl: './goc-lwd-density-display.component.html',
  styleUrls: ['./goc-lwd-density-display.component.scss']
})
export class GocLwdDensityDisplayComponent implements OnInit {
  wellsData: any[] = [];

  /** ✅ Default 5 preselected wells (initial load) */
  preselectedWells = [
    { well: 'WELL-001', wellbore: 'BORE-001', mnemonics: ['SGR_RT', 'SIGMA', 'SIGMAE'] },
    { well: 'WELL-002', wellbore: 'BORE-002', mnemonics: ['GR_L', 'NBI', 'ABG_L'] },
    { well: 'WELL-003', wellbore: 'BORE-003', mnemonics: ['THOR_RT', 'URAN_RT', 'POTA_RT'] },
    { well: 'WELL-004', wellbore: 'BORE-004', mnemonics: ['GR_M', 'TVD'] },
    { well: 'WELL-005', wellbore: 'BORE-005', mnemonics: ['SGR_RT', 'SIGMAE'] }
  ];

  constructor(private wellService: WellDataService) {}

  ngOnInit(): void {
    // ✅ load 5 wells initially
    this.buildWellsData(this.preselectedWells);
  }

  /** ✅ Core method — reusable for initial and dynamic selection */
  buildWellsData(selectedWells: { well: string; wellbore: string; mnemonics: string[] }[]): void {
    this.wellsData = selectedWells.map((w) => ({
      well: w.well,
      wellbore: w.wellbore,
      selectedTrackList: this.buildTrackListForWell(w.well, w.wellbore, 'LWD_Depth', w.mnemonics),
      widgets: this.buildWidgetsFromMnemonics(w.mnemonics)
    }));
  }

  /** ✅ Rebuild when user selects new wells dynamically */
  onUserSelectionChange(userSelection: { well: string; wellbore: string; mnemonics: string[] }[]) {
    // could be called from dropdown, form, or button click
    this.buildWellsData(userSelection);
  }

  /** ✅ Dynamic track builder (same logic as before) */
  buildTrackListForWell(
    wellId: string,
    wellboreId: string,
    logId: string,
    mnemonics: string[]
  ): ITracks[] {
    const listOfTrack: ITracks[] = [];
    const curves: any[] = [];

    mnemonics.forEach((mnemonic, i) => {
      const curve = this.wellService.GetDefaultMnemonic();
      curve.wellId = wellId;
      curve.wellboreId = wellboreId;
      curve.LogId = logId;
      curve.displayName = mnemonic;
      curve.mnemonic = mnemonic;
      curve.mnemonicId = mnemonic;
      curve.min = 0;
      curve.max = 150;
      curve.autoScale = false;
      curve.color = this.getColorByIndex(i);
      if (i % 2 === 0) curve.lineStyle = '2,4';
      curves.push(curve);
    });

    // Track 1 (main)
    listOfTrack.push({
      trackNo: 1,
      trackName: 'Main Track',
      trackType: 'Linear',
      isIndex: true,
      isDepth: true,
      isImage: false,
      isMudLog: false,
      curves,
      comments: []
    });

    // Track 2 (index)
    listOfTrack.push({
      trackNo: 2,
      trackName: 'Index Track',
      trackType: 'Index',
      isIndex: true,
      isDepth: true,
      isImage: false,
      isMudLog: false,
      curves: [],
      comments: []
    });

    return listOfTrack;
  }

  /** ✅ Widgets auto-generated from mnemonics */
  buildWidgetsFromMnemonics(mnemonics: string[]): any[] {
    return mnemonics.map((mnemonic, i) => ({
      type: this.getWidgetType(i),
      label: mnemonic,
      unit: 'ft',
      color: this.getColorByIndex(i)
    }));
  }

  /** Utility: Color palette */
  getColorByIndex(i: number): string {
    const colors = ['#6b312d', '#d98c86', '#af7ebf', '#b3e7b3', '#0077cc', '#22aa55', '#ffaa00'];
    return colors[i % colors.length];
  }

  /** Utility: rotate widget types for variety */
  getWidgetType(i: number): string {
    const types = ['CircularGauge', 'NumericGauge', 'LinearGauge'];
    return types[i % types.length];
  }
}



////////////////////

<div class="container-fluid">
  <div class="row mb-3">
    <!-- optional control to trigger user selection -->
    <div class="col-12 text-center">
      <button
        class="btn btn-primary"
        (click)="onUserSelectionChange([
          { well: 'WELL-006', wellbore: 'BORE-006', mnemonics: ['GR_L', 'SIGMAE'] },
          { well: 'WELL-007', wellbore: 'BORE-007', mnemonics: ['TVD', 'URAN_RT', 'NBI'] }
        ])">
        🔄 Load User-Selected Wells
      </button>
    </div>
  </div>

  <div *ngFor="let item of wellsData" class="row mb-4 shadow-sm rounded bg-white">
    <!-- Left: track view -->
    <div class="col-lg-9 col-md-8 col-sm-12 p-3">
      <h5 class="fw-bold text-center">{{ item.well }} ({{ item.wellbore }})</h5>
      <app-RT
        [wells]="item.well"
        [wellbore]="item.wellbore"
        [lstOfTrack]="item.selectedTrackList"
        callingFrom="StaticTemplate">
      </app-RT>
    </div>

    <!-- Right: widgets -->
    <div class="col-lg-3 col-md-4 col-sm-12 p-3 border-start bg-light">
      <div *ngFor="let w of item.widgets" class="mb-3 text-center">
        <ng-container [ngSwitch]="w.type">
          <app-circular-gauge
            *ngSwitchCase="'CircularGauge'"
            [label]="w.label"
            [unit]="w.unit"
            [color]="w.color">
          </app-circular-gauge>

          <app-numeric-gauge
            *ngSwitchCase="'NumericGauge'"
            [label]="w.label"
            [unit]="w.unit"
            [color]="w.color">
          </app-numeric-gauge>

          <app-linear-gauge
            *ngSwitchCase="'LinearGauge'"
            [label]="w.label"
            [unit]="w.unit"
            [color]="w.color">
          </app-linear-gauge>
        </ng-container>
      </div>
    </div>
  </div>
</div>


/////////////////



import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealTimeDisplayComponent } from '../../wellboreview/realTimeDisplay/realTimeDisplay.component';
import { ITracks } from '../../../models/chart/tracks';
import { WellDataService } from '../../../service/well-service/well.service';
import { CircularGaugeComponent } from '../../gauge/circular-gauge/circular-gauge.component';
import { LinearGaugeComponent } from '../../gauge/linear-gauge/linear-gauge.component';
import { NumericGaugeComponent } from '../../gauge/numeric-gauge/numeric-gauge.component';

@Component({
  selector: 'app-goc-lwd-density-display',
  standalone: true,
  imports: [
    CommonModule,
    RealTimeDisplayComponent,
    CircularGaugeComponent,
    LinearGaugeComponent,
    NumericGaugeComponent
  ],
  templateUrl: './goc-lwd-density-display.component.html',
  styleUrls: ['./goc-lwd-density-display.component.scss']
})
export class GocLwdDensityDisplayComponent implements OnChanges {
  @Input() graphData: any; // ✅ dynamically provided from parent

  wellsData: any[] = [];

  constructor(private wellService: WellDataService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["graphData"] && !changes["graphData"].isFirstChange()) {
      if (this.graphData) {
        this.processGraphData(this.graphData);
      }
    }
  }
  

  /** ✅ Converts graphData into wellsData for visualization */
  processGraphData(graphData: any): void {
    const dynamicWells: any[] = [];

    graphData.wells.forEach((well: any) => {
      // Group mnemonics by log ID (like your code)
      const groupedMnemonics = well.mnemonicList.reduce((acc: any[], item: any) => {
        const logId = item.selectedWellBoreLog.uid;
        const logDetails = item.selectedWellBoreLog.logCurveInfo;
        const mnemonicName = item.mnemonic.mnemonic;

        let group = acc.find((g) => g.log === logId);
        if (!group) {
          group = { log: logId, logDetails, list: [] };
          acc.push(group);
        }
        group.list.push(mnemonicName);
        return acc;
      }, []);

      groupedMnemonics.forEach((group: any) => {
        dynamicWells.push({
          well: well.selectedWell.uid,
          wellbore: well.selectedWellBore.uid,
          logId: group.log,
          mnemonics: group.list
        });
      });
    });

    // ✅ Rebuild visualization using the extracted wells and mnemonics
    this.buildWellsData(dynamicWells);
  }

  /** Builds wellsData (same as before) */
  buildWellsData(selectedWells: { well: string; wellbore: string; mnemonics: string[] }[]): void {
    this.wellsData = selectedWells.map((w) => ({
      well: w.well,
      wellbore: w.wellbore,
      selectedTrackList: this.buildTrackListForWell(w.well, w.wellbore, w.logId || 'LWD_Depth', w.mnemonics),
      widgets: this.buildWidgetsFromMnemonics(w.mnemonics)
    }));
  }

  /** Builds tracks from mnemonics */
  buildTrackListForWell(
    wellId: string,
    wellboreId: string,
    logId: string,
    mnemonics: string[]
  ): ITracks[] {
    const listOfTrack: ITracks[] = [];
    const curves: any[] = [];

    mnemonics.forEach((mnemonic, i) => {
      const curve = this.wellService.GetDefaultMnemonic();
      curve.wellId = wellId;
      curve.wellboreId = wellboreId;
      curve.LogId = logId;
      curve.displayName = mnemonic;
      curve.mnemonic = mnemonic;
      curve.mnemonicId = mnemonic;
      curve.min = 0;
      curve.max = 150;
      curve.autoScale = false;
      curve.color = this.getColorByIndex(i);
      if (i % 2 === 0) curve.lineStyle = '2,4';
      curves.push(curve);
    });

    listOfTrack.push({
      trackNo: 1,
      trackName: 'Main Track',
      trackType: 'Linear',
      isIndex: true,
      isDepth: true,
      isImage: false,
      isMudLog: false,
      curves,
      comments: []
    });

    listOfTrack.push({
      trackNo: 2,
      trackName: 'Index Track',
      trackType: 'Index',
      isIndex: true,
      isDepth: true,
      isImage: false,
      isMudLog: false,
      curves: [],
      comments: []
    });

    return listOfTrack;
  }

  /** Builds matching widgets for each mnemonic */
  buildWidgetsFromMnemonics(mnemonics: string[]): any[] {
    return mnemonics.map((mnemonic, i) => ({
      type: this.getWidgetType(i),
      label: mnemonic,
      unit: 'ft',
      color: this.getColorByIndex(i)
    }));
  }

  /** Utility helpers */
  getColorByIndex(i: number): string {
    const colors = ['#6b312d', '#d98c86', '#af7ebf', '#b3e7b3', '#0077cc', '#22aa55', '#ffaa00'];
    return colors[i % colors.length];
  }

  getWidgetType(i: number): string {
    const types = ['CircularGauge', 'NumericGauge', 'LinearGauge'];
    return types[i % types.length];
  }
}


/////////////

<div class="container-fluid">
  <div *ngFor="let item of wellsData" class="row mb-4 shadow-sm rounded bg-white">
    <!-- Left: Real-time tracks -->
    <div class="col-lg-9 col-md-8 col-sm-12 p-3">
      <h5 class="fw-bold text-center">{{ item.well }} ({{ item.wellbore }})</h5>
      <app-RT
        [wells]="item.well"
        [wellbore]="item.wellbore"
        [lstOfTrack]="item.selectedTrackList"
        callingFrom="StaticTemplate">
      </app-RT>
    </div>

    <!-- Right: Widgets -->
    <div class="col-lg-3 col-md-4 col-sm-12 p-3 border-start bg-light">
      <div *ngFor="let w of item.widgets" class="mb-3 text-center">
        <ng-container [ngSwitch]="w.type">
          <app-circular-gauge
            *ngSwitchCase="'CircularGauge'"
            [label]="w.label"
            [unit]="w.unit"
            [color]="w.color">
          </app-circular-gauge>

          <app-numeric-gauge
            *ngSwitchCase="'NumericGauge'"
            [label]="w.label"
            [unit]="w.unit"
            [color]="w.color">
          </app-numeric-gauge>

          <app-linear-gauge
            *ngSwitchCase="'LinearGauge'"
            [label]="w.label"
            [unit]="w.unit"
            [color]="w.color">
          </app-linear-gauge>
        </ng-container>
      </div>
    </div>
  </div>
</div>

////////////////////////



import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SharedService {
  // Start with a safe default
  private multiWellFilterData = new BehaviorSubject<any>({ wells: [] });
  multiWellFilterData$ = this.multiWellFilterData.asObservable();

  /** Get the latest value synchronously */
  getMultiWellFilterData() {
    return this.multiWellFilterData.value || { wells: [] };
  }

  /** Replace everything (used for reset or first load) */
  setMultiWellFilterData(newData: any) {
    this.multiWellFilterData.next(newData);
  }

  /** ✅ Merge new wells with existing, prevent duplicates */
  mergeSelectedWells(newData: any) {
    // Get the current wells list safely
    const currentData = this.getMultiWellFilterData();
    const currentWells = Array.isArray(currentData.wells) ? currentData.wells : [];

    // Normalize new wells — support single or multiple wells
    const newWells = Array.isArray(newData.wells)
      ? newData.wells
      : newData.well
      ? [newData]
      : [];

    // Merge + remove duplicates (by well + wellbore)
    const merged = [...currentWells, ...newWells].filter(
      (well, index, arr) =>
        arr.findIndex(
          (x) => x.well === well.well && x.wellbore === well.wellbore
        ) === index
    );

    // Emit the new merged data
    this.multiWellFilterData.next({ wells: merged });
  }

  /** Optional clear/reset */
  clearSelection() {
    this.multiWellFilterData.next({ wells: [] });
  }
}
