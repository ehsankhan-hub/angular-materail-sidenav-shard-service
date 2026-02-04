import { Component } from '@angular/core';

@Component({
  selector: 'app-generate-t',
  standalone: true,
  imports: [],
  templateUrl: './generate-t.component.html',
  styleUrl: './generate-t.component.css'
})
export class GenerateTComponent {

  // Add 'direction' as the last parameter with a default value
getLogData(
  selectedlogObject: any,
  logIndex: number,
  isLive: boolean,
  trackIndex: number = -1,
  curveIndex: number = -1,
  mnemonicId: string = '',
  startDepth: string = '',
  isFromSlider: boolean = false,
  direction: 'append' | 'prepend' = 'append' // NEW PARAMETER
) {
  // 1. Logic to define parameters
  const isDepth = selectedlogObject.isDepth;
  const queryParameter: ILogDataQueryParameter = {
    wellId: selectedlogObject.wellId,
    wellboreId: selectedlogObject.wellboreId,
    logId: selectedlogObject.objectId,
    start: startDepth !== '' ? startDepth : (isLive ? this.indexCurveDepth[this.indexCurveDepth.length - 1]?.toString() : ''),
    end: '', // Let API return next available chunk
    isDepthBase: isDepth
  };

  this.wellService.getLogData(queryParameter).subscribe({
    next: (response: any) => {
      const logData: any = response;
      if (!logData.logs?.[0]?.logData?.data) return;

      const rawDataRows: any[] = logData.logs[0].logData.data;
      const mnemonics = String(logData.logs[0].logData.mnemonicList).split(',');
      const mainIndexMnemonic = selectedlogObject.indexCurve;

      mnemonics.forEach((mId, mIdx) => {
        selectedlogObject.objectInfo.forEach((info: any) => {
          if (info.mnemonicId === mId) {
            
            // Clean data only on very first load
            if (this.isFirstTimeLoading && direction === 'append') info.data = [];

            rawDataRows.forEach((row) => {
              const rowVals = String(row).split(',');
              const val = rowVals[mIdx];
              const finalVal = (val === '' || val === undefined) ? Number.NaN : val;

              if (direction === 'prepend') {
                info.data.unshift(finalVal); // Add to top
                if (mId === mainIndexMnemonic) this.indexCurveDepth.unshift(Number(finalVal));
              } else {
                info.data.push(finalVal); // Add to bottom
                if (mId === mainIndexMnemonic) this.indexCurveDepth.push(Number(finalVal));
              }
            });
          }
        });
      });

      // Update the chart view
      this.updateChartBoundaries(direction);
      this.isFirstTimeLoading = false;
      this.cdr.detectChanges();
    }
  });
}


/////////

setupScrollListener() {
  if (!this.logWidget) return;

  const container = this.logWidget.getTrackContainer();
  container.addEventListener('VisibleLimitsChanged', () => {
    const visible = container.getVisibleLimits();
    const model = container.getModelLimits();

    // If user scrolls to the top (within 10 pixels of the start)
    if (visible.getTop() <= model.getTop() + 10 && !this.showLoading) {
      this.showLoading = true; // Prevents duplicate calls
      
      // Calculate history depth (e.g., fetch previous 1000 units)
      const currentStart = this.indexCurveDepth[0];
      const historyStart = currentStart - 1000;

      this.wellboreObjects.forEach((obj, idx) => {
        this.getLogData(obj, idx, false, -1, -1, '', historyStart.toString(), false, 'prepend');
      });
    }
  });
}

////////////

updateChartBoundaries(direction: 'append' | 'prepend') {
  if (!this.logWidget) return;

  const minDepth = this.indexCurveDepth[0];
  const maxDepth = this.indexCurveDepth[this.indexCurveDepth.length - 1];

  // 1. Update the Model Limits (The "World" size)
  // This tells the scrollbar how long the whole log is
  this.logWidget.getTrackContainer().setModelLimits(
    new geotoolkit.util.Rect(0, minDepth, 0, maxDepth)
  );

  // 2. Handle Auto-Scroll for Live Data
  if (direction === 'append' && this.isAutoScroll) {
    // If scrollToLocation isn't working, we use the last index
    const lastIndex = this.indexCurveDepth.length - 1;
    if (lastIndex >= 0) {
      // scrollToIndex moves the view to the row number provided
      this.logWidget.scrollToIndex(lastIndex);
    }
  }
}
/////////////




}
