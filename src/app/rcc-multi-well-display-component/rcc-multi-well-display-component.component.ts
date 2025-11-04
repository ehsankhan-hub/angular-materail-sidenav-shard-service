import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { forkJoin } from "rxjs";

import { Plot } from "@int/geotoolkit/plot/Plot";
import { MultiWellWidget } from "@int/geotoolkit/welllog/multiwell/MultiWellWidget";
import { TrackType as MultiWellTrackType } from "@int/geotoolkit/welllog/multiwell/TrackType";
import { TrackType as WellLogTrackType } from "@int/geotoolkit/welllog/TrackType";
import { WellTrack } from "@int/geotoolkit/welllog/multiwell/WellTrack";
import { LogData } from "@int/geotoolkit/welllog/data/LogData";
import { LogCurve } from "@int/geotoolkit/welllog/LogCurve";
import { KnownColors } from "@int/geotoolkit/util/ColorUtil";
import { Range } from "@int/geotoolkit/util/Range";
import { MathUtil } from "@int/geotoolkit/util/MathUtil";

import { MultiWellDataService } from "../service/multi-well-service/multiwelldata.service";
import { LogDataRequest } from "../models/log-data-request";
import { MultiWellData } from "../models/multiwell/multi-well-data";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { WellDataService } from "../service/well-service/well.service";
import { RccMultiWellWidgetsComponent } from "./rcc-multi-well-widgets/rcc-multi-well-widgets.component";
import { IWellboreLogData } from "../models/wellbore/wellbore-object";

interface WellForm {
  wells: any[];
}

@Component({
  selector: "app-rcc-multi-well-display",
  standalone: true,
  imports: [MatCardModule, CommonModule, RccMultiWellWidgetsComponent],
  templateUrl: "./rcc-multi-well-display.component.html",
  styleUrls: ["./rcc-multi-well-display.component.scss"],
})
export class RccMultiWellDisplayComponent implements AfterViewInit, OnChanges, OnInit {
  @ViewChild("correlationDisplay", { static: false }) canvas!: ElementRef<HTMLCanvasElement>;

  @Input({ required: true }) graphData!: WellForm;

  private plot!: Plot;
  multiWellService = inject(MultiWellDataService);
  wellService = inject(WellDataService);
  cdr = inject(ChangeDetectorRef);

  logsRequest: LogDataRequest[] = [];
  wellTrack: WellTrack[] = [];
  token: string = "";
  isLoading = false;
  hasData = false;

  /** Widgets per well (for right-side panel) */
  wellWidgets: { wellName: string; widgets: { label: string; value: any }[] }[] = [];

  ngOnInit(): void {
    this.token = "" + localStorage.getItem("token");
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["graphData"] && !changes["graphData"].isFirstChange()) {
      this.processData();
    }
  }

  ngAfterViewInit(): void {
    this.processData();
  }

  processData(): void {
    this.isLoading = true;
    this.logsRequest = [];
    this.wellTrack = [];
    this.wellWidgets = [];

    setTimeout(() => {
      if (!this.graphData || this.graphData.wells.length === 0) {
        this.isLoading = false;
        this.hasData = false;
        this.cdr.detectChanges();
        return;
      }

      this.hasData = true;
      this.renderGraph();
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  renderGraph(): void {
    const widget = this.createWidget();
    if (this.plot) {
      this.plot.dispose();
    }

    setTimeout(() => {
      this.plot = new Plot({
        canvaselement: this.canvas.nativeElement,
        root: widget,
        autosize: true,
        autoupdate: true,
      });
    });
  }

  /** Builds MultiWellWidget + log data + per-well widgets */
  createWidget(): MultiWellWidget {
    const widget = new MultiWellWidget({
      horizontalscrollable: "auto",
      verticalscrollable: "auto",
      header: { border: { visible: true } },
      tools: { cursortracking: { tooltip: { enabled: true } } },
      scroll: {
        headerverticalscroll: { size: 11, visible: true },
        trackhorizontalscroll: { size: 11, visible: true },
      },
    }).setLayoutStyle({ left: 0, top: 0, right: 0, bottom: 0 });

    if (this.graphData) {
      this.graphData.wells.forEach((well) => {
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

        groupedMnemonics.forEach((logData: any) => {
          const { min, max } = this.getMinMaxValues(logData.logDetails);
          const req: LogDataRequest = {
            wellUid: well.selectedWell.uid,
            wellboreUid: well.selectedWellBore.uid,
            logUid: logData.log,
            indexType: "measured depth",
            startIndex: min,
            endIndex: max,
            mnemonicList: logData.list.join(","),
          };
          this.logsRequest.push(req);
        });

        const singleWellTrack = widget.addTrack(MultiWellTrackType.WellTrack, {
          welllog: { range: new Range(0, 100) },
          name: well.selectedWellBore.name,
          title: "${name}<br/><span style='background-color: #DCDCDC'>Depth Scale</span>",
        });

        this.wellTrack.push(singleWellTrack);
      });

      this.getCurveData(this.logsRequest, widget);
    }
    return widget;
  }

  getCurveData(allRequests: LogDataRequest[], widget: MultiWellWidget): void {
    const observables = allRequests.map((req) => this.multiWellService.getWellBoreData(this.token, req));

    forkJoin(observables).subscribe(
      (result) => {
        result.forEach((item: any) => {
          const curvesData: MultiWellData = { curveNames: [], curveData: [[]] };
          const mnemonicList: string[] =
            item.logs[0].logData?.mnemonicList.split(",") || [];
          curvesData.curveData.pop();

          mnemonicList.forEach((mnemonic, i) => {
            const curveData: number[] = [];
            item.logs[0].logData?.data.forEach((row: any) => {
              const values = row.split(",");
              const val = parseFloat(values[i]);
              if (!isNaN(val)) curveData.push(val);
            });
            if (curveData.length > 0) {
              curvesData.curveNames.push(mnemonic);
              curvesData.curveData.push(curveData);
            }
          });

          const track = this.wellTrack.find(
            (well: any) => well.DI_ === item.logs[0]["@uidWellbore"]
          );
          this.addWellData(
            track,
            curvesData,
            Number(item.logs[0].startIndex["#text"]),
            Number(item.logs[0].endIndex["#text"])
          );

          // Build per-well widgets showing latest data values
          const widgets = curvesData.curveNames.map((name, idx) => ({
            label: name,
            value: curvesData.curveData[idx]?.at(-1) ?? "—",
          }));
          this.wellWidgets.push({
            wellName: item.logs[0]["@uidWell"],
            widgets,
          });
        });
      },
      (error) => console.error("Error in one or more actions:", error),
      () => widget.setHeaderHeight("auto")
    );
  }

  addWellData(well: WellTrack, data: MultiWellData, min: number, max: number): void {
    well.addTrack(WellLogTrackType.IndexTrack);
    const logTrack = well.addTrack(WellLogTrackType.LinearTrack);
    data.curveNames.forEach((name, i) => {
      const curve = this.createCurve(this.createData(1, 10, name, data.curveData[i]));
      logTrack.addChild([curve]);
    });
    if (min < max) well.setDepthLimits(min, max);
  }

  createCurve(dataSource: LogData): LogCurve {
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

  createData(from: number, step: number, mnemonic: string, valuesArray: number[]): LogData {
    const data = new LogData(mnemonic);
    const depths = valuesArray.map((_, i) => i * step + from);
    data.setValues(depths, valuesArray);
    return data;
  }

  getMinMaxValues(data: { minIndex: any; maxIndex: any }[]): { min: number; max: number } {
    const min = Math.min(...data.map((d) => parseFloat(d.minIndex["#text"]))) - 100;
    const max = Math.max(...data.map((d) => parseFloat(d.maxIndex["#text"]))) + 100;
    return { min, max };
  }
}
