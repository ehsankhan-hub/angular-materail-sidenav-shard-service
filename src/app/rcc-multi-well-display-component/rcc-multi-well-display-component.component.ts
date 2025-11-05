import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ElementRef,
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

interface wellForm {
  wells: any[];
}

@Component({
  selector: "app-rcc-multi-well-display",
  standalone: true,
  imports: [MatCardModule, CommonModule, RccMultiWellWidgetsComponent],
  templateUrl: "./rcc-multi-well-display.component.html",
  styleUrl: "./rcc-multi-well-display.component.scss",
})
export class RccMultiWellDisplayComponent
  implements AfterViewInit, OnChanges, OnInit
{
  displayName: string = "LWD Density";
  defaultCureveInfo: IWellboreLogData;
  logID: string = "";
  isUpdateGuageRunning: boolean = false;
  mnemonicName: any;
  cardsConfig: any[] = [{}];
  ropGaugeConfig: any[] = [];
  columnChartsConfig: any = [{ chartValue: "", chartLabel: "" }];

  @ViewChild("correlationDisplay", { static: false }) canvas: ElementRef;
  multiWellService = inject(MultiWellDataService);
  mnemonicListWedgets: string[] = [];
  token!: string;
  private plot: Plot;
  well: any;
  @Input({ required: true }) graphData: wellForm;
  logsRequest: Array<LogDataRequest>;
  selectedWells = [
    { well: "ABHD_104", wellbore: "ABHD_104_2" },
    { well: "ABHD_112", wellbore: "ABHD_112_0" },
  ];

  isLoading = false;
  hasData = false;
  cards: { mnemonicList: string; content: string }[] = [];
  wellTrack: any[];

  constructor(private cdr: ChangeDetectorRef, private wellService: WellDataService) {}

  ngOnInit(): void {
    setInterval(() => {}, 1000 * 10 * 0.2);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["graphData"] && !changes["graphData"].isFirstChange()) {
      this.processData();
    }
  }

  ngAfterViewInit(): void {
    this.processData();
  }

  processData() {
    this.isLoading = true;
    this.logsRequest = [];
    this.wellTrack = [];
    this.token = "" + localStorage.getItem("token");
    this.cdr.detectChanges();
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

  renderGraph() {
    const widget = this.createWidget();

    if (this.plot) {
      this.plot.dispose();
      setTimeout(() => {
        this.plot = new Plot({
          canvaselement: this.canvas.nativeElement,
          root: widget,
          autosize: true,
          autoupdate: true,
        });
      });
    } else {
      setTimeout(() => {
        this.plot = new Plot({
          canvaselement: this.canvas.nativeElement,
          root: widget,
          autosize: true,
          autoupdate: true,
        });
      });
    }
  }

  createWidget(): MultiWellWidget {
    const widget = new MultiWellWidget({
      horizontalscrollable: "auto",
      verticalscrollable: "auto",
      trackcontainer: { border: { visible: false } },
      header: { border: { visible: true } },
      tools: {
        cursortracking: {
          tooltip: { enabled: true },
        },
      },
      scroll: {
        headerverticalscroll: { size: 11, visible: true, options: { resizable: false } },
        trackhorizontalscroll: { size: 11, visible: true, options: { resizable: false } },
      },
    }).setLayoutStyle({ left: 0, top: 0, right: 0, bottom: 0 });

    if (this.graphData) {
      this.graphData.wells.forEach((well) => {
        const groupedMnemonics = well.mnemonicList.reduce((acc: any, item: any) => {
          const selectedLogId = item.selectedWellBoreLog.uid;
          const logDetails = item.selectedWellBoreLog.logCurveInfo;
          this.mnemonicName = item.mnemonic.mnemonic;

          let group = acc.find((g: any) => g.log === selectedLogId);
          if (!group) {
            group = { log: selectedLogId, logDetails, list: [], cards: [] };
            acc.push(group);
          }
          group.list.push(this.mnemonicName);
          return acc;
        }, []);

        groupedMnemonics.forEach((logData: any) => {
          const minMax = this.getMinMaxValues(logData.logDetails);
          const singleLogRequest = {
            wellUid: well.selectedWell.uid,
            wellboreUid: well.selectedWellBore.uid,
            logUid: logData.log,
            indexType: "measured depth",
            startIndex: minMax.min,
            endIndex: minMax.max,
            mnemonicList: logData.list.join(","),
          };
          this.logsRequest.push(singleLogRequest);
        });

        // ✅ Add per-well track and tag with DI_
        const singleWellTrack = widget.addTrack(MultiWellTrackType.WellTrack, {
          welllog: { range: new Range(0, 100) },
          name: well.selectedWellBore.name,
          title: '${name}<br/><span style="background-color:#DCDCDC">Depth Scale</span>',
        });

        (singleWellTrack as any).DI_ = well.selectedWellBore.uid; // ✅ Tag for tested getCurveData()
        this.wellTrack.push(singleWellTrack); // ✅ Keep old array structure
      });

      this.logsRequest.forEach((req) => {
        this.mnemonicListWedgets =
          req.mnemonicList?.split(",").map((value) => value.trim()) || [];
      });

      this.cardsConfig = [
        ...this.mnemonicListWedgets.map((mnemonic) => ({ label: mnemonic })),
      ];

      this.getCurveData(this.logsRequest, widget);
    }

    return widget;
  }

  addWellData(well: WellTrack, curvesData: MultiWellData, min: number, max: number) {
    well.addTrack(WellLogTrackType.IndexTrack);
    const logTrack = well.addTrack(WellLogTrackType.LinearTrack);
    for (let i = 0; i < curvesData.curveNames.length; i++) {
      logTrack.addChild([
        this.createCurve(
          this.createData(1, 10, curvesData.curveNames[i], curvesData.curveData[i])
        ).setLineStyle(this.getRandomColor()),
      ]);
    }

    if (min != null && max != null && min < max) {
      well.setDepthLimits(min, max);
    }
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

  createData(from: number, step: number, curveMnemonic: string, curveDataInp: any) {
    const data = new LogData(curveMnemonic);
    const depths = [];
    const values = [];
    const amountOfPoints = curveDataInp.length;
    for (let i = 0; i < amountOfPoints; i++) {
      depths.push(i * step + from);
      values.push(curveDataInp[i]);
    }
    data.setValues(depths, values);
    return data;
  }

  getRandomColor(): string {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 12)];
    return color;
  }

  getMinMaxValues(data: { minIndex: any; maxIndex: any }[]): { min: number; max: number } {
    const min =
      Math.min(...data.map((item) => parseFloat("" + item.minIndex["#text"]))) - 100;
    const max =
      Math.max(...data.map((item) => parseFloat("" + item.maxIndex["#text"]))) + 100;
    return { min, max };
  }
}
