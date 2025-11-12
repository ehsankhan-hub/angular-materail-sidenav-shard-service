import {
  Component,
  OnInit,
  OnDestroy,
  SimpleChanges,
} from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MultiWellFilterComponent } from "./multi-well-filter/multi-well-filter.component";
import { StaticTemplateSharedService } from "../pages/staticTemplate/static-template-shared-service";
import { WellDataService } from "../service/well-service/well.service";
import { ITracks } from "../models/chart/tracks";

@Component({
  selector: "app-rcc-multi-well-display",
  standalone: true,
  templateUrl: "./rcc-multi-well-display.component.html",
  styleUrls: ["./rcc-multi-well-display.component.scss"],
})
export class MultiW implements OnInit, OnDestroy {
  @Input() well: string;
  @Input() wellbore: string;
  listOfTrack: ITracks[] = [];
  displayName: string = "multiWellDisplay";
  filteredData: any;
  dialogRef: MatDialogRef<MultiWellFilterComponent, any>;
  wellsData: any[] = [];

  // Existing variables untouched
  cardsConfig: any[] = [{ label: "ROPmin5ft" }, { label: "ROP" }, { label: "WOB" }];
  ropGaugeConfig: any[] = [];
  columnChartsConfig: any = [{ chartValue: "", chartLabel: "" }];

  constructor(
    public dialog: MatDialog,
    private staticTemplateSharedService: StaticTemplateSharedService,
    private wellService: WellDataService
  ) {}

  ngOnInit(): void {
    // ✅ initialize only if no wells exist yet
    const current = this.staticTemplateSharedService.getMultiWellFilterData();
    if (!current?.wells || current.wells.length === 0) {
      const defaultWells = [
        { well: "ABHD_112", wellbore: "ABHD_112_0", mnemonics: ["ROP_L", "WOB_L"] },
        { well: "ABHD_104", wellbore: "ABHD_104_2", mnemonics: ["ROP_L", "WOB_L"] },
      ];
      this.staticTemplateSharedService.setMultiWellFilterData({ wells: defaultWells });
    }

    // ✅ subscribe for updates
    this.staticTemplateSharedService.multiWellFilterData$.subscribe((data: any) => {
      this.filteredData = data;
      if (this.filteredData?.wells?.length > 0) {
        console.log("Selected wells:", this.filteredData);
        this.processGraphData(this.filteredData);
      }
    });
  }

  ngOnDestroy(): void {
    // cleanup if needed
  }

  addWell() {
    const currentSelection = this.staticTemplateSharedService.getMultiWellFilterData();
    this.dialogRef = this.dialog.open(MultiWellFilterComponent, {
      width: "80%",
      height: "80vh",
      data: currentSelection,
    });
  }

  processGraphData(selectedWells: any): void {
    const dynamicWells: any[] = [];
    console.log("processGraphData", JSON.stringify(selectedWells));

    selectedWells.wells.forEach((well: any) => {
      const groupedMnemonics = well.mnemonicList?.reduce((acc: any[], item: any) => {
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

      groupedMnemonics?.forEach((group: any) => {
        dynamicWells.push({
          well: well.selectedWell.uid,
          wellbore: well.selectedWellBore.uid,
          logId: group.log,
          mnemonics: group.list,
        });
      });
    });

    this.buildWellsData(dynamicWells);
  }

  buildWellsData(selectedWells: { well: string; wellbore: string; mnemonics: string[] }[]): void {
    this.wellsData = selectedWells.map((w) => ({
      well: w.well,
      wellbore: w.wellbore,
      selectedTrackList: this.buildTrackListForWell(w.well, w.wellbore, "LWD_Depth", w.mnemonics),
      widgets: this.buildWidgetsFromMnemonics(w.mnemonics),
      cardsConfig: this.getDefaultCardsConfig(),
      ropGaugeConfig: this.getDefaultRopGaugeConfig(),
      columnChartsConfig: this.getDefaultColumnChartConfig(),
    }));
  }

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
      curve.color = this.getColorByIndex(i);
      curve.min = 0;
      curve.max = 150;
      curve.autoScale = false;
      if (i % 2 === 0) curve.lineStyle = "2,4";
      curves.push(curve);
    });

    listOfTrack.push({
      trackNo: 1,
      trackName: "",
      trackType: "Linear",
      isIndex: true,
      isDepth: true,
      isImage: false,
      isMudLog: false,
      curves,
      comments: [],
    });

    listOfTrack.push({
      trackNo: 2,
      trackName: "Index",
      trackType: "Index",
      isIndex: true,
      isDepth: true,
      isImage: false,
      isMudLog: false,
      curves: [],
      comments: [],
    });

    return listOfTrack;
  }

  buildWidgetsFromMnemonics(mnemonics: string[]): any[] {
    return mnemonics.map((mnemonic, i) => ({
      type: this.getWidgetType(i),
      label: mnemonic,
      unit: "ft",
      color: this.getColorByIndex(i),
    }));
  }

  getDefaultCardsConfig() {
    return [
      { label: "ROPmin5ft", value: 0, unit: "ft/h", color: "#497749" },
      { label: "WOB", value: 0, unit: "kN", color: "#1120bf" },
    ];
  }

  getDefaultRopGaugeConfig() {
    return [{ label: "ROP", value: 0, min: 0, max: 250, color: "#00CAFB" }];
  }

  getDefaultColumnChartConfig() {
    return [{ chartLabel: "Block Position", chartValue: 0 }];
  }

  getColorByIndex(i: number): string {
    const colors = ["red", "black", "blue", "#b3e7b3", "#0077cc", "#22aa55", "#ffaa00"];
    return colors[i % colors.length];
  }

  getWidgetType(i: number): string {
    const types = ["CircularGauge", "NumericGauge", "LinearGauge"];
    return types[i % types.length];
  }
}

