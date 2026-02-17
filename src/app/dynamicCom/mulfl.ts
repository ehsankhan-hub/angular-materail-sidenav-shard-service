getLogData(
  selectedlogObject: IWellboreObject,
  logIndex: number,
  isLiveData: boolean = false,
  trackIndex: number = -1,
  curveIndex: number = -1,
  pSelectedMnemonic: string = '',
  callback?: () => void
) {
  let startval: any;
  let endval: any;
  let isDepth = false;
  let tempMDforTvd: any[] = [];
  console.log('isLiveData --', isLiveData);

  // EXTRACT NUMERIC VALUES FROM WITSML INDEX OBJECTS
  const currentStartIndex = typeof selectedlogObject.startIndex === 'object' 
    ? Number(selectedlogObject.startIndex['#text']) 
    : Number(selectedlogObject.startIndex);
  
  const currentEndIndex = typeof selectedlogObject.endIndex === 'object' 
    ? Number(selectedlogObject.endIndex['#text']) 
    : Number(selectedlogObject.endIndex);

  if (selectedlogObject.isDepth) {
    isDepth = true;

    if (this.swtichToTvd) {
      if (this.trajectoryData && this.trajectoryData.trajectoryStation) {
        this.indexCurveTVD = [];
        let trajectoryStation: any[] = this.trajectoryData.trajectoryStation;
        trajectoryStation.forEach((trajectory) => {
          this.indexCurveTVD.push(Number(parseFloat(trajectory.tvd).toFixed(2)));
          tempMDforTvd.push(Number(parseFloat(trajectory.md).toFixed(2)));
        });
        startval = this.indexCurveTVD[0];
        if (this.lastselectedTvdVal != this.indexCurveTVD[this.indexCurveTVD.length - 1]) {
          endval = this.indexCurveTVD[this.indexCurveTVD.length - 1];
          this.lastselectedTvdVal = this.indexCurveTVD[this.indexCurveTVD.length - 1];
        }
      }
    } 
    else if (this.isFirstTimeLoading) {
      // INITIAL LOAD: Get the most recent 2000 units (Live end)
      endval = currentEndIndex;
      startval = Math.max(currentStartIndex, currentEndIndex - 2000); 
      console.log('Initial Load (Bottom): startval', startval, 'endval ', endval);
    } 
    else if (isLiveData) {
      // LIVE UPDATE: Get from the last point we have +0.01
      const lastPoint = this.indexCurveDepth.length > 0 
        ? this.indexCurveDepth[this.indexCurveDepth.length - 1] 
        : currentEndIndex;
      
      startval = lastPoint + 0.01;
      endval = currentEndIndex + 2000;
      console.log('Live update: startval', startval, 'endval ', endval);
    } 
    else {
      // HISTORICAL: User scrolled up, get 2000 units before the current top
      const firstPoint = this.indexCurveDepth.length > 0 
        ? this.indexCurveDepth[0] 
        : currentEndIndex;
        
      endval = firstPoint;
      startval = Math.max(currentStartIndex, firstPoint - 2000);
      console.log('Historical scroll: startval', startval, 'endval ', endval);
    }
  } else {
    // Time-based logic
    let mindate = new Date();
    let currDate = new Date();
    let lastRigtime = new Date(selectedlogObject.endIndex);
    
    if (this.isFirstTimeLoading || (!isLiveData && this.indexCurveTime[0] <= selectedlogObject.endIndex)) {
      mindate = lastRigtime;
      mindate.setHours(lastRigtime.getHours() - this.selectedHour);
      this.indexCurveTime = [];
    } else if (this.indexCurveTime[0] <= selectedlogObject.endIndex) {
      mindate = new Date(selectedlogObject.endIndex);
      mindate.setSeconds(mindate.getSeconds() + 1);
    }
    this.lastselectedDate = currDate;
    startval = formatDate(mindate, 'yyyy-MM-ddTHH:mm:ss', 'en', 'GMT') + '.000z';
    endval = formatDate(currDate, 'yyyy-MM-ddTHH:mm:ss', 'en', 'GMT') + '.000z';
  }

  if ((!startval && startval != 0) || (!endval && endval != 0)) {
    this.showLoading = false;
    this.isLiveTracking = false;
    return;
  }

  let queryParameter: ILogDataQueryParameter = {
    wellUid: selectedlogObject.wellId,
    logUid: selectedlogObject.objectId,
    wellboreUid: selectedlogObject.wellboreId,
    logName: selectedlogObject.objectName,
    indexType: selectedlogObject.indexType,
    indexCurve: selectedlogObject.indexCurve,
    startIndex: startval,
    endIndex: endval,
    isGrowing: selectedlogObject.objectGrowing,
    mnemonicList: '',
  };

  this.wellService.getLogData(queryParameter).subscribe(
    (response: any) => {
      if (queryParameter?.logName?.includes('MLG_DRILLRMK_TIME')) {
        this.handleRemarksData(response, 'drill-remarks');
        return;
      }
      if (queryParameter?.logName?.includes('MLG_GASRMK_TIME')) {
        this.handleRemarksData(response, 'gas-remarks');
        return;
      }

      let logData: any = response;
      if (logData.code !== undefined && logData.code == '404') {
        this.showToast('Response', logData.message);
        this.showLoading = false;
        this.isLiveTracking = false;
        return;
      }

      if (!logData.logs || !Array.isArray(response.logs[0].logData.data)) {
        this.showLoading = false;
        this.isLiveTracking = false;
        return;
      }

      var x: [] = response.logs[0].logData.data;

      // Logic: If it's a historical scroll (not first load, not live), we use UNSHIFT
      const isHistorical = !this.isFirstTimeLoading && !isLiveData;

      if (selectedlogObject.isDepth) {
        selectedlogObject.endIndex = logData.logs[0].endIndex;
      } else {
        selectedlogObject.endIndex = logData.logs[0].endDateTimeIndex;
      }

      var unitList: any[] = String(logData.logs[0].logData.unitList).split(',');

      String(logData.logs[0].logData.mnemonicList)
        .split(',')
        .map((val, mindex) => {
          selectedlogObject.objectInfo.forEach(
            (mnemonicInfo, mnemonicIndex) => {
              if (mnemonicInfo.mnemonicId == val) {
                if (this.swtichToTvd) {
                  selectedlogObject.objectInfo[mnemonicIndex].data = [];
                }
                
                x.forEach((row) => {
                  String(row)
                    .split(',')
                    .map((val, dataIndex) => {
                      if (dataIndex == mindex) {
                        let processedVal: any;
                        if (val == '' || val == undefined) {
                          if (selectedlogObject.objectInfo[mnemonicIndex].data.length > 0) {
                            // If historical, take the value from index 0. If live, take the last index.
                            let refIdx = isHistorical ? 0 : selectedlogObject.objectInfo[mnemonicIndex].data.length - 1;
                            processedVal = selectedlogObject.objectInfo[mnemonicIndex].data[refIdx];
                          } else {
                            processedVal = Number.NaN;
                          }
                        } else {
                          processedVal = val;
                        }

                        // THE KEY CHANGE: UNSHIFT vs PUSH
                        if (isHistorical) {
                          selectedlogObject.objectInfo[mnemonicIndex].data.unshift(processedVal);
                        } else {
                          selectedlogObject.objectInfo[mnemonicIndex].data.push(processedVal);
                        }

                        selectedlogObject.objectInfo[mnemonicIndex].unit = unitList[mindex];
                        
                        if (mnemonicInfo.mnemonicId == selectedlogObject.indexCurve) {
                          if (isDepth) {
                            if (isHistorical) {
                              this.indexCurveDepth.unshift(Number(val));
                            } else {
                              this.indexCurveDepth.push(Number(val));
                            }
                          }
                        }
                      }
                    });
                });
              }
            }
          );
        });

      if (this.swtichToTvd) {
        let indexArray: any[] = [];
        tempMDforTvd.forEach((val) => {
          let findIndex = this.indexCurveDepth.findIndex(
            (e) => e == val || (e - val < 1 && e - val > 0)
          );
          if (findIndex > -1) {
            indexArray.push(findIndex);
          }
        });
        selectedlogObject.objectInfo.forEach((mnemonic, index) => {
          let tempCurveTvdData: any[] = [];
          if (mnemonic.mnemonic != selectedlogObject.indexCurve) {
            indexArray.forEach((indexVal) => {
              if (mnemonic.data.length > indexVal) {
                tempCurveTvdData.push(mnemonic.data[indexVal]);
              }
            });
            selectedlogObject.objectInfo[index].data = tempCurveTvdData;
            selectedlogObject.objectInfo[index].min = this.getMinValue(tempCurveTvdData);
            selectedlogObject.objectInfo[index].max = this.getMaxValue(tempCurveTvdData);
          }
        });
      } else {
        selectedlogObject.objectInfo.forEach((mnemonic, index) => {
          if (mnemonic.mnemonic != selectedlogObject.indexCurve) {
            selectedlogObject.objectInfo[index].min = this.getMinValue(mnemonic.data);
            selectedlogObject.objectInfo[index].max = this.getMaxValue(mnemonic.data);
          }
        });
      }

      this.wellboreObjects[logIndex] = selectedlogObject;

      var logID = this.wellService.getLogObjectFullName(this.lstOfTrack[0].curves[0].LogId);
      if (selectedlogObject.objectId == logID) {
        if (selectedlogObject.isDepth && logID.includes('Surface_Depth')) {
          this.staticTemplateSharedService.dataDepth = selectedlogObject.objectInfo;
        } else if (logID.includes('Surface_Time')) {
          this.staticTemplateSharedService.dataTime = selectedlogObject.objectInfo;
        }
      }

      selectedlogObject.objectInfo.forEach((val) => {
        if (!selectedlogObject.isDepth && val.mnemonicId.toLowerCase() == 'depth') {
          this.indexCurveTimeDepthForShowMarker = val.data;
        }
        this.lstOfTrack.forEach((track, trackIndex) => {
          track.curves.forEach((curve, index) => {
            if (curve.mnemonicId == val.mnemonicId) {
              this.lstOfTrack[trackIndex].curves[index].data = val.data;
              if (this.lstOfTrack[trackIndex].curves[index].autoScale) {
                this.lstOfTrack[trackIndex].curves[index].min = val.min;
                this.lstOfTrack[trackIndex].curves[index].max = val.max;
              }
              this.lstOfTrack[trackIndex].curves[index].mnemonic = val.mnemonic;
              this.lstOfTrack[trackIndex].curves[index].isDepth = selectedlogObject.isDepth;
              this.lstOfTrack[trackIndex].curves[index].unit = val.unit;
              this.lstOfTrack[trackIndex].curves[index].mnemonicList = val.mnemonicLst;
            }
          });
        });
      });

      if (callback) {
        callback();
      }
      
      this.drawPlot();
      this.createScene();
      this.showLoading = false;
      this.isLiveTracking = false;
      
      if (this.isFirstTimeLoading) {
        this.isFirstTimeLoading = false;
        this.cdr.detectChanges();
      }
    },
    (error) => {
      this.showLoading = false;
      this.isLiveTracking = false;
      this.showToast('Error On Retreiving', 'Error Reteriving Curve Info ' + error);
    }
  );
}
////////////////////



/* 1. Ensure the item itself always has a solid background */
.accordion-item {
  margin-bottom: 8px !important;
  border: none !important;
  background-color: #2b2b2b !important; /* Your dark grey/blue */
  border-radius: 4px !important;
}

/* 2. Fix the background when the track is OPEN/EXPANDED */
.accordion-button:not(.collapsed) {
  background-color: #333333 !important; /* Keep it dark when open */
  color: #00ffcc !important;            /* Green text like your theme */
  box-shadow: none !important;          /* Removes the glowing blue focus ring */
}

/* 3. Fix the background color when the track is CLOSED */
.accordion-button.collapsed {
  background-color: #2b2b2b !important; 
  color: white !important;
}

/* 4. Remove the "Blue Flash" or "Focus" outline when clicking */
.accordion-button:focus {
  z-index: 3;
  outline: 0;
  box-shadow: none !important;
  background-color: #333333 !important; 
}

/* 5. Ensure the inner body also has the background color */
.accordion-collapse {
  background-color: #2b2b2b !important;
}

///////////////////////
/* ===============================
   Dialog container sizing
   =============================== */
   :host {
    display: block;
    height: 100%;
  }
  
  /* Ensure dialog content scrolls, not the whole page */
  ::ng-deep .mat-mdc-dialog-content {
    padding: 0 !important;
    overflow: hidden !important;
  }
  
  /* ===============================
     Tabs area scrolling
     =============================== */
  .tab-content {
    height: 100%;
    overflow: hidden;
  }
  
  /* Track tab: scroll inside */
  #tracksWithCard {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(85vh - 220px);
  }
  
  /* General tab: scroll inside */
  #generalWithCard {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(85vh - 220px);
  }
  
  /* ===============================
     Accordion spacing fixes
     =============================== */
  .accordion-button {
    padding: 0.75rem 1rem;
  }
  
  .accordion-body {
    padding: 0.75rem 1rem;
  }
  
  /* ===============================
     File manager toolbar
     =============================== */
  .file-manager-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  /* ===============================
     Action icons (reuse existing)
     =============================== */
  .action-icon-container {
    cursor: pointer;
  }
  
  /* ===============================
     Dialog footer buttons
     =============================== */
  ::ng-deep .mat-mdc-dialog-actions {
    padding: 12px 16px;
    border-top: 1px solid #e0e0e0;
  }
  
  /* ===============================
     Responsive tweaks
     =============================== */
  @media (max-width: 768px) {
    #tracksWithCard,
    #generalWithCard {
      max-height: calc(85vh - 180px);
    }
  }
  

////////////////
import { MatDialog } from '@angular/material/dialog';
import { TrackConfigDialogComponent } from './track-config-dialog/track-config-dialog.component'; // adjust path

constructor(
  private dialog: MatDialog,
  private cdr: ChangeDetectorRef,
  // keep your other injections
) {}

OpenCardConfiguration(): void {
  const dialogRef = this.dialog.open(TrackConfigDialogComponent, {
    width: '900px',
    maxWidth: '95vw',
    height: '85vh',
    data: {
      lstOfTrack: JSON.parse(JSON.stringify(this.lstOfTrack)), // ✅ deep copy
      selectedLog: this.selectedLog,

      wellboreObjects: this.wellboreObjects,
      lstTrackTypes: this.lstTrackTypes,
      lstLineStyle: this.lstLineStyle,
      anchorTypes: this.anchorTypes,

      selectedHour: this.selectedHour,
      lstHourss: this.lstHourss,
      selectedDepth: this.selectedDepth,
      hideHeader: this.hideHeader,
      swtichToTvd: this.swtichToTvd,
      showSurvey: this.showSurvey,
      isFitToheight: this.isFitToheight,
      isAutoScroll: this.isAutoScroll,
      horizontalOrientaion: this.horizontalOrientaion,
      IntervalStep: this.IntervalStep,
    },
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (!result) return; // ✅ Cancel

    this.lstOfTrack = result.lstOfTrack;
    this.selectedLog = result.selectedLog;

    this.selectedHour = result.selectedHour;
    this.selectedDepth = result.selectedDepth;
    this.hideHeader = result.hideHeader;
    this.swtichToTvd = result.swtichToTvd;
    this.showSurvey = result.showSurvey;
    this.isFitToheight = result.isFitToheight;
    this.isAutoScroll = result.isAutoScroll;
    this.horizontalOrientaion = result.horizontalOrientaion;
    this.IntervalStep = result.IntervalStep;

    // Important: Comments tracks need comments loaded after Apply
    this.lstOfTrack.forEach((t: any, idx: number) => {
      if (t.trackType === 'Comments') {
        this.getComments(idx);
      }
    });

    // ✅ one refresh only
    this.drawPlot();
    this.createScene();
    this.cdr.detectChanges();
  });
}



//////////////////////
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ITracks } from '../../../models/chart/tracks';            // ✅ adjust relative path if needed
import { IMnemonic } from '../../../models/wellbore/wellbore-object'; // ✅ adjust relative path if needed
import { WellDataService } from '../../../services/well-service/well.service'; // ✅ adjust path

@Component({
  selector: 'app-track-config-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './track-config-dialog.component.html',
})
export class TrackConfigDialogComponent {
  // ---- Track tab data (same names you use in RTD HTML) ----
  lstOfTrack: ITracks[] = [];
  selectedLog: any = '';
  wellboreObjects: any[] = [];
  lstTrackTypes: any[] = [];
  lstLineStyle: any[] = [];
  anchorTypes: any[] = [];

  // ---- General tab data (same names you use in RTD HTML) ----
  showLoading = false;
  selectedHour: any;
  lstHourss: any[] = [];
  selectedDepth: any;
  hideHeader = false;
  swtichToTvd = false;
  showSurvey = false;
  isFitToheight = false;
  isAutoScroll = false;
  horizontalOrientaion = false;
  IntervalStep: any;

  // If you need it
  callingFrom: string = '';

  constructor(
    private ref: MatDialogRef<TrackConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public wellService: WellDataService
  ) {
    // Tracks
    this.lstOfTrack = data.lstOfTrack ?? [];
    this.selectedLog = data.selectedLog ?? '';
    this.wellboreObjects = data.wellboreObjects ?? [];
    this.lstTrackTypes = data.lstTrackTypes ?? [];
    this.lstLineStyle = data.lstLineStyle ?? [];
    this.anchorTypes = data.anchorTypes ?? [];

    // General
    this.selectedHour = data.selectedHour;
    this.lstHourss = data.lstHourss ?? [];
    this.selectedDepth = data.selectedDepth;
    this.hideHeader = !!data.hideHeader;
    this.swtichToTvd = !!data.swtichToTvd;
    this.showSurvey = !!data.showSurvey;
    this.isFitToheight = !!data.isFitToheight;
    this.isAutoScroll = !!data.isAutoScroll;
    this.horizontalOrientaion = !!data.horizontalOrientaion;
    this.IntervalStep = data.IntervalStep;

    this.callingFrom = data.callingFrom ?? '';
  }

  // =========================================================
  // ✅ YOUR SAME METHODS (Apply-only: NO drawPlot/createScene)
  // =========================================================

  NewTrack(isIndex = false) {
    let track: ITracks = {
      trackName: this.selectedLog,
      trackNo: this.lstOfTrack.length + 1,
      curves: [],
      trackType: 'Linear',
      isIndex: isIndex,
      isDepth: false,
      isMudLog: false,
      isImage: false,
      comments: [],
    } as any;

    this.lstOfTrack.push(track);
    // ❌ No drawPlot/createScene here (Apply-only)
  }

  AddNewMnemonic(trackNo: number) {
    this.lstOfTrack.forEach((val: any, index: number) => {
      if (val.trackNo == trackNo) {
        let curveInfo = this.wellService.GetDefaultMnemonic(
          this.lstOfTrack.length > 0
            ? (this.lstOfTrack as any)[Number(index)].curves.length + 1
            : 0
        );
        (this.lstOfTrack as any)[index].curves.push(curveInfo);
      }
    });
  }

  DeleteTrack(trackNo: number) {
    if (confirm('Are you sure for deleting track')) {
      let index = this.lstOfTrack.findIndex((obj: any) => obj.trackNo == trackNo);
      if (index < 0) return;

      this.lstOfTrack.splice(index, 1);

      // Keep numbering stable
      this.lstOfTrack.forEach((t: any, i: number) => (t.trackNo = i + 1));
    }
  }

  RemoveMnemonic(trackNo: number, displayOrder: number, mnemonicId: string) {
    if (confirm('Are you sure for deleting curve')) {
      let index = this.lstOfTrack.findIndex((obj: any) => obj.trackNo == trackNo);
      if (index < 0) return;

      let curveIndex = (this.lstOfTrack as any)[index].curves.findIndex(
        (cur: any) => cur.mnemonicId == mnemonicId
      );
      if (curveIndex < 0) return;

      (this.lstOfTrack as any)[index].curves.splice(curveIndex, 1);
    }
  }

  selectedTrack(pSelectedTrack: any, trackIndex: number) {
    (this.lstOfTrack as any)[trackIndex].isIndex = false;
    (this.lstOfTrack as any)[trackIndex].isMudLog = false;
    (this.lstOfTrack as any)[trackIndex].comments = [];

    switch (pSelectedTrack.target.value) {
      case 'Index':
        (this.lstOfTrack as any)[trackIndex].isIndex = true;
        break;
      case 'Mudlog':
        (this.lstOfTrack as any)[trackIndex].isMudLog = true;
        break;
      case 'Image':
        (this.lstOfTrack as any)[trackIndex].isImage = true;
        break;
      case 'Comments':
        // Apply-only: do NOT call getComments here
        break;
    }
  }

  SaveTrackInfo() {
    // Apply-only mode: Save does nothing inside dialog.
    // RealTimeDisplay will redraw after Apply.
  }

  MoveUpTrack(_trackNo: number, trackIndex: number) {
    if (trackIndex == 0) return;

    (this.lstOfTrack as any)[trackIndex].trackNo =
      (this.lstOfTrack as any)[trackIndex - 1].trackNo;

    (this.lstOfTrack as any)[trackIndex - 1].trackNo =
      (this.lstOfTrack as any)[trackIndex - 1].trackNo + 1;

    this.lstOfTrack = this.lstOfTrack.sort((x: any, y: any) =>
      x.trackNo > y.trackNo ? 1 : x.trackNo < y.trackNo ? -1 : 0
    );
  }

  MoveDownTrack(_trackNo: number, trackIndex: number) {
    if (trackIndex == this.lstOfTrack.length - 1) return;

    (this.lstOfTrack as any)[trackIndex].trackNo =
      (this.lstOfTrack as any)[trackIndex + 1].trackNo;

    (this.lstOfTrack as any)[trackIndex + 1].trackNo =
      (this.lstOfTrack as any)[trackIndex + 1].trackNo - 1;

    this.lstOfTrack = this.lstOfTrack.sort((x: any, y: any) =>
      x.trackNo > y.trackNo ? 1 : x.trackNo < y.trackNo ? -1 : 0
    );
  }

  selectedLogEvent(pSelectedLog: any, trackNo: number, curveDisplayOrder: number) {
    let selectedlogObject: any;
    let logIndex: number = -1;

    this.wellboreObjects.forEach((val: any, _logIndex: number) => {
      if (val.objectId == pSelectedLog.target.value) {
        selectedlogObject = val;
        logIndex = _logIndex;
        return;
      }
    });

    // ✅ FIX: must allow index 0
    if (logIndex >= 0) {
      let trackIndex = this.lstOfTrack.findIndex((obj: any) => obj.trackNo == trackNo);
      let curveIndex = (this.lstOfTrack as any)[trackIndex].curves.findIndex(
        (obj: any) => obj.displayOrder == curveDisplayOrder
      );

      (this.lstOfTrack as any)[trackIndex].curves[curveIndex].mnemonicLst = [];
      (this.lstOfTrack as any)[trackIndex].curves[curveIndex].wellId =
        this.wellboreObjects[logIndex].wellId;
      (this.lstOfTrack as any)[trackIndex].curves[curveIndex].wellboreId =
        this.wellboreObjects[logIndex].wellboreId;
      (this.lstOfTrack as any)[trackIndex].curves[curveIndex].LogId =
        pSelectedLog.target.value;
      (this.lstOfTrack as any)[trackIndex].curves[curveIndex].mnemonicId = '';

      this.wellboreObjects[logIndex].objectInfo.forEach((obj: any) => {
        if (this.wellboreObjects[logIndex].indexCurve != obj.mnemonic) {
          let mnemonic: IMnemonic = {
            mnemonicDescp: obj.mnemonic,
            mnemonicId: obj.mnemonicId,
          };
          (this.lstOfTrack as any)[trackIndex].curves[curveIndex].mnemonicLst.push(mnemonic);
        }
      });
    }
  }

  // =========================================================
  // Apply / Cancel
  // =========================================================
  cancel(): void {
    this.ref.close(undefined);
  }

  apply(): void {
    this.ref.close({
      lstOfTrack: this.lstOfTrack,
      selectedLog: this.selectedLog,

      selectedHour: this.selectedHour,
      selectedDepth: this.selectedDepth,
      hideHeader: this.hideHeader,
      swtichToTvd: this.swtichToTvd,
      showSurvey: this.showSurvey,
      isFitToheight: this.isFitToheight,
      isAutoScroll: this.isAutoScroll,
      horizontalOrientaion: this.horizontalOrientaion,
      IntervalStep: this.IntervalStep,
    });
  }
}






//////////////////////////////




<h2 mat-dialog-title class="d-flex justify-content-between align-items-center">
  <span>Properties</span>
  <button mat-icon-button type="button" (click)="cancel()">
    <mat-icon>close</mat-icon>
  </button>
</h2>

<div mat-dialog-content style="height: calc(85vh - 120px); overflow:auto;">
  <!-- Keep EXACTLY your existing panel UI -->
  <ul class="nav nav-tabs nav-tabs-v2 ps-4 pe-4">
    <li class="nav-item me-3">
      <a href="#generalWithCard" class="nav-link" data-bs-toggle="tab">General</a>
    </li>
    <li class="nav-item me-3">
      <a href="#tracksWithCard" class="nav-link active" data-bs-toggle="tab">Track</a>
    </li>
  </ul>

  <div class="tab-content p-4">
    <!-- ======================= General ======================= -->
    <div class="tab-pane fade" id="generalWithCard">
      <div class="mb-2 row">
        <div *ngIf="showLoading" style="background-color:transparent; left:50%; top:50%; transform:translate(-50%,-50%);">
          <div class="spinner-border text-theme me-2"></div>
        </div>

        <label class="col-sm-3 col-form-label">Real Time(Hours)</label>
        <div class="col-sm-9">
          <select class="form-select" [(ngModel)]="selectedHour">
            @for (hour of lstHourss; track hour) {
              <option [value]="hour">{{ hour }}</option>
            }
          </select>
        </div>

        <label class="col-sm-3 col-form-label">Real Time(Depth)</label>
        <div class="col-sm-9">
          <input type="number" [(ngModel)]="selectedDepth" class="form-control" />
        </div>

        <label class="col-sm-3 col-form-label">Hide Header</label>
        <div class="col-sm-1">
          <div class="form-check form-switch">
            <input type="checkbox" style="margin-top:5px" [(ngModel)]="hideHeader" class="form-check-input" />
          </div>
        </div>

        <label class="col-sm-2 col-form-label">Switch to TVD</label>
        <div class="col-sm-1">
          <div class="form-check form-switch">
            <input type="checkbox" style="margin-top:5px" [(ngModel)]="swtichToTvd" class="form-check-input" />
          </div>
        </div>

        <label class="col-sm-3 col-form-label">Show Survey</label>
        <div class="col-sm-1">
          <div class="form-check form-switch">
            <input type="checkbox" style="margin-top:5px" [(ngModel)]="showSurvey" class="form-check-input" />
          </div>
        </div>

        <label class="col-sm-3 col-form-label">Fit to Height</label>
        <div class="col-sm-1">
          <div class="form-check form-switch">
            <input type="checkbox" style="margin-top:5px" [(ngModel)]="isFitToheight" class="form-check-input" />
          </div>
        </div>

        <label class="col-sm-2 col-form-label">Auto Scroll</label>
        <div class="col-sm-1">
          <div class="form-check form-switch">
            <input type="checkbox" style="margin-top:5px" [(ngModel)]="isAutoScroll" class="form-check-input" />
          </div>
        </div>

        <label class="col-sm-3 col-form-label">Horizontal Display</label>
        <div class="col-sm-1">
          <div class="form-check form-switch">
            <input type="checkbox" style="margin-top:5px" [(ngModel)]="horizontalOrientaion" class="form-check-input" />
          </div>
        </div>

        <label class="col-sm-3 col-form-label">Steps/Intervals</label>
        <div class="col-sm-3">
          <input type="number" [(ngModel)]="IntervalStep" class="form-control" />
        </div>
      </div>
    </div>

    <!-- ======================= Track ======================= -->
    <div class="tab-pane fade show active" style="overflow-y:auto; overflow-x:hidden;" id="tracksWithCard">
      <div *ngIf="showLoading" style="background-color:transparent; left:50%; top:50%; transform:translate(-50%,-50%);">
        <div class="spinner-border text-theme me-2"></div>
      </div>

      <div class="file-manager">
        <div class="file-manager-toolbar">
          <button type="button" (click)="NewTrack()" class="btn border-0 d-inline-flex align-items-center">
            <span data-icon="material-symbols-light:add" class="iconify fs-20px my-n2 me-1 text-theme"></span>
            Add Track
          </button>
        </div>
      </div>

      <br />

      @for (trackInfo of lstOfTrack; track trackInfo.trackNo; let trackIndex = $index) {
        <div class="accordion" [id]="'trackAccordion' + trackIndex">
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingOne">
              <button class="accordion-button" type="button" data-bs-toggle="collapse"
                      attr.data-bs-target="#collapseOne{{ trackIndex }}">
                <div class="d-flex w-100 justify-content-between align-items-center">
                  <h5>Track - {{ trackInfo.trackNo }}</h5>

                  <div class="d-flex justify-content-end">
                    @if (trackIndex != 0) {
                      <button type="button" (click)="MoveUpTrack(trackInfo.trackNo, trackIndex)"
                              class="btn border-0 me-2">
                        <span data-icon="material-symbols-light:arrow-upward-alt" class="iconify fs-20px my-n2 me-1"></span>
                      </button>
                    }
                    @if (trackIndex != lstOfTrack.length - 1) {
                      <button type="button" (click)="MoveDownTrack(trackInfo.trackNo, trackIndex)"
                              class="btn border-0 me-2">
                        <span data-icon="material-symbols-light:arrow-downward-alt" class="iconify fs-20px my-n2 me-1"></span>
                      </button>
                    }
                    <button type="button" (click)="DeleteTrack(trackInfo.trackNo)" class="btn border-0">
                      <span data-icon="material-symbols-light:delete-forever-outline-sharp" class="iconify fs-20px"></span>
                    </button>
                  </div>
                </div>
              </button>
            </h2>

            <div [id]="'collapseOne' + trackIndex" class="accordion-collapse collapse"
                 attr.data-bs-parent="#trackAccordion{{ trackIndex }}">
              <div class="accordion-body">
                <div class="mb-2 row">
                  <label class="col-sm-2 col-form-label">Title</label>
                  <div class="col-sm-10">
                    <input type="text" [(ngModel)]="trackInfo.trackName" class="form-control" />
                  </div>
                </div>

                <div class="mb-2 row">
                  <label class="col-sm-2 col-form-label">Type</label>
                  <div class="col-sm-10">
                    <select class="form-select"
                            (click)="selectedTrack($event, trackIndex)"
                            [(ngModel)]="trackInfo.trackType">
                      @for (trackType of lstTrackTypes; track trackType) {
                        <option [value]="trackType">{{ trackType }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="mb-4 row">
                  <div class="col-sm-7"></div>
                  <div class="col-sm-3">
                    <button type="button" (click)="AddNewMnemonic(trackInfo.trackNo)"
                            *ngIf="!trackInfo.isIndex && !trackInfo.isMudLog"
                            class="btn btn-dark" style="float:right">
                      Add Mnemonic
                    </button>
                  </div>
                  <div class="col-sm-2">
                    <button type="button" (click)="SaveTrackInfo()" class="btn btn-dark" style="float:right">
                      Save
                    </button>
                  </div>
                </div>

                @if (!trackInfo.isIndex  && !trackInfo.isMudLog) {
                  @for (curve of trackInfo.curves; track curve.mnemonicId; let curveIndex = $index) {
                    <div class="accordion" id="accordionCurve">
                      <div class="accordion-item">
                        <h2 class="accordion-header" id="headingOne">
                          <button class="accordion-button" type="button" data-bs-toggle="collapse"
                                  attr.data-bs-target="#collapseOne{{ trackIndex }}{{ curveIndex }}">
                            <div class="d-flex w-100 justify-content-between align-items-center">
                              <label>Curve {{ curve.mnemonicId }}</label>
                              <button type="button"
                                      (click)="RemoveMnemonic(trackInfo.trackNo, curve.DisplayOrder, curve.mnemonicId)"
                                      class="btn border-0 d-inline-flex align-items-center">
                                <span data-icon="material-symbols-light:delete-forever-outline-sharp" class="iconify fs-20px my-n2 me-1"></span>
                              </button>
                            </div>
                          </button>
                        </h2>

                        <div [id]="'collapseOne' + trackIndex + curveIndex"
                             class="accordion-collapse collapse show"
                             data-bs-parent="#accordionCurve">
                          <div class="accordion-body">
                            <div class="mb-2 row">
                              <label class="col-sm-2 col-form-label">Log</label>
                              <div class="col-sm-4">
                                <select class="form-select"
                                        [(ngModel)]="curve.LogId"
                                        (click)="selectedLogEvent($event, trackInfo.trackNo, curve.displayOrder)">
                                  <option value="none">None</option>
                                  @for (wellboreobject of wellboreObjects; track wellboreobject.objectId) {
                                    <option [value]="wellboreobject.objectId">
                                      {{ wellboreobject.objectName }}
                                    </option>
                                  }
                                </select>
                              </div>

                              <label class="col-sm-2 col-form-label">Mnemonic</label>
                              <div class="col-sm-4">
                                <select class="form-select" [(ngModel)]="curve.mnemonicId">
                                  <option value="none">None</option>
                                  @for (lstMne of curve.mnemonicLst; track lstMne.mnemonicId) {
                                    <option [value]="lstMne.mnemonicId">{{ lstMne.mnemonicDescp }}</option>
                                  }
                                </select>
                              </div>
                            </div>

                            <!-- You can keep rest of your curve fields here exactly as-is -->
                            <!-- (color, lineStyle, min/max, show, autoscale, etc.) -->
                          </div>
                        </div>

                      </div>
                    </div>
                  }
                }

              </div>
            </div>
          </div>
        </div>
      }
    </div>
  </div>
</div>

<div mat-dialog-actions class="d-flex justify-content-end gap-2">
  <button mat-button type="button" (click)="cancel()">Cancel</button>
  <button mat-raised-button color="primary" type="button" (click)="apply()">Apply</button>
</div>


////////////////////////////





zoomOut() {
  const trackContainer = this.widget.getTrackContainer();
  const modelLimits = this.widget.getModelLimits(); // The full well depth
  const visibleLimits = this.widget.getVisibleLimits(); // What we see now

  // 1. Calculate what the new height WOULD be (e.g., zooming out by 20%)
  const newHeight = visibleLimits.getHeight() * 1.2;

  // 2. CHECK: If the new height is greater than our total data depth, 
  // just fit to height instead of shrinking.
  if (newHeight >= modelLimits.getHeight()) {
      this.widget.fitToHeight(); 
  } else {
      // Otherwise, perform a standard scale-out
      const center = visibleLimits.getCenter();
      visibleLimits.scale(1.2, center.getX(), center.getY());
      this.widget.setVisibleLimits(visibleLimits);
  }

  this.widget.update();
}

//////////////////

private _drawForTrack(logTrack: LogTrack, pt: Point, depth: number): void {
  const bounds: any = logTrack.getBounds();
  const index = this._widget.getTrackIndex(logTrack);
  const headerHeight = this._widget.getHeaderHeight();
  const hostRect = this._host.getBoundingClientRect();

  // 1. Draw the horizontal crosshair line for this track
  this._drawHorizontalLine(index, pt.y, logTrack);

  // 2. Validation: If out of bounds or no data, hide this track's tooltip/line
  if (pt.y < headerHeight || pt.y > hostRect.bottom || 
      this._trackInfo[index]?.isIndex || this._trackInfo[index]?.curves?.length === 0) {
      this._removeHorizontalLine(index);
      this._hideTooltip(index);
      return;
  }

  // 3. Process Tooltip (No setTimeout - runs immediately)
  this._currentTrackIdx = index;
  const tooltip = this._getTooltipContainer(index);
  tooltip.innerHTML = this._buildTooltipContent(depth);
  tooltip.style.display = 'block';

  // Position Tooltip
  let top = pt.y + hostRect.top + 15;
  const availableSpaceBelow = hostRect.bottom - (pt.y + hostRect.top);
  
  // Auto-flip tooltip if it hits the bottom
  if (tooltip.offsetHeight > availableSpaceBelow - 15) {
      top = pt.y + hostRect.top - tooltip.offsetHeight - 15;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${bounds.getCenterX() - bounds.getWidth() / 3 + hostRect.left - 20}px`;
  tooltip.style.maxWidth = `${bounds.getWidth()}px`;

  // 4. CALL the new separate method for circles
  this._updateCurveCircles(logTrack, pt);
}


///////////////////

private _drawForTrack(logTrack: LogTrack, pt: Point, depth: number, poolIdx: number): void {
  const index = this._widget.getTrackIndex(logTrack);
  const hostRect = this._host.getBoundingClientRect();
  const bounds = logTrack.getBounds();

  // 1. Draw one full-width horizontal line (only for the first track in the loop)
  if (poolIdx === 0) {
      const line = this._horizontalLinePool[0];
      if (line) {
          line.style.display = 'block';
          line.style.width = `${hostRect.width}px`;
          line.style.transform = `translate3d(${hostRect.left}px, ${pt.y + hostRect.top}px, 0)`;
      }
  }

  // Skip drawing tooltips if we are in the header area
  if (pt.y < this._widget.getHeaderHeight() || !this._trackInfo[index]) {
      return;
  }

  // 2. Update Tooltip for this track
  const tooltip = this._tooltipPool[poolIdx % this._tooltipPool.length];
  if (tooltip) {
      tooltip.innerHTML = this._buildTooltipContent(index, depth);
      tooltip.style.display = 'block';
      
      // Position the tooltip at the center of this specific track
      const tx = bounds.getCenterX() + hostRect.left - (tooltip.offsetWidth / 2 || 50);
      const ty = pt.y + hostRect.top + 15;
      
      tooltip.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  }

  // 3. Draw Circles for this track
  this._drawCircles(index, pt, logTrack, hostRect);
}

///////////





//////////////////



private _drawCircles(trackIndex: number, pt: Point, logTrack: LogTrack, hostRect: DOMRect) {
  const track = this._trackInfo[trackIndex];
  const bounds = logTrack.getBounds();
  if (!bounds || !track) return;

  const trackHeight = hostRect.height - this._widget.getHeaderHeight();
  
  // 1. Determine if this track is Time-based
  const isTimeIndex = track.curves.some(c => !c.isDepth);
  const indexArrayLength = isTimeIndex ? this._indexCurveTime.length : this._indexCurveDepth.length;

  if (indexArrayLength === 0) return;

  // 2. Calculate the Shared Index for this Y-position
  const range = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
  let sharedIdx = Math.round(((pt.y - this._widget.getHeaderHeight()) / trackHeight) * (indexArrayLength - 1));
  
  // Safety clamp
  sharedIdx = Math.max(0, Math.min(indexArrayLength - 1, sharedIdx));

  track.curves.forEach(curve => {
      if (!this._circlePool[curve.displayName]) {
          const circle = document.createElement('div');
          circle.style.cssText = 'position:absolute; width:10px; height:10px; margin-top:-5px; margin-left:-5px; border-radius:50%; z-index:10001; pointer-events:none; display:none; left:0px; top:0px;';
          document.body.appendChild(circle);
          this._circlePool[curve.displayName] = circle;
      }

      const circle = this._circlePool[curve.displayName];
      const data = curve.data;

      // 3. Get value using the shared index
      const valRaw = data ? data[sharedIdx] : undefined;
      const value = parseFloat(valRaw);

      if (isNaN(value) || !curve.show) {
          circle.style.display = 'none';
          return;
      }

      // 4. Calculate X Position based on curve scale
      const valueRange = curve.max - curve.min;
      const xRel = (value - curve.min) / valueRange;
      const xPos = (xRel * bounds.getWidth()) + bounds.getLeft() + hostRect.left;
      const yPos = pt.y + hostRect.top;

      // 5. Apply Position
      circle.style.background = curve.color;
      circle.style.left = '0px'; 
      circle.style.top = '0px';
      circle.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
      circle.style.display = 'block';
  });
}

///////////////////
private _buildTooltipContent(trackIdx: number, depth: number): string {
  const track = this._trackInfo[trackIdx];
  if (!track) return '';

  let html = `&nbsp;&nbsp;<b>${track.trackName}</b><br>`;
  let idx = -1;

  // 1. DETERMINE THE CORRECT INDEX (Depth vs Time)
  // Check if the first curve is a time curve or if trackInfo is marked as time
  const isTimeIndex = track.curves.some(c => !c.isDepth);

  if (isTimeIndex && this._indexCurveTime.length > 0) {
      // Find index in Time array
      const timeRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
      idx = Math.round(((depth - this.wellService.plotMinDepth) / timeRange) * (this._indexCurveTime.length - 1));
      idx = Math.max(0, Math.min(this._indexCurveTime.length - 1, idx));

      const timeVal = this._indexCurveTime[idx];
      const formattedTime = timeVal ? formatDate(new Date(timeVal), 'HH:mm:ss', 'en') : 'N/A';
      html += `&nbsp;&nbsp;<span><b>Rig Time: ${formattedTime}</b></span><br>`;
  } else {
      // Find index in Depth array
      const depthRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
      idx = Math.round(((depth - this.wellService.plotMinDepth) / depthRange) * (this._indexCurveDepth.length - 1));
      idx = Math.max(0, Math.min(this._indexCurveDepth.length - 1, idx));

      html += `&nbsp;&nbsp;<span><b>Depth: ${this._indexCurveDepth[idx] ?? 'N/A'}</b></span><br>`;
  }

  // 2. APPEND CURVE DATA
  track.curves.forEach(curve => {
      if (!curve.show || !curve.data?.length) return;

      const valRaw = curve.data[idx];
      if (valRaw === undefined || valRaw === null || valRaw === 'NaN') {
          html += `&nbsp;&nbsp;&nbsp;<span>${curve.displayName}: N/A</span><br>`;
      } else {
          // Format number to 2 decimal places if it's a number
          const displayVal = typeof valRaw === 'number' ? valRaw.toFixed(2) : valRaw;
          html += `&nbsp;&nbsp;&nbsp;<span>${curve.displayName}: ${displayVal} ${curve.unit ?? ''}</span><br>`;
      }
  });

  return html;
}

///////////////

private _updateCurveCircles(logTrack: LogTrack, pt: Point): void {
  const index = this._widget.getTrackIndex(logTrack);
  const track = this._trackInfo[index];
  const hostRect = this._host.getBoundingClientRect();
  
  const trackTop = hostRect.top;
  const trackLeft = hostRect.left;
  const trackSelfLeft = logTrack.getBounds()?.getLeft() ?? 0;
  const trackSelfRight = logTrack.getBounds()?.getRight() ?? 0;
  const trackHeightArea = hostRect.height - this._widget.getHeaderHeight();

  track.curves.forEach(curve => {
      // Find or Create the circle element
      let circle = document.getElementById(`circle-${curve.displayName}`) as HTMLElement;

      if (!circle) {
          circle = document.createElement('div');
          circle.id = `circle-${curve.displayName}`;
          circle.className = 'cg-cirlce-container';
          circle.style.position = 'absolute';
          circle.style.width = '12px';
          circle.style.height = '12px';
          circle.style.borderRadius = '50%';
          circle.style.background = curve.color;
          circle.style.zIndex = '10001';
          circle.style.pointerEvents = 'none'; // Crucial to prevent mouse sticking
          circle.style.marginTop = '-6px';
          circle.style.marginLeft = '-6px';
          document.body.appendChild(circle);
          this._curveCircles[curve.displayName] = circle;
      }

      // Calculation Logic
      const data = curve.data;
      const numPoints = data.length;
      const valueRange = curve.max - curve.min;
      
      const valueAtY = curve.min + valueRange * (1 - (pt.y - this._widget.getHeaderHeight()) / trackHeightArea);
      let adjustedIdx = Math.round((valueAtY - curve.min) / valueRange * (numPoints - 1));
      adjustedIdx = Math.max(0, Math.min(numPoints - 1, adjustedIdx));

      const value = parseFloat(data[adjustedIdx]);
      const xPercent = (value - curve.min) / valueRange;
      const xIntersection = (xPercent * (trackSelfRight - trackSelfLeft)) + trackSelfLeft + trackLeft;

      // Apply position and visibility
      if (!isNaN(xIntersection) && xIntersection > 0) {
          circle.style.left = `${xIntersection}px`;
          circle.style.top = `${trackTop + pt.y}px`;
          circle.style.display = 'block';
      } else {
          circle.style.display = 'none';
      }
  });
}




////////////////



import { ToolTipTool } from '@int/geotoolkit/controls/tools/ToolTipTool';
import { Point } from '@int/geotoolkit/util/Point';
import { Selector } from '@int/geotoolkit/selection/Selector';
import { WellLogWidget } from '@int/geotoolkit/welllog/widgets/WellLogWidget';
import { Obfuscate } from '@int/geotoolkit/decorators';
import { LogTrack } from '@int/geotoolkit/welllog/LogTrack';
import { from } from '@int/geotoolkit/selection/from';
import { ITracks } from '../../models/chart/tracks';
import { formatDate } from '@angular/common';
import { WellDataService } from '../../../app/service/well-service/well.service';
import { OnDestroy } from '@angular/core';

@Obfuscate()
export class CrossTrackTooltip extends ToolTipTool implements OnDestroy {
    private readonly _selector = new Selector();
    private _host: HTMLElement;
    private _trackInfo: ITracks[] = [];
    private _indexCurveDepth: number[] = [];
    private _indexCurveTime: Date[] = [];
    private _hideHeader = false;

    // POOLS - Created once to avoid DOM churn
    private _tooltipPool: HTMLElement[] = [];
    private _horizontalLinePool: HTMLElement[] = [];
    private _circlePool: { [curveName: string]: HTMLElement } = {};

    private _debounceTimer: any;
    private _lastMousePt: Point | undefined;
    private readonly _debounceDelay = 20; // Fast response
    private _tooltipTimeout: any;

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

        // PRE-CREATE UI ELEMENTS (Object Pool)
        this._initializePools();

        this.setCallback(this._callbackWrapper.bind(this));
    }

    private _initializePools() {
        // Create 10 reusable tooltip containers
        for (let i = 0; i < 10; i++) {
            const el = document.createElement('div');
            el.className = 'cg-tooltip-container';
            el.style.cssText = 'position:absolute; display:none; pointer-events:none; z-index:99999; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(0,0,0,0.5); border-radius:3px; padding:2px; font-size:10px; backdrop-filter:blur(1px);';
            document.body.appendChild(el);
            this._tooltipPool.push(el);
        }

        // Create 5 reusable horizontal lines
        for (let i = 0; i < 5; i++) {
            const line = document.createElement('div');
            line.style.cssText = 'position:absolute; height:1px; background:white; display:none; z-index:10000; pointer-events:none;';
            document.body.appendChild(line);
            this._horizontalLinePool.push(line);
        }
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
        // 1. CRITICAL: Hide everything first to prevent "stuck" elements
        this._resetAll();

        const nodes = this._selector?.select(this._widget, pt.x, pt.y, 2);
        if (!nodes?.length) return '';

        const manipLayer: any = this._widget.getTrackManipulatorLayer();
        const sceneTransform = manipLayer?.getSceneTransform?.();
        const depth = sceneTransform ? sceneTransform.inverseTransformPoint(pt).getY() : pt.y;

        // 2. Get tracks and iterate
        const tracks = from(this._widget)
            .where(node => node instanceof LogTrack)
            .toArray();

        tracks.forEach((trackNode, i) => {
            const logTrack = trackNode as LogTrack;
            const bounds = logTrack.getBounds();
            
            // Only draw if the mouse is actually inside this track
            if (bounds.contains(pt.x, pt.y)) {
                this._drawForTrack(logTrack, pt, depth, i);
            }
        });

        return null;
    }

    private _drawForTrack(logTrack: LogTrack, pt: Point, depth: number, poolIdx: number): void {
        const index = this._widget.getTrackIndex(logTrack);
        const hostRect = this._host.getBoundingClientRect();
        const bounds = logTrack.getBounds();

        // 1. Draw Horizontal Line (Pooled)
        const line = this._horizontalLinePool[poolIdx % this._horizontalLinePool.length];
        if (line) {
            line.style.display = 'block';
            line.style.width = `${hostRect.width}px`;
            line.style.left = `${hostRect.left}px`;
            line.style.top = `${pt.y + hostRect.top}px`;
        }

        if (pt.y < this._widget.getHeaderHeight() || !this._trackInfo[index] || this._trackInfo[index].curves?.length === 0) {
            return;
        }

        // 2. Update Tooltip (Pooled)
        const tooltip = this._tooltipPool[poolIdx % this._tooltipPool.length];
        if (tooltip) {
            tooltip.innerHTML = this._buildTooltipContent(index, depth);
            tooltip.style.display = 'block';
            
            // Positioning - using transform for performance
            const tooltipX = bounds.getCenterX() + hostRect.left - (bounds.getWidth() / 4);
            const tooltipY = pt.y + hostRect.top + 15;
            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.top = `${tooltipY}px`;
        }

        // 3. Update Curve Circles (Pooled by name)
        this._drawCircles(index, pt, logTrack, hostRect);
    }

    private _drawCircles(trackIndex: number, pt: Point, logTrack: LogTrack, hostRect: DOMRect) {
        const curves = this._trackInfo[trackIndex].curves;
        const bounds = logTrack.getBounds();
        const trackHeight = hostRect.height - this._widget.getHeaderHeight();

        curves.forEach(curve => {
            if (!this._circlePool[curve.displayName]) {
                const circle = document.createElement('div');
                circle.style.cssText = 'position:absolute; width:10px; height:10px; margin-top:-5px; margin-left:-5px; border-radius:50%; z-index:10001; pointer-events:none; display:none;';
                document.body.appendChild(circle);
                this._circlePool[curve.displayName] = circle;
            }

            const circle = this._circlePool[curve.displayName];
            const data = curve.data;
            if (!data || data.length === 0) return;

            // Math to find intersection
            const valueRange = curve.max - curve.min;
            const valueAtY = curve.min + valueRange * (1 - (pt.y - this._widget.getHeaderHeight()) / trackHeight);
            let idx = Math.round((valueAtY - curve.min) / valueRange * (data.length - 1));
            idx = Math.max(0, Math.min(data.length - 1, idx));

            const value = parseFloat(data[idx]);
            if (isNaN(value)) {
                circle.style.display = 'none';
                return;
            }

            const xRel = (value - curve.min) / valueRange;
            const xPos = (xRel * bounds.getWidth()) + bounds.getLeft() + hostRect.left;

            circle.style.background = curve.color;
            circle.style.left = `${xPos}px`;
            circle.style.top = `${pt.y + hostRect.top}px`;
            circle.style.display = 'block';
        });
    }

    private _resetAll(): void {
        this._tooltipPool.forEach(t => t.style.display = 'none');
        this._horizontalLinePool.forEach(l => l.style.display = 'none');
        Object.values(this._circlePool).forEach(c => c.style.display = 'none');
    }

    private _buildTooltipContent(trackIdx: number, depth: number): string {
        const track = this._trackInfo[trackIdx];
        if (!track) return '';

        let html = `<b>${track.trackName}</b><br>`;
        let idxDepth = 0;

        // Calculate index based on depth
        const depthRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
        idxDepth = Math.round(((depth - this.wellService.plotMinDepth) / depthRange) * (this._indexCurveDepth.length - 1));
        idxDepth = Math.max(0, Math.min(this._indexCurveDepth.length - 1, idxDepth));

        html += `Depth: ${this._indexCurveDepth[idxDepth]}<br>`;

        track.curves.forEach(curve => {
            if (!curve.show || !curve.data?.length) return;
            const valRaw = curve.data[idxDepth];
            const display = (valRaw === undefined || valRaw === 'NaN') ? 'N/A' : valRaw;
            html += `${curve.displayName}: ${display} ${curve.unit}<br>`;
        });

        return html;
    }

    ngOnDestroy(): void {
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._resetAll();
        // Remove elements from DOM
        this._tooltipPool.forEach(t => t.remove());
        this._horizontalLinePool.forEach(l => l.remove());
        Object.values(this._circlePool).forEach(c => c.remove());
    }

    public destroy(): void {
        this.ngOnDestroy();
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
  
  
