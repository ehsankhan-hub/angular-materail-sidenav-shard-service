import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { forkJoin } from 'rxjs';

import { Plot } from '@int/geotoolkit/plot/Plot';
import { MultiWellWidget } from '@int/geotoolkit/welllog/multiwell/MultiWellWidget';
import { TrackType as MultiWellTrackType } from '@int/geotoolkit/welllog/multiwell/TrackType';
import { TrackType as WellLogTrackType } from '@int/geotoolkit/welllog/TrackType';
import { WellTrack } from '@int/geotoolkit/welllog/multiwell/WellTrack';
import { LogData } from '@int/geotoolkit/welllog/data/LogData';
import { LogCurve } from '@int/geotoolkit/welllog/LogCurve';
import { KnownColors } from '@int/geotoolkit/util/ColorUtil';
import { Range } from '@int/geotoolkit/util/Range';
import { MathUtil } from '@int/geotoolkit/util/MathUtil';

import { RccMultiWellWidgetsComponent } from './rcc-multi-well-widgets/rcc-multi-well-widgets.component';
import { MultiWellDataService } from '../service/multi-well-service/multiwelldata.service';
import { WellDataService } from '../service/well-service/well.service';
import { LogDataRequest } from '../models/log-data-request';
import { MultiWellData } from '../models/multiwell/multi-well-data';

interface WellForm { wells: any[]; }

@Component({
  selector: 'app-rcc-multi-well-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, RccMultiWellWidgetsComponent],
  templateUrl: './rcc-multi-well-display.component.html',
  styleUrls: ['./rcc-multi-well-display.component.scss']
})
export class RccMultiWellDisplayComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Input({ required: true }) graphData!: WellForm;
  @ViewChildren('wellCanvas') canvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  wellTiles: {
    wellName: string;
    wellboreUid: string;
    widgets: { label: string; value: any }[];
  }[] = [];

  token = '';
  logsRequest: LogDataRequest[] = [];

  private plotsByWellbore = new Map<string, Plot>();
  private widgetByWellbore = new Map<string, MultiWellWidget>();
  private trackByWellbore = new Map<string, WellTrack>();

  constructor(
    private cdr: ChangeDetectorRef,
    private mwService: MultiWellDataService,
    private wellService: WellDataService
  ) {}

  ngOnInit(): void {
    this.token = '' + localStorage.getItem('token');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['graphData'] && !changes['graphData'].isFirstChange()) {
      this.prepareRequestsAndTiles();
    }
  }

  ngAfterViewInit(): void {
    this.prepareRequestsAndTiles();
  }

  private prepareRequestsAndTiles(): void {
    if (!this.graphData?.wells?.length) return;

    this.logsRequest = [];
    this.wellTiles = [];

    this.graphData.wells.forEach((well) => {
      const grouped = well.mnemonicList.reduce((acc: any[], item: any) => {
        const logId = item.selectedWellBoreLog.uid;
        const logDetails = item.selectedWellBoreLog.logCurveInfo;
        const mnemonic = item.mnemonic.mnemonic;

        let group = acc.find((g) => g.log === logId);
        if (!group) {
          group = { log: logId, logDetails, list: [] };
          acc.push(group);
        }
        group.list.push(mnemonic);
        return acc;
      }, []);

      grouped.forEach((logData: any) => {
        const { min, max } = this.getMinMaxValues(logData.logDetails);
        const req: LogDataRequest = {
          wellUid: well.selectedWell.uid,
          wellboreUid: well.selectedWellBore.uid,
          logUid: logData.log,
          indexType: 'measured depth',
          startIndex: min,
          endIndex: max,
          mnemonicList: logData.list.join(',')
        };
        this.logsRequest.push(req);
      });

      this.wellTiles.push({
        wellName: well.selectedWellBore.name,
        wellboreUid: well.selectedWellBore.uid,
        widgets: []
      });
    });

    this.cdr.detectChanges();
    this.initPerWellPlots();
    this.getCurveData(this.logsRequest);
  }

  /** Create one MultiWellWidget + WellTrack per wellbore */
  private initPerWellPlots(): void {
    this.plotsByWellbore.clear();
    this.widgetByWellbore.clear();
    this.trackByWellbore.clear();

    const canvasArr = this.canvases.toArray();
    this.wellTiles.forEach((tile, i) => {
      const canvasEl = canvasArr[i]?.nativeElement;
      if (!canvasEl) return;

      const widget = new MultiWellWidget({
        horizontalscrollable: 'auto',
        verticalscrollable: 'auto',
        header: { border: { visible: true } },
        scroll: {
          headerverticalscroll: { size: 11, visible: true },
          trackhorizontalscroll: { size: 11, visible: true }
        }
      });

      const track = widget.addTrack(MultiWellTrackType.WellTrack, {
        welllog: { range: new Range(0, 100) },
        name: tile.wellName,
        title:
          '${name}<br/><span style="background-color:#DCDCDC">Depth Scale</span>'
      });

      const plot = new Plot({
        canvaselement: canvasEl,
        root: widget,
        autosize: true,
        autoupdate: true
      });

      this.plotsByWellbore.set(tile.wellboreUid, plot);
      this.widgetByWellbore.set(tile.wellboreUid, widget);
      this.trackByWellbore.set(tile.wellboreUid, track);
    });
  }

  /** Fetches data and attaches curves to the correct track */
  private getCurveData(allRequests: LogDataRequest[]): void {
    const obs = allRequests.map((r) =>
      this.mwService.getWellBoreData(this.token, r)
    );
  
    forkJoin(obs).subscribe({
      next: (result) => {
        result.forEach((item: any) => {
          console.log('Raw item structure:', item);
  
          // ✅ FIXED: your wellbore UID is directly on item (not in item.logs[0])
          const wellboreUid = item['@uidWellbore'];
          const track = this.trackByWellbore.get(wellboreUid);
          console.log('Found track for UID:', wellboreUid, !!track);
  
          if (!track) {
            console.warn('No matching track for wellbore:', wellboreUid);
            return;
          }
  
          // ✅ Prepare curves data container
          const curvesData: MultiWellData = {
            curveNames: [],
            curveData: [[]],
          };
  
          // ✅ Read mnemonics from item.logData instead of item.logs[0].logData
          const mnems: string[] =
            item.logData?.mnemonicList?.split(',').map((m: string) => m.trim()) || [];
  
          curvesData.curveData.pop();
  
          // ✅ Iterate through each mnemonic to prepare curve data
          mnems.forEach((m, i) => {
            const curveData: number[] = [];
  
            item.logData?.data?.forEach((row: string) => {
              const cols = row.split(',');
              const value = parseFloat(cols[i]);
              if (!isNaN(value)) curveData.push(value);
            });
  
            if (curveData.length > 0) {
              curvesData.curveNames.push(m);
              curvesData.curveData.push(curveData);
            }
          });
  
          // ✅ Add curves to the correct track
          this.addWellData(
            track,
            curvesData,
            Number(item.startIndex?.['#text']),
            Number(item.endIndex?.['#text'])
          );
        });
      },
      error: (err) => {
        console.error('Error fetching wellbore data:', err);
      },
      complete: () => {
        console.log('All wellbore data loaded');
      },
    });
  }
  

  // ---- tested helpers (unchanged) ----
  private addWellData(well: WellTrack, data: MultiWellData, min: number, max: number): void {
    well.addTrack(WellLogTrackType.IndexTrack);
    const logTrack = well.addTrack(WellLogTrackType.LinearTrack);

    data.curveNames.forEach((name, i) => {
      const curve = this.createCurve(this.createData(1, 10, name, data.curveData[i]));
      logTrack.addChild([curve]);
    });

    if (min < max) well.setDepthLimits(min, max);
  }

  private createCurve(dataSource: LogData): LogCurve {
    const limits = MathUtil.calculateNeatLimits(
      dataSource.getMinValue(),
      dataSource.getMaxValue(),
      false,
      false
    );
    return new LogCurve(dataSource)
      .setLineStyle({ color: KnownColors.Blue, width: 2 })
      .setNormalizationLimits(limits.getLow(), limits.getHigh());
  }

  private createData(from: number, step: number, mnemonic: string, values: number[]): LogData {
    const data = new LogData(mnemonic);
    const depths = values.map((_, i) => i * step + from);
    data.setValues(depths, values);
    return data;
  }

  private getMinMaxValues(data: { minIndex: any; maxIndex: any }[]): { min: number; max: number } {
    const min =
      Math.min(...data.map((d) => parseFloat('' + d.minIndex['#text']))) - 100;
    const max =
      Math.max(...data.map((d) => parseFloat('' + d.maxIndex['#text']))) + 100;
    return { min, max };
  }
}
