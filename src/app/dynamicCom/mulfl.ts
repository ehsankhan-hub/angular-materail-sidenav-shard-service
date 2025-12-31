@Obfuscate()
export class CrossTrackTooltip extends ToolTipTool implements OnDestroy {
    private readonly _selector = new Selector();
    private _host: HTMLElement;
    private _trackInfo: ITracks[] = [];
    private _indexCurveDepth: number[] = [];
    private _indexCurveTime: Date[] = [];
    private _hideHeader = false;
    
    // POOLING PROPERTIES
    private _tooltipPool: HTMLElement[] = [];
    private _circlePool: { [key: string]: HTMLElement } = {};
    private _horizontalLinePool: HTMLElement[] = [];
    
    private _currentTrackIdx: number = -1;
    private _debounceTimer: any;
    private _lastMousePt: Point | undefined;
    private readonly _debounceDelay = 50; // Reduced for responsiveness
    private _tooltipTimeout: any;
    private _currentSequenceIndex = 0;

    constructor(
        private readonly _widget: WellLogWidget,
        host: HTMLElement,
        trackInfo: ITracks[],
        indexCurveDepth: number[],
        indexCurveTime: Date[],
        hideHeader: boolean,
        private wellService: WellDataService
    ) {
        super({ layer: _widget, autoupdate: false, autoflip: true });
        this._host = host;
        this._trackInfo = trackInfo;
        this._indexCurveDepth = indexCurveDepth;
        this._indexCurveTime = indexCurveTime;
        this._hideHeader = hideHeader;

        // 1. Initialize Tooltip Pool (e.g., max 10 tracks)
        for (let i = 0; i < 10; i++) {
            const el = document.createElement('div');
            el.className = 'cg-tooltip-container';
            el.style.display = 'none';
            el.style.position = 'absolute';
            el.style.pointerEvents = 'none';
            el.style.zIndex = '99999';
            document.body.appendChild(el);
            this._tooltipPool.push(el);
        }

        // 2. Initialize Line Pool
        for (let i = 0; i < 5; i++) {
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.height = '1px';
            line.style.background = 'white';
            line.style.display = 'none';
            line.style.zIndex = '10000';
            document.body.appendChild(line);
            this._horizontalLinePool.push(line);
        }

        this.setCallback(this._callbackWrapper.bind(this));
    }

    private _callbackWrapper(pt: Point): any {
        this._debouncedHandle(pt);
        return null;
    }

    private _debouncedHandle(pt: Point): void {
        this._lastMousePt = pt;
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
            if (this._lastMousePt) this._tooltipCallback(this._lastMousePt);
        }, this._debounceDelay);
    }

    private _tooltipCallback(pt: Point): any {
        if (this._tooltipTimeout) clearTimeout(this._tooltipTimeout);

        const nodes = this._selector?.select(this._widget, pt.x, pt.y, 2);
        if (!nodes?.length) {
            this._resetAll();
            return '';
        }

        const manipLayer: any = this._widget.getTrackManipulatorLayer();
        const sceneTransform = manipLayer?.getSceneTransform?.();
        const depth = sceneTransform ? sceneTransform.inverseTransformPoint(pt).getY() : pt.y;

        // Optimized traversal
        from(this._widget)
            .where(node => node instanceof LogTrack)
            .select((track, i) => this._drawForTrack(track as LogTrack, pt, depth, i));
    }

    private _drawForTrack(logTrack: LogTrack, pt: Point, depth: number, poolIdx: number): void {
        const index = this._widget.getTrackIndex(logTrack);
        const bounds: any = logTrack.getBounds();
        const hostRect = this._host.getBoundingClientRect();
        
        // Use pooled line
        const line = this._horizontalLinePool[poolIdx % this._horizontalLinePool.length];
        line.style.display = 'block';
        line.style.top = `${pt.y + hostRect.top}px`;
        line.style.left = `${hostRect.left}px`;
        line.style.width = `${hostRect.width}px`;

        if (pt.y < this._widget.getHeaderHeight() || !this._trackInfo[index] || this._trackInfo[index].curves?.length === 0) {
            this._hideTrackUI(index, poolIdx);
            return;
        }

        // Use pooled tooltip
        const tooltip = this._tooltipPool[poolIdx % this._tooltipPool.length];
        tooltip.style.display = 'block';
        tooltip.innerHTML = this._buildTooltipContent(index, depth);
        
        // Position logic (Simplified for speed)
        tooltip.style.top = `${pt.y + hostRect.top + 15}px`;
        tooltip.style.left = `${bounds.getCenterX() + hostRect.left - 50}px`;

        // Circle handling (Reuse by curve name)
        this._trackInfo[index].curves.forEach(curve => {
            let circle = this._circlePool[curve.displayName];
            if (!circle) {
                circle = document.createElement('div');
                circle.className = 'cg-circle-container';
                circle.style.position = 'absolute';
                circle.style.width = '10px';
                circle.style.height = '10px';
                circle.style.borderRadius = '50%';
                circle.style.zIndex = '10001';
                document.body.appendChild(circle);
                this._circlePool[curve.displayName] = circle;
            }
            circle.style.background = curve.color;
            circle.style.display = 'block';
            // (Your existing X-Intersection math here...)
            circle.style.top = `${hostRect.top + pt.y}px`;
            circle.style.left = `${hostRect.left + bounds.getLeft() + 50}px`; // Placeholder for math
        });
    }

    private _resetAll(): void {
        this._tooltipPool.forEach(t => t.style.display = 'none');
        this._horizontalLinePool.forEach(l => l.style.display = 'none');
        Object.values(this._circlePool).forEach(c => c.style.display = 'none');
    }

    private _hideTrackUI(index: number, poolIdx: number): void {
        this._tooltipPool[poolIdx % this._tooltipPool.length].style.display = 'none';
    }

    private _buildTooltipContent(trackIdx: number, depth: number): string {
        const track = this._trackInfo[trackIdx];
        return `<b>${track.trackName}</b><br>Depth: ${depth.toFixed(2)}`;
    }

    ngOnDestroy(): void {
        this._resetAll();
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        // Clean up DOM
        this._tooltipPool.forEach(t => t.remove());
        this._horizontalLinePool.forEach(l => l.remove());
        Object.values(this._circlePool).forEach(c => c.remove());
    }
}


// Inside RealTimeDisplay.component.ts

async startExportProcess(result: any) {
  this.printing = true;
  const isTime = this.logWidget.getIndexType() === 'time';

  // 1. Prepare Selection Rect (Vertical slice of the log)
  let selection: any;
  if (result.rangeType === 'range') {
    const start = isTime ? new Date(result.startTime).getTime() : result.fromDepth;
    const end = isTime ? new Date(result.endTime).getTime() : result.toDepth;
    // Rect(x, y1, width, y2)
    selection = new (geotoolkit as any).util.Rect(0, start, 0, end);
  } else {
    // Falls back to current visible view
    selection = this.logWidget.getVisibleLimits();
  }

  // 2. Build the Header Group dynamically
  let pdfHeader = null;
  if (result.headerFrequency !== 'none') {
    pdfHeader = new (geotoolkit as any).scene.Group()
      .setLayout(new (geotoolkit as any).layout.BoxLayout({ orientation: 'vertical' }))
      .setBounds(new (geotoolkit as any).util.Rect(0, 0, 100, 40));

    pdfHeader.addChild(new (geotoolkit as any).scene.shapes.Text({
      text: this.wellName, // Uses wellName from your component
      textstyle: { font: 'bold 16px Arial', color: 'black' }
    }));
  }

  // 3. Call the NATIVE LogWidget method
  try {
    // Note: LogWidget.exportToPdf returns a Promise<IWritable>
    const writable = await this.logWidget.exportToPdf({
      'selection': selection,
      'header': pdfHeader,
      'repeatHeader': result.headerFrequency === 'all',
      'printSettings': {
        'paperFormat': result.printSettings.paperFormat,
        'orientation': result.printSettings.orientation,
        'scaling': 'AsIs', // Map your result.scale here if needed
        'keepAspectRatio': true
      },
      'progress': (current: number, total: number) => {
        this.loadingValue = (current / total) * 100;
      }
    });

    // 4. Trigger Download
    if (writable && writable.save) {
      await writable.save(`${this.wellName}_Export.pdf`);
    }
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    this.printing = false;
  }
}


////////////////////


openPrintDialog() {
  const isTime = this.logWidget.getIndexType() === 'time';
  const limits = this.logWidget.getDepthLimits();

  const dialogRef = this.dialog.open(PrintDialogComponent, {
    width: '600px',
    data: {
      indexType: isTime ? 'time' : 'depth',
      limits: { start: limits.getLow(), end: limits.getHigh() }
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // --- THIS IS WHERE THE CODE GOES ---
      this.printing = true; // Show your loading spinner/overlay
      
      const settings = {
        printSettings: result.printSettings,
        header: result.headerFrequency,
        headerData: { wellName: this.wellName, field: this.field, uwi: this.uwi },
        customLimits: result.rangeType === 'range' ? {
           start: isTime ? this.convertToTimestamp(result.startTime) : result.fromDepth,
           end: isTime ? this.convertToTimestamp(result.endTime) : result.toDepth
        } : null
      };

      // We cast to 'any' because 'exportToPDF' is a custom method we added to your App/Widget class
      (this.logWidget as any).exportToPDF(settings, (current: number, total: number) => {
          this.loadingValue = (current / total) * 100; // Update your progress bar
      })
      .then(() => {
          this.printing = false; // Hide spinner when done
      })
      .catch((err: any) => {
          console.error(err);
          this.printing = false;
      });
    }
  });
}

/////

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-print-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatRadioModule, MatButtonModule
  ],
  templateUrl: './print-dialog.component.html',
  styleUrls: ['./print-dialog.component.css']
})
export class PrintDialogComponent implements OnInit {
  public mode: 'depth' | 'time' = 'depth'; 

  public dialogData = {
    rangeType: 'visible',
    fromDepth: 0,
    toDepth: 0,
    startTime: '',
    endTime: '',
    scale: '1:600',
    outputType: 'file', // Print or Export to File
    headerFrequency: 'once', // None, Once, All
    showPageNumber: true,
    showPrintRange: true,
    printSettings: {
      paperFormat: 'Letter',
      orientation: 'Portrait'
    }
  };

  public scales = ['1:60', '1:120', '1:200', '1:240', '1:360', '1:600', '1:1000'];

  constructor(
    public dialogRef: MatDialogRef<PrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    // 1. Set Mode based on incoming data from RTD component
    this.mode = this.data.indexType === 'time' ? 'time' : 'depth';
    
    // 2. Pre-fill the inputs with the current visible limits from the widget
    if (this.mode === 'depth') {
      this.dialogData.fromDepth = Math.round(this.data.limits.start * 100) / 100;
      this.dialogData.toDepth = Math.round(this.data.limits.end * 100) / 100;
    } else {
      this.dialogData.startTime = this.formatDateForInput(this.data.limits.start);
      this.dialogData.endTime = this.formatDateForInput(this.data.limits.end);
    }
  }

  // Helper to convert Unix Timestamp to HTML Date Input format
  private formatDateForInput(timestamp: number): string {
    const date = new Date(timestamp);
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 
           'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  onConfirm() {
    this.dialogRef.close(this.dialogData);
  }
}

///////////////////


<h2 mat-dialog-title>Print properties</h2>
<mat-dialog-content class="dialog-content">
  
  <p class="warning-text">Note: If printing more than few hours of data, it is recommended to use 64 bit application process.</p>

  <fieldset class="section">
    <legend>Print range ({{ mode | titlecase }} Based)</legend>
    <mat-radio-group [(ngModel)]="dialogData.rangeType">
      <mat-radio-button value="visible">Visible range</mat-radio-button>
      <mat-radio-button value="all">All</mat-radio-button>
      
      <div class="range-row">
        <mat-radio-button value="range">Range:</mat-radio-button>
        
        <ng-container *ngIf="mode === 'depth'">
          <span class="label">from</span>
          <input class="mini-input" type="number" [(ngModel)]="dialogData.fromDepth">
          <span class="label">to</span>
          <input class="mini-input" type="number" [(ngModel)]="dialogData.toDepth">
          <span class="label">FT</span>
        </ng-container>

        <ng-container *ngIf="mode === 'time'">
          <span class="label">from</span>
          <input class="time-input" type="datetime-local" [(ngModel)]="dialogData.startTime">
          <span class="label">to</span>
          <input class="time-input" type="datetime-local" [(ngModel)]="dialogData.endTime">
        </ng-container>
      </div>
    </mat-radio-group>
  </fieldset>

  <div class="flex-row">
    <div class="left-col">
      <div class="inline-field">
        <label>Scale</label>
        <mat-select [(ngModel)]="dialogData.scale" class="small-select">
          <mat-option *ngFor="let s of scales" [value]="s">{{s}}</mat-option>
        </mat-select>
        <span>2" Log</span>
      </div>

      <mat-radio-group [(ngModel)]="dialogData.outputType" class="radio-row">
        <mat-radio-button value="print">Print</mat-radio-button>
        <mat-radio-button value="file">Export to file</mat-radio-button>
      </mat-radio-group>

      <div class="header-control">
        <label>Header</label>
        <mat-radio-group [(ngModel)]="dialogData.headerFrequency" class="radio-row">
          <mat-radio-button value="none">None</mat-radio-button>
          <mat-radio-button value="once">Once</mat-radio-button>
          <mat-radio-button value="all">All</mat-radio-button>
        </mat-radio-group>
      </div>
    </div>

    <div class="right-col">
      <mat-checkbox [(ngModel)]="dialogData.showPageNumber">Show page number</mat-checkbox>
      <mat-checkbox [(ngModel)]="dialogData.showPrintRange">Show print range</mat-checkbox>
    </div>
  </div>

</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-raised-button color="primary" (click)="onConfirm()">OK</button>
  <button mat-button mat-dialog-close>Cancel</button>
</mat-dialog-actions>


/////////////////

.dialog-content { font-size: 12px; color: #333; }
.warning-text { color: #d32f2f; margin-bottom: 12px; font-weight: 500; }
.section { border: 1px solid #ccc; padding: 12px; margin-bottom: 15px; border-radius: 4px; }
.range-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-left: 28px; }
.mini-input { width: 80px; border: 1px solid #ccc; padding: 4px; }
.time-input { border: 1px solid #ccc; padding: 2px; font-size: 11px; }
.flex-row { display: flex; justify-content: space-between; margin-top: 15px; }
.radio-row { display: flex; gap: 12px; margin: 8px 0; }
.header-control { border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; }
.small-select { width: 100px; margin: 0 8px; border: 1px solid #ccc; height: 24px; font-size: 12px;}
.right-col { display: flex; flex-direction: column; gap: 10px; }








///
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-print-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatRadioModule, MatButtonModule
  ],
  templateUrl: './print-dialog.component.html',
  styleUrls: ['./print-dialog.component.css']
})
export class PrintDialogComponent {
  public dialogData = {
    rangeType: 'visible',
    fromDepth: 5864.49,
    toDepth: 6185.32,
    scale: '1:600',
    outputType: 'print', // 'print' | 'file'
    headerFrequency: 'once', // 'none' | 'once' | 'all'
    location: 'topbottom',
    showPageNumber: false,
    showPrintRange: false,
    printSettings: {
      paperFormat: 'Letter',
      orientation: 'Portrait'
    }
  };

  public scales = ['1:60', '1:120', '1:200', '1:240', '1:360', '1:480', '1:500', '1:600', '1:1000'];

  constructor(public dialogRef: MatDialogRef<PrintDialogComponent>) {}

  onConfirm() {
    this.dialogRef.close(this.dialogData);
  }
}

///////////////
<h2 mat-dialog-title>Print properties</h2>
<mat-dialog-content class="dialog-content">
  
  <p class="warning-text">Note: If printing more than few hours of data, it is recommended to use 64 bit application process.</p>

  <fieldset class="section">
    <legend>Print range</legend>
    <mat-radio-group [(ngModel)]="dialogData.rangeType">
      <mat-radio-button value="visible">Visible range</mat-radio-button>
      <mat-radio-button value="all">All</mat-radio-button>
      <div class="range-row">
        <mat-radio-button value="range">Range:</mat-radio-button>
        <span class="label">from</span>
        <input class="mini-input" [(ngModel)]="dialogData.fromDepth">
        <span class="label">FT to</span>
        <input class="mini-input" [(ngModel)]="dialogData.toDepth">
        <span class="label">FT</span>
      </div>
    </mat-radio-group>
  </fieldset>

  <div class="flex-row">
    <div class="left-col">
      <div class="inline-field">
        <label>Scale</label>
        <mat-select [(ngModel)]="dialogData.scale" class="scale-select">
          <mat-option *ngFor="let s of scales" [value]="s">{{s}}</mat-option>
        </mat-select>
        <span>2" Log</span>
      </div>

      <mat-radio-group [(ngModel)]="dialogData.outputType" class="radio-row">
        <mat-radio-button value="print">Print</mat-radio-button>
        <mat-radio-button value="file">Export to file</mat-radio-button>
      </mat-radio-group>

      <div class="header-section">
        <label>Header</label>
        <mat-radio-group [(ngModel)]="dialogData.headerFrequency" class="radio-row">
          <mat-radio-button value="none">None</mat-radio-button>
          <mat-radio-button value="once">Once</mat-radio-button>
          <mat-radio-button value="all">All</mat-radio-button>
        </mat-radio-group>
      </div>
    </div>

    <div class="right-col">
      <mat-checkbox [(ngModel)]="dialogData.showPageNumber">Show page number</mat-checkbox>
      <mat-checkbox [(ngModel)]="dialogData.showPrintRange">Show print range</mat-checkbox>
    </div>
  </div>

  <div class="footer-select">
    <label>Location</label>
    <mat-select [(ngModel)]="dialogData.location">
      <mat-option value="topbottom">Include log header at the top and bottom</mat-option>
    </mat-select>
  </div>

</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="onConfirm()" class="ok-btn">OK</button>
  <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
</mat-dialog-actions>
/////


.dialog-content { font-size: 12px; color: #333; }
.warning-text { color: red; margin-bottom: 10px; font-style: italic; }
.section { border: 1px solid #ccc; padding: 10px; margin-bottom: 15px; }
.range-row { display: flex; align-items: center; gap: 5px; margin-top: 5px; padding-left: 25px; }
.mini-input { width: 80px; border: 1px solid #ccc; padding: 2px; }
.flex-row { display: flex; justify-content: space-between; margin-top: 15px; }
.radio-row { display: flex; gap: 15px; margin: 10px 0; }
.header-section { border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; }
.ok-btn, .cancel-btn { border: 1px solid #999; min-width: 80px; height: 30px; margin-left: 8px; }
.scale-select { width: 100px; border: 1px solid #ccc; margin: 0 5px; }




/////////////

exportTracksToPdf(data: any) {
  const settings = {
    printSettings: data.printSettings,
    // Decide based on the new dialog properties
    header: data.headerFrequency === 'none' ? null : new HeaderComponent(600, 20),
    // App.ts uses limits based on rangeType
    limits: data.rangeType === 'range' ? { start: data.fromDepth, end: data.toDepth } : null
  };
  
  (this.logWidget as any).exportToPDF(settings, (p) => this.loadingValue = p);
}



////
// In your rtd.component.ts
exportTracksToPdf(userSelectedSettings: any) {
  // 1. Start the loading state
  this.printing = true;
  this.showExportDialog = false;

  // 2. Prepare the exact object structure required by your App.ts screenshot
  const settingsObject = {
      printSettings: userSelectedSettings // App.ts line 8: settings['printSettings']
  };

  // 3. Define the progress callback (App.ts line 1: progress)
  const progressCallback = (currentPage: number, totalPages: number) => {
      this.loadingValue = (currentPage / totalPages) * 100;
  };

  // 4. Execute the call using the (as any) cast to avoid the argument count error
  (this.logWidget as any).exportToPDF(settingsObject, progressCallback)
      .then(() => {
          this.printing = false;
          this.loadingValue = 0;
          console.log("Export Successful");
      })
      .catch((err: any) => {
          this.printing = false;
          alert("Export failed: " + err.message);
      });
}

/////
<button (click)="showExportDialog = true" [disabled]="printing" class="btn">
    Export to PDF
</button>

<div *ngIf="showExportDialog" class="my-custom-dialog">
    <h3>Export Settings</h3>
    <button (click)="exportTracksToPdf({ paperFormat: 'A4', orientation: 'portrait' })">
        Confirm & Export
    </button>
    <button (click)="showExportDialog = false">Cancel</button>
</div>

<div *ngIf="printing" class="loading-screen">
    <p>Generating PDF: {{ loadingValue | number:'1.0-0' }}%</p>
    <div class="progress-bar-container">
        <div class="progress-fill" [style.width.%]="loadingValue"></div>
    </div>
</div>

////////////////////
createCurve(curveInfo: IWellboreLogData) {
  const values = curveInfo.data;
  const depths = values.map(
    (_val, i) =>
      this.wellService.plotMinDepth +
      (i * (this.wellService.plotMaxDepth - this.wellService.plotMinDepth)) /
        (values.length - 1)
  );
  const data = new LogData(depths, values);

  let curveValuePosition: AnchorType = AnchorType.None;
  switch (curveInfo.valuePosition) {
    case 'Left':
      curveValuePosition = AnchorType.RightCenter;
      break;
    case 'Right':
      curveValuePosition = AnchorType.LeftCenter;
      break;
    case 'Center':
      curveValuePosition = AnchorType.TopCenter;
      break;
  }
  let lastValue: number = 0;
  if (curveInfo.data.length > 0) {
    lastValue = this.wellService.getLastValueOfCurve(
      curveInfo.data,
      curveInfo.data.length - 1
    );
  }
  let min: number = 0;
  let max: number = 0;
  if (curveInfo.min != '') {
    min = curveInfo.min;
  }
  if (curveInfo.max != '') {
    max = curveInfo.max;
  }

  return new LogCurve(data)
    .setTag(curveInfo.mnemonicId) // <--- ADDED THIS: Permanent ID for updates
    .setName(
      curveInfo.displayName +
        '(' +
        (Math.round(lastValue * 100) / 100).toFixed(2) +
        ' ' +
        curveInfo.unit +
        ')'
    )
    .setVisibleValue(curveInfo.showValue)
    .setTextReference(TextReference.Sample)
    .setTextAnchorType(curveValuePosition)
    .setHideOverlappedValues(true)
    .setDisplayUnit(curveInfo.unit)
    .setTextDecimationStep(curveInfo.textDecimationStep)
    .setTextStyle({
      color: curveInfo.color,
      font: 'bold 12px Roboto',
    })
    .setLineStyle({
      color: curveInfo.color,
      width: 2,
      pattern: curveInfo.lineStyle,
    })
    .setClippingLimits(min, max);
}

///////////////////////

//New methot to upate the curve instead of crete again and angain

updateExistingCurves() {
  if (!this.logWidget) return;

  this.lstOfTrack.forEach((track) => {
      track.curves.forEach((curve) => {
          // We search for the curve using the Tag (MnemonicId)
          const visualCurve = this.logWidget.findNode(`* [tag="${curve.mnemonicId}"]`);

          if (visualCurve instanceof LogCurve) {
              // 1. Update the Data
              const logData = visualCurve.getData();
              if (logData instanceof LogData) {
                  logData.setValues(this.indexCurveDepth, curve.data);
              }

              // 2. Update the Name (so the value in the header updates)
              let lastValue = 0;
              if (curve.data.length > 0) {
                  lastValue = this.wellService.getLastValueOfCurve(curve.data, curve.data.length - 1);
              }
              visualCurve.setName(
                  curve.displayName + '(' + (Math.round(lastValue * 100) / 100).toFixed(2) + ' ' + curve.unit + ')'
              );
          }
      });
  });

  // Request redraw
  this.logWidget.updateLayout();
  this.plot.update();
}


//////////////





//////////////////////
ZoomOut() {
  if (this.initialPlotRange === 0) {
    console.log('Initial plot range is not defined. Cannot calculate scale.');
    return;
  }

  const rectEl = this.canvasToPlot.nativeElement as HTMLElement;

  if (this.currentScale > this.minScale) {
    const nextScale = this.currentScale * (4 / 5);

    // apply tentative zoom-out
    this.currentScale = nextScale;
    this.logWidget.scale(this.currentScale);

    // ✅ Guard: if the rendered canvas/widget becomes smaller than the container,
    // restore fit-to-height (full page) and keep scale at that level.
    requestAnimationFrame(() => {
      const containerH = rectEl.clientHeight || window.innerHeight;

      // Try to find an actual canvas under your container (common with INT widgets)
      const canvas = rectEl.querySelector('canvas') as HTMLCanvasElement | null;
      const canvasH = canvas?.clientHeight ?? rectEl.clientHeight;

      // If canvas is smaller than visible container, snap back to full height
      if (canvasH < containerH - 2) {
        this.logWidget.fitToHeight();

        // IMPORTANT: keep a safe minimum so next zoomOut won’t shrink below full page again
        // If you don't have getScale(), just lock minScale to currentScale.
        const safeScale =
          (this.logWidget as any).getScale?.() ??
          (this.logWidget as any).getVerticalScale?.() ??
          this.currentScale;

        this.currentScale = safeScale;
        this.minScale = safeScale;
      }
    });

    // keep your existing range logic as-is
    if (this.currentScale <= 0.5) {
      this.logWidget.fitToHeight();
      this.wellService.plotMaxDepth += 10;
      this.wellService.plotMinDepth -= 10;
    }

    console.log('Zoom out');
  } else {
    console.log('Minimum zoom out level reached.');
    // ✅ Also enforce full height at min
    this.logWidget.fitToHeight();
  }

  this.isAutoScroll = false;
}


//////////////////////

currentScale = 1;
minScale = 1;
private initializedZoom = false;

// Save the "baseline" range you never want to go below (optional, but recommended)
private baseMinDepth = 0;
private baseMaxDepth = 0;
private baseRange = 0;

ngOnInit(): void {
  this.baseMinDepth = this.wellService.plotMinDepth;
  this.baseMaxDepth = this.wellService.plotMaxDepth;
  this.baseRange = this.baseMaxDepth - this.baseMinDepth;

  this.initialPlotRange = this.plotMaxDepth - this.plotMinDepth;
}

/**
 * Call after widget is created & DOM is ready (ngAfterViewInit or after buildWidget())
 */
initZoomLimits(): void {
  if (!this.logWidget || !this.canvasToPlot?.nativeElement) return;

  // Fit once: defines the smallest allowed scale for the current container
  this.logWidget.fitToHeight();

  const s =
    (this.logWidget as any).getScale?.() ??
    (this.logWidget as any).getVerticalScale?.() ??
    this.currentScale;

  this.currentScale = s;
  this.minScale = s;         // ✅ never go smaller than this
  this.initializedZoom = true;
}

/**
 * Apply the range change to both your service + INT widget.
 * IMPORTANT: Replace the inside with the exact INT API you use for depth range.
 */
private applyDepthRange(minDepth: number, maxDepth: number): void {
  this.wellService.plotMinDepth = minDepth;
  this.wellService.plotMaxDepth = maxDepth;

  // --- INT API varies by widget/version ---
  // Use whichever exists in your project.
  (this.logWidget as any).setDepthRange?.(minDepth, maxDepth);
  (this.logWidget as any).setVisibleDepthRange?.(minDepth, maxDepth);
  (this.logWidget as any).setVisibleRange?.(minDepth, maxDepth);

  // If none of the above exist in your widget,
  // you likely need to update the axis/range model on the Plot.
  // (If you paste your widget creation code, I’ll wire the exact method.)
}

private expandRangeBy(pad: number): void {
  const newMin = this.wellService.plotMinDepth - pad;
  const newMax = this.wellService.plotMaxDepth + pad;
  this.applyDepthRange(newMin, newMax);
}

private shrinkRangeBy(pad: number): void {
  let newMin = this.wellService.plotMinDepth + pad;
  let newMax = this.wellService.plotMaxDepth - pad;

  // ✅ never shrink below your original/base range
  const newRange = newMax - newMin;
  if (newRange < this.baseRange) {
    newMin = this.baseMinDepth;
    newMax = this.baseMaxDepth;
  }

  this.applyDepthRange(newMin, newMax);
}

ZoomOut(): void {
  if (!this.initializedZoom) this.initZoomLimits();
  if (!this.initializedZoom) return;

  const zoomFactor = 4 / 5;
  const nextScale = this.currentScale * zoomFactor;

  if (nextScale >= this.minScale) {
    // ✅ normal zoom-out (canvas still >= window)
    this.currentScale = nextScale;
    this.logWidget.scale(this.currentScale);
  } else {
    // ✅ already at minimum scale (fit-to-window)
    // Keep scale at minScale so canvas never shrinks,
    // but expand the depth range instead.
    this.currentScale = this.minScale;
    this.logWidget.scale(this.currentScale);

    // Expand by a pad that feels natural (pick your step)
    // Option A: fixed step
    this.expandRangeBy(10);

    // Option B (better): proportional step based on current range
    // const range = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
    // this.expandRangeBy(Math.max(5, Math.round(range * 0.05)));
  }

  this.isAutoScroll = false;
}

ZoomIn(): void {
  if (!this.initializedZoom) this.initZoomLimits();
  if (!this.initializedZoom) return;

  const zoomFactor = 5 / 4;

  // zoom-in increases scale (always safe)
  this.currentScale = this.currentScale * zoomFactor;
  this.logWidget.scale(this.currentScale);

  // OPTIONAL: also shrink the depth range on zoom-in
  // (If you want zoom-in to reduce visible data range)
  this.shrinkRangeBy(10);

  this.isAutoScroll = false;
}
















//filter


ngOnInit(): void {
  this.token = '' + localStorage.getItem('token');
  this.wellForm = this.formBuilder.group({
    wells: this.formBuilder.array([]),
  });

  this.multiWellService.getAllWellList(this.token).subscribe({
    next: (data: any) => {
      this.wellOptions = data as Well[];

      // Prefill wells if storedData exists
      const storedData = JSON.parse(localStorage.getItem('multiWellFilterData') || '[]');
      if (storedData?.wells?.length) {
        storedData.wells.forEach((wellData: any) => {
          this.addWell(wellData);
        });
      }
    },
    error: (err) => console.error('Failed to load wells'),
  });
}



///////////////

addWell(prefillData?: any): void {
  const wellGroup = this.formBuilder.group({
    selectedWell: this.formBuilder.control<Well | null>(
      prefillData?.selectedWell || null,
      Validators.required
    ),
    selectedWellBore: [prefillData?.selectedWellBore || '', Validators.required],
    mnemonicList: this.formBuilder.array([]),
  });

  this.wells.push(wellGroup);
  const index = this.wells.length - 1;

  this.wellBoreOptions.push({ wellbores: [], SuppMsgOut: '' });
  this.wellBoreLogOptions.push({ depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' });
  this.mnemonicOptions[index] = [];

  // Fetch wellbores if prefilled well exists
  if (prefillData?.selectedWell) {
    this.fetchWllBoreOptions(index, prefillData.selectedWell);
  }

  // Subscribe to selectedWell changes
  wellGroup.get('selectedWell')?.valueChanges.subscribe((selectedWell) => {
    this.wellBoreOptions[index] = { wellbores: [], SuppMsgOut: '' };
    this.wellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' };
    wellGroup.get('selectedWellBore')?.setValue('');
    const mnemonicList = this.getMnemonics(index);
    mnemonicList.controls.forEach((mnemonic) => {
      mnemonic.get('selectedWellBoreLog')?.setValue('');
      mnemonic.get('mnemonic')?.setValue('');
    });

    if (!selectedWell) return;
    this.fetchWllBoreOptions(index, selectedWell as any);
  });

  // Subscribe to selectedWellBore changes
  wellGroup.get('selectedWellBore')?.valueChanges.subscribe((wellbore: any) => {
    this.wellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' };
    const mnemonicList = this.getMnemonics(index);
    mnemonicList.controls.forEach((mnemonic, mnemonicIdx) => {
      mnemonic.get('selectedWellBoreLog')?.setValue('');
      mnemonic.get('mnemonic')?.setValue('');
      this.mnemonicOptions[index][mnemonicIdx] = [];
    });

    const well = wellGroup.get('selectedWell')?.value as Well;
    if (!wellbore || !well) return;

    this.multiWellService
      .getWellBoreLogsList(this.token, well, wellbore, 'measured depth')
      .subscribe({
        next: (logsOptions) => {
          this.wellBoreLogOptions[index] = logsOptions as WellBoreLogsList;

          // Prefill mnemonics if data exists
          if (prefillData?.mnemonicList?.length) {
            prefillData.mnemonicList.forEach((mnData: any) => {
              this.addMnemonic(index, mnData);
            });
          }
        },
        error: (err) => console.log('error loading logs', err),
      });
  });

  // If prefillData has selectedWellBore but no valueChanges fired yet
  if (prefillData?.selectedWellBore) {
    wellGroup.get('selectedWellBore')?.setValue(prefillData.selectedWellBore);
  }
}



///////////////////

addMnemonic(index: number, prefillData?: any): void {
  const mnemonicGroup = this.formBuilder.group({
    selectedWellBoreLog: [prefillData?.selectedWellBoreLog || '', Validators.required],
    mnemonic: [prefillData?.mnemonic || '', Validators.required],
  });

  this.getMnemonics(index).push(mnemonicGroup);
  const mnemonicIndex = this.getMnemonics(index).length - 1;

  if (!this.mnemonicOptions[index]) this.mnemonicOptions[index] = [];

  mnemonicGroup.get('selectedWellBoreLog')?.valueChanges.subscribe((selectedLogData: any) => {
    this.mnemonicOptions[index][mnemonicIndex] = selectedLogData?.logCurveInfo || [];
    if (prefillData?.mnemonic) {
      mnemonicGroup.get('mnemonic')?.setValue(prefillData.mnemonic);
    } else {
      mnemonicGroup.get('mnemonic')?.setValue('');
    }
  });
}



// 1. Rename your variables to be distinct
openTimer: any;
closeTimer: any;
currentTrigger: MatMenuTrigger | undefined;

menuEnter(trigger: MatMenuTrigger) {
  // Stop any pending close actions from the past
  if (this.closeTimer) {
    clearTimeout(this.closeTimer);
  }

  // Stop any pending open actions (prevent double opening)
  if (this.openTimer) {
    clearTimeout(this.openTimer);
  }

  // If we moved from Card A to Card B, close Card A immediately
  if (this.currentTrigger && this.currentTrigger !== trigger) {
    this.currentTrigger.closeMenu();
  }

  // Start the 3-second countdown to OPEN
  this.openTimer = setTimeout(() => {
    this.currentTrigger = trigger;
    trigger.openMenu();
  }, 3000);
}

menuLeave(trigger: MatMenuTrigger) {
  // CRITICAL FIX: If the user leaves before 3s, KILL the open timer!
  if (this.openTimer) {
    clearTimeout(this.openTimer);
  }

  // Start the delay to CLOSE
  this.closeTimer = setTimeout(() => {
    trigger.closeMenu();
    if (this.currentTrigger === trigger) {
      this.currentTrigger = undefined;
    }
  }, 100);
}

buildWidgetsFromBackend(selectedWells: any[], backend: any) {
  this.widgetsData = selectedWells.map(sel => {

    // find matching wellbore from backend
    const backendWell = backend.wellboreObjects.find(w =>
      w.wellId === sel.well &&
      w.wellboreId === sel.wellbore
    );

    return {
      well: sel.well,
      wellbore: sel.wellbore,

      widgets: sel.mnemonics.map(m => {
        // GET curve from objectInfo
        const curve = backendWell?.objectInfo.find(c => c.mnemonic === m);

        return {
          mnemonic: m,
          unit: curve?.unit || "",
          value: curve?.data?.[curve.data.length - 1] ?? null, // latest sample
          logId: curve?.logId
        };
      })
    };
  });
}


////////////////////

buildWidgetsFromBackend(selectedWells: any[], backend: any) {
  this.widgetsData = selectedWells.map(sel => {

    const backendWell = backend.wellboreObjects.find(w =>
      w.wellId === sel.well &&
      w.wellboreId === sel.wellbore
    );

    return {
      well: sel.well,
      wellbore: sel.wellbore,

      widgets: sel.mnemonics.map(m => {

        const curve = backendWell?.objectInfo.find(c =>
          c.mnemonic === m &&
          c.logId === sel.logId      // ✔ correct field from your screenshot
        );

        return {
          mnemonic: m,
          unit: curve?.unit || "",
          value: curve?.data?.[curve.data.length - 1] ?? null,
          logId: curve?.logId
        };
      })
    };
  });
}






/**
   * 🔹 Build widgets dynamically using full log object
   * Uses last row of log data for each mnemonic.
   */
buildWidgetsDynamic(mnemonics: string[], logObject: any): any[] {
  const widgets: any[] = [];
  if (!logObject) {
    return widgets;
  }

  const curves = logObject.logCurveInfo || logObject.logInfo || [];
  const rows = logObject.logData?.data || logObject.data || [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return widgets;
  }

  const latestRow = rows[rows.length - 1];

  mnemonics.forEach((mn) => {
    const curveMeta = curves.find((c: any) =>
      (c.mnemonic || c.mnemonicId) === mn
    );
    if (!curveMeta) {
      return;
    }

    const colIdx = curveMeta.columnIndex ?? curveMeta.index ?? null;
    if (colIdx == null || colIdx < 0 || colIdx >= latestRow.length) {
      return;
    }

    const value = latestRow[colIdx];

    widgets.push({
      label: mn,
      value,
      unit: curveMeta.unit || '',
      color: this.getColorByMnemonic(mn)
    });
  });

  return widgets;

// mwid 

/**  Build widgets with last values from wellService */
buildWidgetsFromMnemonicsWithValues(logData: any, mnemonics: string[]): any[] {
    return mnemonics.map((mnemonic, i) => {
      const [value, unit] = this.wellService.getMnemoicValueAndUnit(logData, mnemonic) || [0, ''];
      return {
        type: this.getWidgetType(i),
        label: mnemonic,
        value,              // ✅ last value of curve
        unit,
        color: this.getColorByIndex(i)
      };
    });
  }
  


/// multiw
ngOnInit(): void {
    // ✅ Only set default wells if BehaviorSubject is empty
    const current = this.staticTemplateSharedService.getMultiWellFilterData();
    if (!current.wells || current.wells.length === 0) {
      console.log('Initializing default wells...');
      this.staticTemplateSharedService.setMultiWellFilterData(this.selectedWells);
    }
  
    // Subscribe to reactive updates (keep as-is)
    this.staticTemplateSharedService.multiWellFilterData$.subscribe((data: any) => {
      this.filteredData = data;
      if (this.filteredData?.wells?.length > 0) {
        console.log('Received wells from shared service:', this.filteredData);
        this.processGraphData(this.filteredData);
      }
    });
  }

/////
/// multiw


addWell() {
    const currentSelection = this.staticTemplateSharedService.getMultiWellFilterData();
    this.dialogRef = this.dialog.open(MultiWellFilterComponent, {
      width: "80%",
      height: "80vh",
      data: currentSelection,
    });
  }



  //////////// multiw

  UpdateGuageValue(dynamicWells: any[]): void {
    if (!dynamicWells || dynamicWells.length === 0) return;
  
    if (this.staticTemplateSharedService.surveyData?.trajectoryStation) {
      this.surveyData = this.staticTemplateSharedService.surveyData.trajectoryStation;
    }
  
    if (this.staticTemplateSharedService.wellboreObject) {
      this.isUpdateGuageRunning = true;
      let logObjects: any[] = this.staticTemplateSharedService.wellboreObject;
      let logObject = logObjects.find(
        (x) => x.objectName == this.wellService.getLogObjectFullName("LWD_Time")
      );
  
      if (!logObject) return;
  
      let logID = logObject.objectId;
      let min = new Date(logObject.endIndex);
      min.setHours(min.getHours() - 3);
  
      let startval =
        formatDate(min, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") + ".000z";
  
      // ✅ Loop through each selected well
      dynamicWells.forEach((wellItem: any) => {
        let queryParameter: ILogDataQueryParameter = {
          wellUid: wellItem.well,
          logUid: logID,
          wellboreUid: wellItem.wellbore,
          logName: logObject.objectName,
          indexType: logObject.indexType,
          indexCurve: logObject.indexCurve,
          startIndex: startval,
          endIndex: logObject.endIndex,
          isGrowing: logObject.objectGrowing,
          mnemonicList: wellItem.mnemonics.join(","), // now per-well
        };
  
        this.wellService.getLogData(queryParameter).subscribe((response) => {
          let logData: any = response;
  
          if (!logData?.logs?.[0]?.logData) return;
          const logInfo = logData.logs[0].logData;
  
          // ✅ Loop through mnemonics per well
          wellItem.mnemonics.forEach((mnemonic: string) => {
            let values = this.wellService.getMnemoicValueAndUnit(logInfo, mnemonic);
            console.log(`Values for ${wellItem.well} - ${mnemonic}:`, values);
  
            if (mnemonic === "PRO_L") {
              this.depthGuageValue = values[0];
              this.depthGuageUnit = values[1];
              const depthObj = this.cardsConfig.find(
                (item) => item.label === this.depthGuageLabel
              );
              if (depthObj) {
                depthObj["value"] = this.depthGuageValue;
                depthObj["unit"] = this.depthGuageUnit;
                depthObj["color"] = this.depthGuageColor;
              }
            }
          });
  
          // ✅ Update fixed gauges
          let bitDepthValues = this.wellService.getMnemoicValueAndUnit(logInfo, "BITDEPTH");
          this.bitDepthGuageValue = bitDepthValues[0];
          this.bitDepthGuageUnit = bitDepthValues[1];
          const bitDepthObj = this.cardsConfig.find(
            (item) => item.label === this.bitDepthGuageLabel
          );
          if (bitDepthObj) {
            bitDepthObj["value"] = this.bitDepthGuageValue;
            bitDepthObj["unit"] = this.bitDepthGuageUnit;
            bitDepthObj["color"] = this.bitDepthGuageColor;
          }
  
          // TVD, Azimuth, etc. (same as your current logic)
          let TVDValues = this.wellService.getMnemoicValueAndUnit(logInfo, "TVD");
          this.tvdValue = TVDValues[0];
          this.tvdUnit = TVDValues[1];
          const TVDDepthObj = this.cardsConfig.find(
            (item) => item.label === this.tvdGuageLabel
          );
          if (TVDDepthObj) {
            TVDDepthObj["value"] = this.tvdValue;
            TVDDepthObj["unit"] = this.tvdUnit;
            TVDDepthObj["color"] = this.tvdGuageColor;
          }
  
          // Block position
          let blockPositionValues = this.wellService.getMnemoicValueAndUnit(logInfo, "BPOS");
          this.bposGuageValue = blockPositionValues[0];
          this.bposGuageUnit = blockPositionValues[1];
          this.columnChartsConfig[0].chartValue = `${this.bposGuageValue}${this.bposGuageUnit}`;
          this.columnChartsConfig[0].chartLabel = this.bposGuageLabel;
          this.columnChartsConfig = [...this.columnChartsConfig];
        });
      });
  
      this.isUpdateGuageRunning = false;
    }
  }


  /// filterC

  ngOnInit(): void {
   
   const previousData = this.sharedService.getMultiWellFilterData();
//    if (previousData?.wells?.length > 0) {
//      previousData.wells.forEach((wellObj: any) => {
//        this.addWell(); // create form structure
//        const index = this.wells.length - 1;
 
//        this.wells.at(index).patchValue({
//          selectedWell: wellObj.selectedWell || null,
//          selectedWellBore: wellObj.selectedWellBore || "",
//        });
 
//        if (wellObj.mnemonicList?.length) {
//          wellObj.mnemonicList.forEach((mnemonic: any) => {
//            this.addMnemonic(index);
//            const mnIndex = this.getMnemonics(index).length - 1;
//            this.getMnemonics(index)
//              .at(mnIndex)
//              .patchValue({
//                selectedWellBoreLog: mnemonic.selectedWellBoreLog,
//                mnemonic: mnemonic.mnemonic,
//              });
//          });
//        }
//      });
//    }
if (previousData?.wells?.length > 0) {
    previousData.wells.forEach((wellObj: any) => {
      this.addWell(); // create form structure
      const index = this.wells.length - 1;
  
      // Patch basic form values
      this.wells.at(index).patchValue({
        selectedWell: wellObj.selectedWell || null,
        selectedWellBore: wellObj.selectedWellBore || '',
      });
  
      // ✅ Trigger loading of WellBore options based on selected well
      if (wellObj.selectedWell) {
        this.fetchWllBoreOptions(index, wellObj.selectedWell);
      }
  
      // ✅ Trigger loading of WellBore logs for selected WellBore
      if (wellObj.selectedWell && wellObj.selectedWellBore) {
        this.multiWellService
          .getWellBoreLogsList(this.token, wellObj.selectedWell, wellObj.selectedWellBore, 'measured depth')
          .subscribe({
            next: (logsOptions) => {
              this.wellBoreLogOptions[index] = logsOptions as any;
  
              // ✅ Restore mnemonics if available
              if (wellObj.mnemonicList?.length) {
                wellObj.mnemonicList.forEach((mnemonic: any) => {
                  this.addMnemonic(index);
                  const mnIndex = this.getMnemonics(index).length - 1;
                  this.getMnemonics(index)
                    .at(mnIndex)
                    .patchValue({
                      selectedWellBoreLog: mnemonic.selectedWellBoreLog,
                      mnemonic: mnemonic.mnemonic,
                    });
                });
              }
            },
            error: (err) => console.error('Error loading logs for restored well:', err),
          });
      }
    });
  }
  
  
  
}


//////////////
MultiComponent.ngOnInit():
ngOnInit(): void {
    this.buildWellsData(this.selectedWells);
    this.staticTemplateSharedService.setMultiWellFilterData(this.selectedWells);
  
    this.staticTemplateSharedService.multiWellFilterData$.subscribe((data: any) => {
      this.filteredData = data;
      if (this.filteredData) {
        console.log('filter data after subscribe ', this.filteredData.length);
        this.processGraphData(this.filteredData);
      }
    });
  
    // ✅ Add this block
    const previousData = this.staticTemplateSharedService.getMultiWellFilterData();
    if (previousData?.wells?.length > 0) {
      console.log('Loading previously selected wells into multiwell component');
      this.processGraphData(previousData);
    }
  
    this.intervalTimer = setInterval(() => {
      // existing interval logic
    }, 1000 * 10 * 0.2);
  }
  
  
