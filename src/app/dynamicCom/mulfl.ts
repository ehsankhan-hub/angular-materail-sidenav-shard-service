

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
  
  
