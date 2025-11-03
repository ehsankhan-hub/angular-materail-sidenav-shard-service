import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  numberAttribute,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  viewChild
} from "@angular/core";
import {
  ILogDataQueryParameter,
  IMnemonic,
  IWellboreLogData,
  IWellboreObject,
} from "../../../models/wellbore/wellbore-object";
import { ITracks } from "../../../models/chart/tracks";
import { ILinePattern } from "../../../models/chart/linePattern";
import { ActivatedRoute } from "@angular/router";
import { WellDataService } from "../../../service/well-service/well.service";
import { ActiveWellboreObjectsService } from "../../../service/active-wellbore-objects.service";
import { Plot } from "@int/geotoolkit/plot/Plot";
import { TrackType } from "@int/geotoolkit/welllog/TrackType";
import { WellLogWidget } from "@int/geotoolkit/welllog/widgets/WellLogWidget";
import { LimitsType, LogCurve, TextReference } from "@int/geotoolkit/welllog/LogCurve";
import { LogData } from "@int/geotoolkit/welllog/data/LogData";
import { LogDrillingSectionContainer } from "@int/geotoolkit/welllog/data/LogDrillingSectionContainer";
import { LogDrillingSection } from "@int/geotoolkit/welllog/data/LogDrillingSection";
import { ScrollToLocation } from "@int/geotoolkit/welllog/TrackContainer";
import {
  Events as RubberBandEvents,
  RubberBand,
} from "@int/geotoolkit/controls/tools/RubberBand";
import { LogTrack } from "@int/geotoolkit/welllog/LogTrack";
import { Rect } from "@int/geotoolkit/util/Rect";
import { MatDialog } from "@angular/material/dialog";
import { CommonModule, formatDate, LowerCasePipe } from "@angular/common";
import { AdaptiveTickGenerator } from "@int/geotoolkit/axis/AdaptiveTickGenerator";
import { NodeExport } from "@int/geotoolkit/scene/exports/NodeExport";
import { getPixelScale } from "@int/geotoolkit/base";
import { Patterns } from "@int/geotoolkit/attributes/LineStyle";
import { WellLogTooltip } from "../../../common/well-log-widget/wellLog-tooltip";
import { AnchorType } from "@int/geotoolkit/util/AnchorType";
import {
  FillMode,
  LogMudLogSection,
  SymbolPosition,
  TextOrientation,
  WrapMode,
} from "@int/geotoolkit/welllog/LogMudLogSection";
import { AlignmentStyle } from "@int/geotoolkit/attributes/TextStyle";
import { ScalingOptions } from "@int/geotoolkit/scene/exports/ScalingOptions";
import { ImageCompression } from "@int/geotoolkit/pdf/ImageCompression";
import { FooterComponent } from "@int/geotoolkit/scene/exports/FooterComponent";
import { BrowserInfo } from "@int/geotoolkit/util/BrowserInfo";
import { createWellLogWidget } from "../../../common/well-log-widget/well-log-widget.component";
import { KnownColors } from "@int/geotoolkit/util/ColorUtil";
import { LogTrackHeader } from "@int/geotoolkit/welllog/header/LogTrackHeader";
import { LogMarker } from "@int/geotoolkit/welllog/LogMarker";
import { Grid } from "@int/geotoolkit/axis/Grid";
import { DepthSymbolType } from ".././symbols";
import { SvgPainter } from "@int/geotoolkit/svg/SvgPainter";
import { from } from "@int/geotoolkit/selection/from";
import { AbstractNode } from "@int/geotoolkit/scene/AbstractNode";
import { SymbolShape } from "@int/geotoolkit/scene/shapes/SymbolShape";
import { SharedModule } from "../../../common/modules/shared.module";
import { ColorSketchModule } from "ngx-color/sketch";
import { CssStyle } from "@int/geotoolkit/css/CssStyle";
import { universalMnemonic } from "../../../models/universalMnemonic"; // '.   ../../models/universalMnemonic';
import { Events as SceneEvents } from "@int/geotoolkit/scene/Node";
import { PointerMode } from "@int/geotoolkit/controls/tools/PointerMode";
import { Point } from "@int/geotoolkit/util/Point";
import { Selector } from "@int/geotoolkit/selection/Selector";
import { PatternFactory } from "@int/geotoolkit/attributes/PatternFactory";
import { HeaderType } from "@int/geotoolkit/welllog/header/LogAxisVisualHeader";
import {
  BorderMode,
  LineType,
  LogLithology,
} from "@int/geotoolkit/welllog/LogLithology";
import { FillStyle } from "@int/geotoolkit/attributes/FillStyle";
import { loadResources } from "../../wellboreview/realTimeDisplay/resources";
import { Log2DVisual, PlotTypes } from "@int/geotoolkit/welllog/Log2DVisual";
import { CompositeLog2DVisualHeader } from "@int/geotoolkit/welllog/header/CompositeLog2DVisualHeader";
import { Log2DVisualData } from "@int/geotoolkit/welllog/data/Log2DVisualData";
import { Log2DDataRow } from "@int/geotoolkit/welllog/data/Log2DDataRow";
import { Range } from "@int/geotoolkit/util/Range";
import { RangeColorProvider } from "@int/geotoolkit/util/RangeColorProvider";
import { DefaultColorProvider } from "@int/geotoolkit/util/DefaultColorProvider";
import { imageDataSample } from "./resources";
import { StaticTemplateSharedService } from "../../staticTemplate/static-template-shared-service";

loadResources("patterns");
import { LogPlotDataService } from "../../../service/log-plot-data.service";
import { InterpolationType } from "@int/geotoolkit/data/DataStepInterpolation";
import { LogReferenceLine } from "@int/geotoolkit/welllog/LogReferenceLine";
import { LogFill } from "@int/geotoolkit/welllog/LogFill";
import { Pattern } from "@int/geotoolkit/attributes/Pattern";
import { LogLithologyHeader } from "@int/geotoolkit/welllog/header/LogLithologyHeader";
import { AdaptiveLogLithologyHeader } from "@int/geotoolkit/welllog/header/AdaptiveLogLithologyHeader";
import { DiscreteFillDisplayType } from "@int/geotoolkit/welllog/header/AdaptiveDiscreteFillVisualHeader";
import { AnnotationComponent } from "../../annotation/annotation.component";
// Temporary
import Datasource from "../../wellboreview/realTimeDisplay/Datasource";
import { Dialog } from "@angular/cdk/dialog";
import { IAnnotation } from "@int/geotoolkit/widgets/overlays/IAnnotation";
import { mergeObjects } from "@int/geotoolkit/base";
import { AdaptiveLogVisualTitleHeader } from "@int/geotoolkit/welllog/header/AdaptiveLogVisualTitleHeader";
import { Annotation } from "../../../models/comment";
import { commentTrackInfo, remarksTrackInfo } from "../../../models/chart/commentTrack";
import { ITrack } from "@int/geotoolkit/welllog/ITrack";
import { Sections } from "@int/geotoolkit/welllog/header/AdaptiveLogVisualHeader";
import { CompositeLogCurve } from "@int/geotoolkit/welllog/CompositeLogCurve";
import { AdaptiveBasicLogVisualHeader } from "@int/geotoolkit/welllog/header/AdaptiveBasicLogVisualHeader";
import { LogTrackVisualHeader } from "@int/geotoolkit/welllog/header/LogTrackVisualHeader";
import { LogVisualHeaderProvider } from "@int/geotoolkit/welllog/header/LogVisualHeaderProvider";
import { LogVisualHeader } from "@int/geotoolkit/welllog/header/LogVisualHeader";
import {
  AdaptiveLog2DVisualHeader,
  Elements as Log2dHeaderElements,
} from "@int/geotoolkit/welllog/header/AdaptiveLog2DVisualHeader";
import {
  AdaptiveLogCurveVisualHeader,
  Elements as LogCurveHeaderElements,
} from "@int/geotoolkit/welllog/header/AdaptiveLogCurveVisualHeader";
import { Events as PanningEvents } from "@int/geotoolkit/controls/tools/Panning";
import { Panning } from "@int/geotoolkit/controls/tools/Panning";
import { zipAll } from "rxjs";
import { AngularResizeEventModule } from "angular-resize-event-package";
import { ContextmenuComponent } from "../../../common/contextmenu/contextmenu.component";
import { CdkMenu, CdkMenuItem, CdkContextMenuTrigger } from "@angular/cdk/menu";
import { Orientation } from '@int/geotoolkit/util/Orientation';
import { PanningEventArgs } from "@int/geotoolkit/controls/tools/PanningEventArgs";
import { LogAxis } from "@int/geotoolkit/welllog/LogAxis";

import {DateTimeTickGenerator} from '@int/geotoolkit/welllog/axis/DateTimeTickGenerator';
import { IndexType } from "@int/geotoolkit/welllog/IndexType";
import { VIRTUAL_SCROLL_STRATEGY } from "@angular/cdk/scrolling";
import { ScaleScrollStrategy } from "@int/geotoolkit/scene/ScaleScrollStrategy";
import { MatIconModule } from "@angular/material/icon";
import { SnackBarService } from "../../../service/snack-bar.service";

declare var bootstrap: any;
@Component({
  selector: "app-RT",
  standalone: true,
  templateUrl: "./realTimeDisplay.component.html",
  styleUrl: "./realTimeDisplay.component.scss",
  imports: [
    SharedModule,
    CommonModule,
    ColorSketchModule,
    AnnotationComponent,
    ContextmenuComponent,
    CdkMenu,
    CdkMenuItem,
    CdkContextMenuTrigger,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: true,
})
export class RealTimeDisplayComponent implements OnInit, AfterViewInit {
  @Input() rigTime: string = "";
  @Input()
  well: string;
  @Input()
  wellbore: string;
  @Input()
  lstOfTrack: ITracks[] = [];
  @Input()
  callingFrom: string = "Real Time";
  selectedWellboreLogIndex: number = 0;
  wellboreObjects: IWellboreObject[] = [];
  wellboreLogObjects: IWellboreObject[] = [];
  wellboreMudlogObjects: IWellboreObject[] = [];
  wellboreObjects2: IWellboreObject[] = [];
  
  logHeaderData: any;
  selectedLog: any;
  selectedIndex: number = 3;
  holeDepth: number = 0;
  bitDepth: number = 0;
  lastselectedDate: Date = new Date();
  plot: Plot = new Plot();
  indexCurveTime: Date[] = [];
  indexCurveDepth: number[] = [];
  indexCurveTVD: number[] = [];
  indexCurveTimeDepthForShowMarker: number[] = [];
  plotMinDepth: number = 4500;
  plotMaxDepth: number = 10000;
  lstHours: number[] = [24, 12, 6, 4, 2, 1];
  selectedHour: number = 4;
  autoScrollText: string = "On";
  isAutoScroll: boolean = true;
  _defaultZoomLimits: any;
  isFitToheight: boolean = false;
  selectedMnemonic: any;
  selectedLoogged: string = "";
  imageSrc: any;
  isLiveTracking = false;
  showCharConfig: boolean = false;
  colorpickerValue: string = "#333333";
  showLoading: boolean = false;
  toastHeader: string;
  toastMessage: string;
  _symbolPrototypes: Record<string, SvgPainter> = {};
  darkMode: boolean = true;
  _selector = new Selector();
  listOfTracks: ITracks[] = [];
  anchorTypes: string[] = ["None", "Left", "Right", "Center"]; //Object.keys(AnchorType);
  hideHeader: boolean = false;
  swtichToTvd: boolean = false;
  trajectoryData: any;
  directionalSVG = "";
  flageMud: boolean = false;
  lstRtocComment: any;
  isFirstTimeLoading: boolean = true;
loadNextSetOfData:boolean=false;
showFetchingabel:boolean=false;

  lstHourss: number[] = [24, 12, 6, 4, 2, 1];
  lstTrackTypes: string[] = [
    "Linear",
    "Logarithimic",
    "Index",
    "Mudlog",
    "Image",
    "Comments",
  ];
  lstLineStyle: ILinePattern[] = [
    { name: Patterns.Solid, style: "___________" },
    { name: Patterns.Dash, style: "---------------" },
    { name: Patterns.Dot, style: "....................." },
  ];
  selectedTrackType: string = "Linear";
  trackTitle: string = "";
  logWidget: WellLogWidget = new WellLogWidget();
  showTrajectoryData: boolean = false;
  selectedTrajData: any;
  showSurvey: boolean = false;
  horizontalOrientaion: boolean = false;
  mudLogDepth: number[] = [];
  mudLogDepthLith: string[] = [];
  //logDataLithologies: any[] = [];
  litTypes: string[] = []; // Dictionary for the lithology types index.
  selectedWellbore: any;
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  showAnnotationForm = false;
  annotationcomments: string = "";

  rgDep: number = this.plotMinDepth - this.plotMaxDepth; // Range of depth.

  activeObjects: any;
  height: string;
  width: string;
  canvasheight: string;

  patternFactory = PatternFactory.getInstance();
  tLithFill: LogFill[] = [];

  messages: string[] = [];
  messagesDepth: any[] = [];
  messagesTime: any[] = [];
  _indexDepth: number[] = [];
  commentsUid: string = "";
  annotationseverity: string = "";
  annotationprobability: string = "";
  annotationtype: string = "";
  flageComments = false;
  //@ViewChild('canvas', { static: false }) canvas!: ElementRef;
  @ViewChild("contextMenu", { static: false })
  contextMenu!: ContextmenuComponent;

  @ViewChild("logCanvas", { static: false }) canvasToPlot: ElementRef;
  @ViewChild("selectedLogs", { static: false }) logs: ElementRef;
  @ViewChild("modelForSurvey", { static: false }) selectedSurveyData: any;
  ctx: any;
  Within5Minutes: boolean;
  clickedDepth: number;
  clickedTime: Date;
lstComments:any;
lastselectedTvdVal:number;
  intervalTimer: any;

  DEFAULT_HEADER_FONT_STYLE = {
    color: "#5A5A5A",
    font: "12px Arial",
  };
  initialPlotRange: number;
  remarksLogArray: any;
  remarksDataObj: any;
  mlgDrillDepthValuesArray: any;
  drillingRemarksData: any;
  gasRemarksData: any;
  constructor(
    private elementRef: ElementRef,
    private staticTemplateSharedService: StaticTemplateSharedService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    public wellService: WellDataService,
    private cdr: ChangeDetectorRef,
    private activeWellboreObjects: ActiveWellboreObjectsService,
    private logdataservice: LogPlotDataService,
    private snackBarService: SnackBarService
  ) {}

  contextMenuClicked(item: string)
  {
switch(item)
{
  case 'Reset':
    this.ZoomReset();
    break;
    case 'ShowProperties':
    this.showCharConfig =!this.showCharConfig;
    break;
}

  }

  onRightClick(event: MouseEvent) {
    event.preventDefault();
    //this.contextMenuVisible = true;
    
    this.contextMenuPosition = { x: event.clientX -100, y: event.clientY-100 };
    const rect = this.canvasToPlot.nativeElement;

    const x = event.clientX - rect.offsetLeft;
    const y = event.clientY - rect.offsetTop;

    let selecta = new Point();
    selecta.x = x;
    selecta.y = y;
    const nodes = this._selector.select(this.logWidget, x, y, 2);

    const manipulatorLayer: any = this.logWidget.getTrackManipulatorLayer();
    const manipulatorPoint: any = manipulatorLayer
      .getSceneTransform()
      .inverseTransformPoint(selecta);
    const clickedDepth = manipulatorPoint.getY();
    this.clickedDepth = parseFloat(clickedDepth.toFixed(2)); //parseFloat()

    this.annotationcomments = "";
    this.commentsUid = "";
    let lstRtocComment: any[] = [];
    this.lstOfTrack.forEach((comment) => {
      if (comment.comments.messages) {
        lstRtocComment = comment.comments.messages;
      }
    });

    let depths: any[] = [];
    let isDepth = false;
    this.lstOfTrack.forEach((trackInfo) => {
      if (trackInfo.isDepth) {
        isDepth = true;
      }
    });
    if (isDepth) {
      depths = this.indexCurveDepth.map(
        (_val, i) =>
          this.plotMinDepth +
          (i * (this.plotMaxDepth - this.plotMinDepth)) /
            (this.indexCurveDepth.length - 1),
      );
    } else {
      depths = this.indexCurveTime.map(
        (_val, i) =>
          this.plotMinDepth +
          (i * (this.plotMaxDepth - this.plotMinDepth)) /
            (this.indexCurveTime.length - 1),
      );
    }

    let index = -1;
    let lastValue = -1;
    depths.forEach((dep, i) => {
      if (dep == clickedDepth) {
        index = i;
      } else if (
        index == -1 &&
        dep > clickedDepth &&
        lastValue < clickedDepth
      ) {
        index = i;
      }

      lastValue = dep;
    });

    let message: string = "";
    if (isDepth) {
      let selectedDepth = this.indexCurveDepth[index];

      lstRtocComment.forEach((commentArray) => {
        let x = commentArray.md["#text"];
        if (
          selectedDepth == x ||
          (x != 0 && selectedDepth - x < 1 && selectedDepth - x > -1)
        ) {
          message = commentArray.messageText;
          this.commentsUid = commentArray.uid;
          this.annotationtype = commentArray.typeMessage;
          this.annotationprobability = commentArray.warnProbability;
          this.annotationseverity = commentArray.severity;
        }
      });
      this.clickedDepth = selectedDepth;
    } else {
      let timeStamp = this.indexCurveTime[index];
      let dateObject = new Date(timeStamp);
      dateObject.setHours(dateObject.getHours()); //+ 3
      let timeStampFormatted =
        formatDate(dateObject, "yyyy-MM-ddTHH:mm", "en", "GMT") + ".000z";
      lstRtocComment.forEach((commentArray) => {
        let dTime = new Date(commentArray.dTim);
        let cDate = new Date(dTime.getTime() + 5 * 60000);
        let lesDate = new Date(dTime.getTime() - 5 * 60000);

        let z = formatDate(dTime, "yyyy-MM-ddTHH:mm", "en", "GMT") + ".000z";
        let x = formatDate(cDate, "yyyy-MM-ddTHH:mm", "en", "GMT") + ".000z";
        let y = formatDate(lesDate, "yyyy-MM-ddTHH:mm", "en", "GMT") + ".000z";
        this.Within5Minutes = this.areTimesWithin5Minutes(dateObject, dTime);
        if (this.Within5Minutes) {
          message = commentArray.messageText;
          this.commentsUid = commentArray.uid;
          this.annotationtype = commentArray.typeMessage;
          this.annotationprobability = commentArray.warnProbability;
          this.annotationseverity = commentArray.severity;
        }

      });
      this.clickedTime = timeStamp;
    }
    this.annotationcomments = message;
  }

  areTimesWithin5Minutes(time1: Date, time2: Date): boolean {
    const timeDiff = Math.abs(time1.getTime() - time2.getTime());
    const timeDiffInMinutes = timeDiff / (1000 * 60);
    return timeDiffInMinutes <= 2;
  }
  openAnnotationForm() {
    this.contextMenuVisible = false;
    this.showAnnotationForm = true;
    this.dialog.open(AnnotationComponent, {
      data: {
        depth: this.clickedDepth,
        time: this.clickedTime,
        message: this.annotationcomments,
        uid: this.commentsUid,
      },
    });
    // this.dialog.open(AnnotationComponent);
  }

  closeAnnotationForm() {
    this.showAnnotationForm = false;
    this.contextMenuVisible = false;
  }

  ngAfterViewInit(): void {

    this.ctx = this.canvasToPlot.nativeElement.getContext("2d");
    this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
    this.ctx.fillRect(
      0,
      0,
      this.canvasToPlot.nativeElement.width,
      this.canvasToPlot.nativeElement.height,
    );
    if (this.commentsUid != "") {
      this.flageComments = true;
    }

    this.canvasToPlot.nativeElement.addEventListener(
      "contextmenu",
      (event: any) => {
        event.preventDefault();
        const rect = this.canvasToPlot.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const canvasHeight = this.canvasToPlot.nativeElement.offsetHeight;
    
    
  const contextMenuHeight = this.contextMenu.getHeight();

    let finalY = y;
    if (y + contextMenuHeight > canvasHeight) {
      finalY = y - contextMenuHeight;
    }

    this.contextMenu.open(x, finalY);
     
        this.contextMenu.setlogLogweget(this.logWidget);
        this.contextMenu.setlogdefaultLimt(this._defaultZoomLimits);
        this.contextMenu.setShowProperties(this.showCharConfig);
        this.contextMenu.setAnnotation(
          this.dialog,
          this.clickedDepth,
          this.clickedTime,
          this.annotationcomments,
          this.commentsUid,
          this.flageComments,
          this.well,
          this.wellbore,
          this.annotationtype,
          this.annotationseverity,
          this.annotationprobability,
        );
      },
    );
    this.drawPlot();
    (async () => {
      
      this.wellboreObjects = await this.wellService.getLogHeaders(
        this.well,
        this.wellbore,
      );
      console.log('this.wellboreObjects  ',this.wellboreObjects )
    })();

    setInterval(() => {
      
        let lowlimtPercentageValue= ((this.plotMaxDepth- this.plotMinDepth) *10/100) +this.plotMinDepth;
 let limts= this.logWidget.getVisibleDepthLimits();
      if (!this.isLiveTracking && this.isAutoScroll && limts.low>lowlimtPercentageValue ) {
       this.isLiveTracking = true;

       this.getLiveTrackCurveInfo();
      }
      else
      {
  this.isFirstTimeLoading = false;}
        if(limts.low<lowlimtPercentageValue && limts.high <9500  && !this.loadNextSetOfData )
{
  this.isAutoScroll=false;
this.loadNextSetOfData=true;
this.cdr.detectChanges();
this.processingPreviousData=true;
    this.getAllDataForAllTrack();
}
    }, 1000 * 10 * 1);
    if(this.callingFrom!="Real Time")
{
  //this.canvasheight= parent.clientHeight+'px';
  this.createScene();
}
  }
  selectedTrack(pSelectedTrack: any, trackIndex: number) {
    this.lstOfTrack[trackIndex].isIndex = false;
    this.lstOfTrack[trackIndex].isMudLog = false;
    this.lstOfTrack[trackIndex].comments = [];
    switch (pSelectedTrack.target.value) {
      case "Index":
        this.lstOfTrack[trackIndex].isIndex = true;
        break;
      case "Mudlog":
        this.lstOfTrack[trackIndex].isMudLog = true;
        break;
      case "Image":
        this.lstOfTrack[trackIndex].isImage = true;
        break;
      case "Comments":
        this.getComments(trackIndex); // this.lstOfTrack[trackIndex].isImage=true;
    }
  }

  displayLastValue(selectedLabel: string): string {
    let labelValue: number = 0;

    // Iterate through tracks in lstOfTrack
    this.lstOfTrack.forEach((track, trackIndex) => {
      // Iterate through curves in each track
      track.curves.forEach((_curve, curveIndex) => {
        const curve_config = this.lstOfTrack[trackIndex].curves[curveIndex];

        if (curve_config.mnemonicId === selectedLabel) {
          labelValue = this.wellService.getLastValueOfCurve(
            curve_config.data,
            curve_config.data.length - 1,
          );
        }

        // console.log(JSON.stringify(curve_config))
      });
    });
    return labelValue.toString();
  }
  selectedLogEvent(
    pSelectedLog: any,
    trackNo: number,
    curveDisplayOrder: number,
  ) {
    let selectedlogObject: any;
    let logIndex: number = 0;
    this.wellboreObjects.forEach((val, _logIndex) => {
      if (val.objectId == pSelectedLog.target.value) {
        selectedlogObject = val;
        logIndex = _logIndex;
        return;
      }
    });
    if (logIndex > 0) {
      let trackIndex = this.lstOfTrack.findIndex(
        (obj) => obj.trackNo == trackNo,
      );
      let curveIndex = this.lstOfTrack[trackIndex].curves.findIndex(
        (obj) => obj.displayOrder == curveDisplayOrder,
      );
      this.lstOfTrack[trackIndex].curves[curveIndex].mnemonicLst = [];
      this.lstOfTrack[trackIndex].curves[curveIndex].wellId =
        this.wellboreObjects[logIndex].wellId;
      this.lstOfTrack[trackIndex].curves[curveIndex].wellboreId =
        this.wellboreObjects[logIndex].wellboreId;
      this.lstOfTrack[trackIndex].curves[curveIndex].LogId =
        pSelectedLog.target.value;
      this.lstOfTrack[trackIndex].curves[curveIndex].mnemonicId = "";
      this.wellboreObjects[logIndex].objectInfo.forEach((obj) => {
        if (this.wellboreObjects[logIndex].indexCurve != obj.mnemonic) {
          let mnemonic: IMnemonic = {
            mnemonicDescp: obj.mnemonic,
            mnemonicId: obj.mnemonicId,
          };
          this.lstOfTrack[trackIndex].curves[curveIndex].mnemonicLst.push(
            mnemonic,
          );
        }
      });
    }
  }

  selectedMnemonicEvent(
    pSelectedMnemonic: any,
    trackNo: number,
    curveDisplayOrder: number,
  ) {
    this.showLoading = true;
    let selectedlogObject: any;
    let logIndex: number = -1;
    let trackIndex = this.lstOfTrack.findIndex((obj) => obj.trackNo == trackNo);
    let curveIndex = this.lstOfTrack[trackIndex].curves.findIndex(
      (obj) => obj.displayOrder == curveDisplayOrder,
    );

    let dataExist = false;
    this.wellboreObjects.forEach((val, _logIndex) => {
      if (
        val.objectId == this.lstOfTrack[trackIndex].curves[curveIndex].LogId
      ) {
        selectedlogObject = val;
        val.objectInfo.forEach((val) => {
          if (val.mnemonicId == pSelectedMnemonic.target.value) {
            if (val.data.length > 0) {
              this.lstOfTrack[trackIndex].curves[curveIndex].data = val.data;
              this.lstOfTrack[trackIndex].curves[curveIndex].min = val.min;
              this.lstOfTrack[trackIndex].curves[curveIndex].max = val.max;
              this.lstOfTrack[trackIndex].curves[curveIndex].color = val.color;
              this.lstOfTrack[trackIndex].curves[curveIndex].autoScale =
                val.autoScale;
              this.lstOfTrack[trackIndex].curves[curveIndex].displayName =
                val.mnemonic; //pSelectedMnemonic.target.value;
              this.lstOfTrack[trackIndex].curves[curveIndex].isDepth =
                selectedlogObject.isDepth;
              this.lstOfTrack[trackIndex].curves[curveIndex].unit = val.unit;
            }
          }
        });
        logIndex = _logIndex;
        this.showLoading = false;
        return;
        return;
      }
    });
    if (!dataExist) {
      this.showLoading = true;
      this.getLogData(
        selectedlogObject,
        logIndex,
        false,
        trackIndex,
        curveIndex,
        pSelectedMnemonic.target.value,
      );
    } else {
      this.drawPlot();
      this.createScene();
    }
  }
  onGeneralSettingsChange() {
    if (this.plot) {
      this.plot.dispose();
    }
    if (this.lstOfTrack.length > 0) {
      this.getLiveTrackCurveInfo();
    } else {
      this.drawPlot();
      this.createScene();
    }
    this.wellService.setHeader(this.hideHeader,this.logWidget);
  }
  
  canvasMouseleave()
  {
     const divs = document.querySelectorAll('.cg-track-tooltip-container');
divs.forEach(div => div.remove());
       
  }
  setHideHeader() {
    this.drawPlot();
    this.createScene();
  }
  onSwithcToTvd() {
    this.swtichToTvd = !this.swtichToTvd;
    if (this.swtichToTvd) {
      this.indexCurveTVD = [];
      let trajectoryStation: any[] = this.trajectoryData.trajectoryStation;
      trajectoryStation.forEach((trajectory) => {
        this.indexCurveTVD.push(Number(parseFloat(trajectory.tvd).toFixed(2)));
      });
    }
    this.drawPlot();
    this.createScene();
  }
  onShowSurvey() {
    this.drawPlot();
    this.createScene();
  }
  
  getLiveTrackCurveInfo() {
    this.showLoading = true;
    let tempLst: string[] = [];

    this.swtichToTvd = this.staticTemplateSharedService.swtichToTVD;
    this.showSurvey = this.staticTemplateSharedService.showSurvey;
       this.wellboreObjects.forEach((wellbore, index) => {
        this.lstOfTrack.forEach((trackCurve,trackIndex) => {
        trackCurve.curves.forEach((curve, index) => {
          let trackLogId=this.wellService.getLogObjectFullName(curve.LogId);
           if(!!trackLogId && this.isFirstTimeLoading)
          {

this.lstOfTrack[trackIndex].curves[index].LogId=trackLogId;
if(this.lstOfTrack[trackIndex].curves[index].mnemonicLst.length==0){
this.lstOfTrack[trackIndex].curves[index].mnemonicLst=[];
wellbore.objectInfo.forEach((obj) => {
        if (wellbore.indexCurve != obj.mnemonic && wellbore.objectName==trackLogId) {
          let mnemonic: IMnemonic = {
            mnemonicDescp: obj.mnemonic,
            mnemonicId: obj.mnemonicId,
          };
          this.lstOfTrack[trackIndex].curves[index].mnemonicLst.push(
            mnemonic
          );
        }
      });
    }

          }
          let logIndex = tempLst.findIndex(x => x == trackLogId);
          if (logIndex < 0 && trackLogId == wellbore.objectName) {
          
            this.getSurveyData();           
            this.getComments(0);
            this.getLogData(wellbore, index,!this.isFirstTimeLoading );
           
            tempLst.push(trackLogId);
          }
        });
      });
    });
 if(this.wellboreObjects.length==0 || this.lstOfTrack.length==0){
   this.isLiveTracking = false;
   
 }
  this.showLoading = false;
  }

   getAllDataForAllTrack() {
   let tempLst: string[] = [];
   
this.processingPreviousData=true;

    this.wellboreObjects.forEach((wellbore, wellboreindex) => {
      this.lstOfTrack.forEach((trackCurve,trackIndex) => {
        trackCurve.curves.forEach((curve, index) => {
          let trackLogId=this.wellService.getLogObjectFullName(curve.LogId);

          let logIndex = tempLst.findIndex(x => x == trackLogId);
          if (logIndex < 0 && trackLogId == wellbore.objectName ) {
            
            this.getLogData1(wellbore, index,wellboreindex );
            tempLst.push(trackLogId);
          }
        });
      });
    });

  }

  getSurveyData() {
  //  this.trajectoryData =[];
    this.wellService.getTrajectoryData("", this.well, this.wellbore, 0, 0).subscribe(response => {
      this.trajectoryData =[];
      this.trajectoryData = response;
      this.staticTemplateSharedService.surveyData=this.trajectoryData;
      //console.log('this.staticTemplateSharedService.surveyData ',JSON.stringify(this.staticTemplateSharedService.surveyData))
      const lastTrajectoryStation = this.trajectoryData.trajectoryStation[this.trajectoryData.trajectoryStation.length - 1];
      this.staticTemplateSharedService.azimuthLatData=lastTrajectoryStation.azi;
      this.staticTemplateSharedService.inclinationData=lastTrajectoryStation.incl;

    });
  }

  getComments(trackIndex: number) {
    this.lstComments = [];
    this.wellService
      .getComment(this.well, this.wellbore)
      .subscribe((response) => {
        this.lstComments = response;
      });
  }
  getLogData(
    selectedlogObject: IWellboreObject,
    logIndex: number,
    isLiveData: boolean = false,
    trackIndex: number = -1,
    curveIndex: number = -1,
    pSelectedMnemonic: string = "",
    callback?: () => void,
  ) {
    let startval: any;
    let endval: any;
    let isDepth = false;
    let tempMDforTvd: any[] = [];
    if (selectedlogObject.isDepth) {
      isDepth = true;
      if (this.swtichToTvd) {
        if (this.trajectoryData && this.trajectoryData.trajectoryStation) {
          this.indexCurveTVD = [];
          let trajectoryStation: any[] = this.trajectoryData.trajectoryStation;
          trajectoryStation.forEach((trajectory) => {
            this.indexCurveTVD.push(
              Number(parseFloat(trajectory.tvd).toFixed(2)),
            );
            tempMDforTvd.push(Number(parseFloat(trajectory.md).toFixed(2)));
          });
          startval = this.indexCurveTVD[0];
          if (
            this.lastselectedTvdVal !=
            this.indexCurveTVD[this.indexCurveTVD.length - 1]
          ) {
            endval = this.indexCurveTVD[this.indexCurveTVD.length - 1];
            this.lastselectedTvdVal =
              this.indexCurveTVD[this.indexCurveTVD.length - 1];
          }
        }
      } else if (!isLiveData) {
        startval = selectedlogObject.startIndex;
        endval = selectedlogObject.endIndex;
      } else {
        startval = Number(selectedlogObject.endIndex) + 1;
        endval = Number(selectedlogObject.endIndex) + 2000;
      }
    } else {
      let mindate = new Date();
      let currDate = new Date();
      let lastRigtime = new Date(selectedlogObject.endIndex);
      if ((lastRigtime < new Date() && this.lstOfTrack[0].curves[0].data.length == 0) || (!isLiveData && this.indexCurveTime[0]<=selectedlogObject.endIndex)) 
        {
        mindate = lastRigtime;
        mindate.setHours(lastRigtime.getHours() - this.selectedHour);
        this.indexCurveTime = [];
      } else if(this.indexCurveTime[0]<=selectedlogObject.endIndex) {
        mindate = new Date(selectedlogObject.endIndex); //this.lastselectedDate;

        mindate.setSeconds(mindate.getSeconds() + 1);
      }
      this.lastselectedDate = currDate;
      startval =
        formatDate(mindate, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") + ".000z";
      endval =
        formatDate(currDate, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") + ".000z";
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
      mnemonicList: "",
    };

    this.wellService.getLogData(queryParameter).subscribe(
      (response) => {
        if(queryParameter?.logName?.includes('MLG_DRILLRMK_TIME')){
          this.handleRemarksData(response, 'drill-remarks')
          return;
        }
        if(queryParameter?.logName?.includes('MLG_GASRMK_TIME')){
          this.handleRemarksData(response, 'gas-remarks')
          return;
        }
      
        let logData: any = response;
        if (logData.code !== undefined && logData.code == "404") {
          this.showToast("Response", logData.message);
          this.showLoading = false;
          this.isLiveTracking = false;
          return;
        }

        if (logData.logs == undefined) {
          //this.showToast("Response", "No Data");
          this.showLoading = false;
          this.isLiveTracking = false;
          return;
        }
        var x: [] = logData.logs[0].logData.data;
        if (!Array.isArray(x)) {
          this.showLoading = false;
          this.isLiveTracking = false;
          return;
        }

        if (selectedlogObject.isDepth) {
           if (!isLiveData){
          this.indexCurveDepth = [];
         selectedlogObject.objectInfo.forEach((mnemonicInfo, mnemonicIndex) => {
           selectedlogObject.objectInfo[mnemonicIndex].data=[];
                     });

        }
                     selectedlogObject.endIndex= logData.logs[0].endIndex;
                    
        }
        else {
           if (!isLiveData){
          this.indexCurveTime = []; this.indexCurveTimeDepthForShowMarker=[];
             selectedlogObject.objectInfo.forEach((mnemonicInfo, mnemonicIndex) => {
           selectedlogObject.objectInfo[mnemonicIndex].data=[];
                     });
        }
           selectedlogObject.endIndex= logData.logs[0].endDateTimeIndex;
        }

        var unitList: any[] = String(logData.logs[0].logData.unitList).split(
          ",",
        );

        String(logData.logs[0].logData.mnemonicList)
          .split(",")
          .map((val, mindex) => {
            selectedlogObject.objectInfo.forEach(
              (mnemonicInfo, mnemonicIndex) => {
                if (mnemonicInfo.mnemonicId == val) {
                  if (this.swtichToTvd) {
                    selectedlogObject.objectInfo[mnemonicIndex].data = [];
                  }
                  x.forEach((row) => {
                    String(row)
                      .split(",")
                      .map((val, dataIndex) => {
                        if (dataIndex == mindex) {
                          if (val == "" || val == undefined) {
                            if ( selectedlogObject.objectInfo[mnemonicIndex].data.length > 0 ) {
                              let memVal =selectedlogObject.objectInfo[mnemonicIndex]
                                  .data[selectedlogObject.objectInfo[mnemonicIndex].data.length - 1 ];
                              selectedlogObject.objectInfo[
                                mnemonicIndex
                              ].data.push(memVal);
                            } else {
                              selectedlogObject.objectInfo[
                                mnemonicIndex
                              ].data.push(Number.NaN);
                            }
                          } else {
                            selectedlogObject.objectInfo[
                              mnemonicIndex
                            ].data.push(val);
                          }
                          selectedlogObject.objectInfo[mnemonicIndex].unit = unitList[mindex];
                          if(mnemonicInfo.mnemonicId == selectedlogObject.indexCurve) {
                            if (isDepth) {
                              this.indexCurveDepth.push(Number(val));
                            } else {
                           //   this.indexCurveTime.push(new Date(val));
                            }
                          }
                        }
                      });
                  });
                }
              },
            );
          });
        if (this.swtichToTvd) {
          let indexArray: any[] = [];
          tempMDforTvd.forEach((val) => {
            let findIndex = this.indexCurveDepth.findIndex(
              (e) => e == val || (e - val < 1 && e - val > 0),
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
              selectedlogObject.objectInfo[index].min =
                this.getMinValue(tempCurveTvdData);
              selectedlogObject.objectInfo[index].max =
                this.getMaxValue(tempCurveTvdData);
            }
          });
        } else {
          selectedlogObject.objectInfo.forEach((mnemonic, index) => {
            if (mnemonic.mnemonic != selectedlogObject.indexCurve) {
              selectedlogObject.objectInfo[index].min = this.getMinValue(
                mnemonic.data,
              );
              selectedlogObject.objectInfo[index].max = this.getMaxValue(
                mnemonic.data,
              );
            }
          });
        }
        this.wellboreObjects[logIndex] = selectedlogObject;

var logID= this.wellService.getLogObjectFullName(this.lstOfTrack[0].curves[0].LogId);
      if(selectedlogObject.objectId ==logID )
        {
          if(selectedlogObject.isDepth && logID.includes("Surface_Depth")){
        this.staticTemplateSharedService.dataDepth=selectedlogObject.objectInfo;

          }
          else if(logID.includes("Surface_Time"))
          {
        this.staticTemplateSharedService.dataTime=selectedlogObject.objectInfo;
       
          }
        }
        selectedlogObject.objectInfo.forEach((val) => {

          if (
            !selectedlogObject.isDepth &&
            val.mnemonicId.toLowerCase() == "depth"
          ) {
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
               
                this.lstOfTrack[trackIndex].curves[index].mnemonic =
                  val.mnemonic;
                this.lstOfTrack[trackIndex].curves[index].isDepth =
                  selectedlogObject.isDepth;
                this.lstOfTrack[trackIndex].curves[index].unit = val.unit;
                this.lstOfTrack[trackIndex].curves[index].mnemonicList =
                  val.mnemonicLst;
              }
            });
          });
          //}
        });

        if (callback) {
          callback();
        }
//this.plotMinDepth=0;
//this.plotMaxDepth=this.indexCurveTime.length;
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
        this.showToast(
          "Error On Retreiving",
          "Error Reteriving Curve Info " + error,
        );
        this.showLoading = false;
      },
    );
  }
  processingPreviousData:boolean=false;
  getLogData1(
    selectedlogObject: IWellboreObject,
    logIndex: number,
    selctedwellboreIndex:number
  ) {
    let startval: any;
    let endval: any;
    let isDepth = false;
    let tempMDforTvd: any[] = [];
    let tempTimeIndexData:any[]=[];
    let tempDepthIndexData:any[]=[];
    if (selectedlogObject.isDepth) {
      isDepth = true;
      
        startval = selectedlogObject.startIndex;
        endval = selectedlogObject.endIndex;
     
    } else {
      let startRigtime = new Date(selectedlogObject.startIndex);
      if(this.indexCurveTime.length==0)
      {
        this.processingPreviousData=false;
        this.loadNextSetOfData=false;
        return;
      }
     let mindate = new Date(this.indexCurveTime[0]);
      let lastRigtime = new Date(this.indexCurveTime[0]);

      mindate.setHours(mindate.getHours() - 4);
lastRigtime.setSeconds(lastRigtime.getSeconds() - 1);
      if(mindate<startRigtime)
        {
          this.processingPreviousData=false;
        this.loadNextSetOfData=false;
        return;
        }

      startval = formatDate(mindate, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") + ".000z";
      endval =   formatDate(lastRigtime, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") + ".000z";
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
      mnemonicList: "",
    };
this.showFetchingabel=true;
    this.wellService.getLogData(queryParameter).subscribe(
      (response) => {
        //toastMsg

        let logData: any = response;
        if (logData.code !== undefined && logData.code == "404") {
        this.processingPreviousData=false;
        this.loadNextSetOfData=false;
          return;
        }

        if (logData.logs == undefined) {
        this.processingPreviousData=false;
        this.loadNextSetOfData=false;
          return;
        }
        var x: [] = logData.logs[0].logData.data;
        if (!Array.isArray(x)) {
        this.processingPreviousData=false;
        this.loadNextSetOfData=false;
          return;
        }

        var unitList: any[] = String(logData.logs[0].logData.unitList).split(
          ",",
        );

        String(logData.logs[0].logData.mnemonicList)
          .split(",")
          .map((val, mindex) => {
            selectedlogObject.objectInfo.forEach(
              (mnemonicInfo, mnemonicIndex) => {
                if (mnemonicInfo.mnemonicId == val) {
                 let tempDat:any[]=[];
                  x.forEach((row) => {
                    String(row)
                      .split(",")
                      .map((val, dataIndex) => {
                        if (dataIndex == mindex) {
                          if (val == "" || val == undefined) {
                            if (tempDat.length > 0  ) {
                              let memVal = tempDat[tempDat.length - 1];
                              tempDat.push(memVal);
                            } else {
                              tempDat.push(Number.NaN);
                            }
                          } else {
                           tempDat.push(val);
                          }
                             if (mnemonicInfo.mnemonicId == selectedlogObject.indexCurve) {
                            if (isDepth) {
                              this.indexCurveDepth.push(Number(val));
                            } else {
                              if(!tempTimeIndexData.includes(new Date(val))){
                              tempTimeIndexData.push(new Date(val));
                              }
                            }
                          }
                                                  }
                      });
                  });
                  selectedlogObject.objectInfo[mnemonicIndex].data=this.insertDataAtBeginning(selectedlogObject.objectInfo[mnemonicIndex].data, tempDat)
                }
              },
            );
          });
      
this.processingPreviousData=false;

this.loadNextSetOfData=true;
this.drawPlot();
        this.createScene();
      }
    );
  
  }
  insertDataAtBeginning(existingData: any[], newData: any[]): any[] {
  // Insert new data at the beginning of the existing data
  existingData.unshift(...newData);
  
  return existingData;
}
  //
  getMinValue(values: number[]) {
    let minVal = 0;
    if (values.length > 0) {
      const depths = values.map(
        (_val, i) =>
          this.plotMinDepth +
          (i * (this.plotMaxDepth - this.plotMinDepth)) / (values.length - 1),
      );
      const data = new LogData(depths, values);
      minVal =
        data.getMinValue() < 50
          ? Math.floor(data.getMinValue())
          : Math.floor(data.getMinValue() / 50) * 50;
    }
    return minVal;
  }
  getMaxValue(values: number[]) {
    let maxVal = 0;
    if (values.length > 0) {
      const depths = values.map(
        (_val, i) =>
          this.plotMinDepth +
          (i * (this.plotMaxDepth - this.plotMinDepth)) / (values.length - 1),
      );
      const data = new LogData(depths, values);
      maxVal =
        data.getMaxValue() < 50
          ? Math.ceil(data.getMaxValue())
          : Math.ceil(data.getMaxValue() / 50) * 50;
    }
    return maxVal;
  }
  //  onContainerResize(event: any) {
  //   // Set canvas dimensions to match container
  //  const parent = this.elementRef.nativeElement.parentElement;
  //     this.height = parent.clientHeight +'px';
  //     this.width= parent.clientWidth +'px';

  // }
  ngOnInit(): void {
    this.initialPlotRange = this.plotMaxDepth - this.plotMinDepth;
 const parent = this.elementRef.nativeElement.parentElement;
    this.height = parent.clientHeight +'px';
    this.width= parent.clientWidth -200 +'px';


    this.getLiveTrackCurveInfo();
    this.horizontalOrientaion=this.staticTemplateSharedService.horizontalOrientation;
    this.wellService.getDirectionalSvg().subscribe((response) => {
      this.directionalSVG = response;
    });
  }

  drawPlot() {
    if (this.plot) {
      this.plot.dispose();
    }
    // this.logWidget = createWellLogWidget().loadTemplate(JSON.stringify(myTemp));;
    this.logWidget = createWellLogWidget();

    this.plot = new Plot({
      canvaselement: this.canvasToPlot.nativeElement,
      root: this.logWidget,
    });
  }

  getSvgSymbolPrototype(symbolType: string, angle: number) {
    let SVG_FILES: Record<string, string> = {
      directional: this.directionalSVG,
    };
    let angleCurve = angle / 10;
    let angleCurve1 = -1 * (angleCurve + 1);

    //if (this._symbolPrototypes[symbolType] == null) {
    let finalSVG = SVG_FILES[symbolType].replace("{angle}", "-" + angle);
    finalSVG = finalSVG.replaceAll("{angleCurve}", angleCurve.toString());
    finalSVG = finalSVG.replace("{angleCurve1}", angleCurve1.toString());
    const svgPainter = new SvgPainter({ xml: finalSVG });

    //  this._symbolPrototypes[symbolType] = svgPainter;
    //}

    return svgPainter;
  }
  processTemplate(painter: SvgPainter, json: Record<string, any>) {
    from(painter)
      .where((node) => node instanceof AbstractNode && node.getId() !== null)
      .execute((node) => {
        const properties = json[node.getId()];
        if (properties != null) {
          node.setProperties(properties);
        }
      });
    return painter;
  }
  getSVGSymbol(symbolXMl: string | SvgPainter, size?: number): SymbolShape {
    const svgPainter =
      symbolXMl instanceof SvgPainter ? symbolXMl : new SvgPainter(symbolXMl);
    const geometry: any = svgPainter.getGeometry();
    return new SymbolShape({
      cache: true,
      width: size || geometry.getModelLimits().getWidth(),
      height: size || geometry.getModelLimits().getHeight(),
      alignment: AnchorType.Center,
      sizeisindevicespace: true,
      painter: svgPainter,
    });
  }
  AddSurveyValues(
    indexCurveData: number[],
    surveyData: number[],
    dpethSurvey: number[],
    values: DepthSymbolType[],
    SurveyIncl: any[],
  ) {
    let depths: any[] = [];
    depths = indexCurveData.map(
      (_val, i) =>
        this.plotMinDepth +
        (i * (this.plotMaxDepth - this.plotMinDepth)) /
          (indexCurveData.length - 1),
    );

    surveyData.forEach((val, index) => {
      let findDepthIndex = indexCurveData.findIndex(
        (x) => Math.round(x) == Math.round(val),
      );
      if (findDepthIndex > -1) {
        dpethSurvey.push(depths[findDepthIndex]);
        values.push({
          symbol: "directional",
          value: {
            direction: SurveyIncl[index],
          },
        });
      }
    });
  }
  AddSurveyMarker(isDepth: boolean = false) {
    let SurveyIncl: number[] = [];
    let md: number[] = [];
    let tvd: number[] = [];
    let data: any[] = this.trajectoryData.trajectoryStation;
    let values: DepthSymbolType[] = [];
    let dpethSurvey: number[] = [];

    data.forEach((val) => {
      SurveyIncl.push(Number(parseFloat(val.incl).toFixed(2)));
      md.push(val.md);
      tvd.push(val.tvd);
    });

    let depths: any[] = [];

    if (this.swtichToTvd) {
      this.AddSurveyValues(
        this.indexCurveTVD,
        tvd,
        dpethSurvey,
        values,
        SurveyIncl,
      );
    } else if (isDepth) {
      this.AddSurveyValues(
        this.indexCurveDepth,
        md,
        dpethSurvey,
        values,
        SurveyIncl,
      );
    } else {
      this.AddSurveyValues(
        this.indexCurveTimeDepthForShowMarker,
        md,
        dpethSurvey,
        values,
        SurveyIncl,
      );
    }

    const mudLog = new LogMudLogSection<DepthSymbolType>()
      .setFillMode(FillMode.SymbolOnly)
      .setSymbolPosition(SymbolPosition.Left)
      .setSymbolMarginsStyle({
        left: "2mm",
      })
      .setPaddingStyle("1mm")
      .setDepthsAndValues(dpethSurvey, values);

    const symbolsCache: Record<number, any> = {};
    mudLog.setSymbols((_modelTop: number, value: any, index: any) => {
      //const svgPrototype = this.getSvgSymbolPrototype(value['symbol'], SurveyIncl[index]);
      const svgPrototype = this.getSvgSymbolPrototype(
        value["symbol"],
        value["value"]["direction"],
      );
      if (svgPrototype == null || svgPrototype.getSvg() == null) {
        return null;
      }

      if (symbolsCache[index] == null) {
        if (value == null) {
          return null;
        }
        const symbolValue = value["value"];
        const properties: Record<string, any> = {};
        for (const name in symbolValue) {
          if (symbolValue.hasOwnProperty(name)) {
            const prop = symbolValue[name];
            properties[name] = {
              text: typeof prop === "string" ? prop : prop.toFixed(1),
            };
          }
        }
        const SVGPainter = this.processTemplate(
          svgPrototype.clone(),
          properties,
        );
        symbolsCache[index] = this.getSVGSymbol(SVGPainter);
      }
      return symbolsCache[index];
    });
    // let selectedIndices: number[] = [];
    // mudLog.on('click', (event, sender, eventArgs) => {
    //     let newSelectedIndices = sender.getSelectedIndices(); //hitTest(eventArgs.getPlotPoint(), 5).map((s) => s.index);

    // });
    mudLog.on(PointerMode.Click, (_event, _sender, eventArgs) => {
      const position: any = eventArgs.getPlotPoint();
      const nodes = this._selector.select(
        this.logWidget,
        position.x,
        position.y,
        2,
      );
      if (nodes == null || nodes.length === 0) return;

      const manipulatorLayer: any = this.logWidget.getTrackManipulatorLayer();
      const manipulatorPoint: any = manipulatorLayer
        .getSceneTransform()
        .inverseTransformPoint(position);
      const depth = manipulatorPoint.getY();

      from(this.logWidget)
        .where((node) => node instanceof LogTrack)
        .select((track) => {
          const trackDimensions: any = track.getBounds();
          const headerHeight = this.logWidget.getHeaderHeight("auto");
          const trackIndex = this.logWidget.getTrackIndex(track);
          if (
            position.y > headerHeight &&
            position.x >= trackDimensions.getX() &&
            position.x < trackDimensions.getX() + trackDimensions.getWidth() &&
            this.lstOfTrack[trackIndex].isIndex) {
            //this.showTrajectoryData = true;
            document.getElementById("closeModal")?.addEventListener('click', this.closeTrajPopup);
            if (this.swtichToTvd) {
              this.selectedTrajtoDisplay(depth, this.indexCurveTVD, data, true);
            } else if (isDepth) {
              this.selectedTrajtoDisplay(depth, this.indexCurveDepth, data);
            } else {
              this.selectedTrajtoDisplay(
                depth,
                this.indexCurveTimeDepthForShowMarker,
                data,
              );
            }
          }
        });
    });

    return mudLog;
  }

  selectedTrajtoDisplay(
    depth: number,
    indexCurveData: any[],
    trajectoryData: any[],
    isTvd: boolean = false,
  ) {
    let depthIndex = -1;
    const depths = indexCurveData.map(
      (_val, i) =>
        this.plotMinDepth +
        (i * (this.plotMaxDepth - this.plotMinDepth)) /
          (indexCurveData.length - 1),
    );
    depths.forEach((val, index) => {
      if (depth >= val || index == 0) {
        depthIndex = index;
      }
    });
    let md = indexCurveData[depthIndex];
    let selectedTrajIndex = -1;
    trajectoryData.forEach((val, index) => {
      if (
        (isTvd && Math.round(md) >= Math.round(val.tvd)) ||
        (!isTvd && Math.round(md) >= Math.round(val.md)) ||
        index == 0
      ) {
        selectedTrajIndex = index;
      }
    });
    this.selectedTrajData =
      this.trajectoryData.trajectoryStation[selectedTrajIndex];
  }
  ChangeOrientation()
  {
    this.staticTemplateSharedService.horizontalOrientation= this.horizontalOrientaion;
if(this.horizontalOrientaion)
{
  
  this.logWidget.setOrientation(Orientation.Horizontal);
}
else
{
  
  this.logWidget.setOrientation(Orientation.Vertical);
}
  }
  loadDateTrajectory1() {
     const depths =  this.indexCurveTime.map(
      (_val, i) =>
        this.plotMinDepth +
        (i * (this.plotMaxDepth - this.plotMinDepth)) / ( this.indexCurveTime.length - 1),
    );
    let hints: any[]= [];
    depths.forEach((val,index)=>{
hints.push({'depth':val,'time':this.indexCurveTime[index]});

    });
    const dateTimeTrajectory = new LogDrillingSectionContainer();
    const data: LogDrillingSection.Options = {
        'depthfrom': this.plotMinDepth,
        'depthto': this.plotMaxDepth,
        'valuefrom': {'date': this.indexCurveTime[0]},
        'valueto': {'date': this.indexCurveTime[this.indexCurveTime.length-1]},
        'hint': hints
       //[{
        //     'depth': 200,
        //     'time': new Date('July 7, 2011 05:15 AM')
        // }, {
        //     'depth': 300,
        //     'time': new Date('July 7, 2011 05:30 AM')
        // }, {
        //     'depth': 400,
        //     'time': new Date('July 7, 2011 05:45 AM')
        // }]
    };
    dateTimeTrajectory.addSection(new LogDrillingSection(data));
    return dateTimeTrajectory;
}
  createScene() {
    this.lstOfTrack.forEach((trackInfo, _index) => {
      let trackType = TrackType.LinearTrack;
      if (trackInfo.trackType == "Logarithimic") {
        trackType = TrackType.LogTrack;
      }
      if (trackInfo.trackType == "Index") {
        let logsInTrack:any[]=[];
        
let lastIndexValue:any;
        this.lstOfTrack.forEach(trackIndeInfo=>{

          trackIndeInfo.curves.forEach(curve=>{
let trackLogId=this.wellService.getLogObjectFullName(curve.LogId);
            if(!logsInTrack.includes(trackLogId))
            {
logsInTrack.push(trackLogId);
            }
          });
        })
        let IndexCurveTimeData:any[]= [];
          this.wellboreObjects.forEach(wellboreObject=>{
            let logInTrackIndex= logsInTrack.findIndex(x=>x==wellboreObject.objectName);
            if(logInTrackIndex<0)
              return;
            wellboreObject.objectInfo.forEach(mnemonic=>{
              if(wellboreObject.indexCurve==mnemonic.mnemonicId)
              {
                if(!lastIndexValue || lastIndexValue <mnemonic.data[mnemonic.data.length-1]){
lastIndexValue=mnemonic.data[mnemonic.data.length-1];
IndexCurveTimeData=mnemonic.data;
                }
              }
            })
          });
          if(!trackInfo.isDepth)
          {
this.indexCurveTime=IndexCurveTimeData;
          }
        const track = new LogTrack()
          .setBounds(new Rect(20, this.plotMinDepth, 120, this.plotMaxDepth))
          .setDepthLimits(this.plotMinDepth, this.plotMaxDepth) // Set the track's minimum and maximum limits
          .enableClipping(true);
        const grid = new Grid(
          new AdaptiveTickGenerator()
            .setVisibleTickGrade("minor", false)
            .setTickStyle("major", {
              width: 0,
            }),
        );

        if (
          this.indexCurveTime.length > 0 &&
          trackInfo.isDepth.toString() == "false"
        ) {
   
          track
            .setName("Rig Time")
            .addChild(this.createCurveIndex(this.indexCurveTime))
            .addChild(grid);
        } else if (trackInfo.isDepth.toString() == "true") {
          if (this.swtichToTvd ||this.staticTemplateSharedService.swtichToTVD) {
            if (
              this.indexCurveTVD.length == 0 &&
              this.trajectoryData.trajectoryStation
            ) {
              let trajectoryStation: any[] =
                this.trajectoryData.trajectoryStation;
              trajectoryStation.forEach((trajectory) => {
                this.indexCurveTVD.push(
                  Number(parseFloat(trajectory.tvd).toFixed(2)),
                );
              });
            }
            track
              .setName("TVDepth")
              .addChild(this.createCurveIndex(this.indexCurveTVD, true))
              .addChild(grid);
          } else {
            track
              .setName("Depth")
              .addChild(this.createCurveIndex(this.indexCurveDepth, true))
              .addChild(grid);
          }
        }
        if (
          this.trajectoryData &&
          this.trajectoryData.trajectoryStation &&
          (this.showSurvey || this.staticTemplateSharedService.showSurvey)
        ) {
          track.addChild(this.AddSurveyMarker(trackInfo.isDepth));
        }
        this.logWidget.addTrack(track).setWidth(250);

        //this.logWidget.getTrackHeader(track).setVisibleTrackTitle(true);
      }
      if (trackInfo.trackType == "Mudlog") {
        // this.createSceneMud();//this.canvasToPlot.nativeElement
        //this.drawPlot();
        this.createSceneLithology(trackInfo);
      } else if (trackInfo.trackType == "Image") {
        //this.drawPlot();
        this.createSceneImage(trackInfo);
      } else if (trackInfo.trackType == "Comments") {
        this.lstOfTrack[_index].comments = this.lstComments;
        this.createComment(this.lstComments);
      }else if (trackInfo.trackType == "Remarks") {
        this.createRemarks(trackInfo);

      } else if (trackInfo.curves.length > 0) {
        let trackX: any = [];
        trackInfo.curves.forEach(curve => {
         
          if( curve.show && this.trajectoryData && this.trajectoryData.trajectoryStation && curve.mnemonic=="incl")
          {
    let data: any[] = this.trajectoryData.trajectoryStation;
    let curveData : number[] = [];
    this.indexCurveDepth.forEach((md,mdIndex)=>{
let dataIndex= data.findIndex(trac=>trac.md==md);
if(dataIndex>-1){
let inclVal= data.find(trac=>trac.md==md);
curveData.push(inclVal.incl);
}
else if(mdIndex>0)
{
  curveData.push(curveData[mdIndex-1]);
}
else{
curveData.push(Number.NaN);
}
    });
     curve.data=curveData;
trackX.push(this.createCurve(curve));
          }
         else if( curve.show && this.trajectoryData && this.trajectoryData.trajectoryStation && curve.mnemonic=="azi")
          {
    let data: any[] = this.trajectoryData.trajectoryStation;
    let curveData : number[] = [];
    this.indexCurveDepth.forEach((md,mdIndex)=>{
let dataIndex= data.findIndex(trac=>trac.md==md);
if(dataIndex>-1){
let azVal= data.find(trac=>trac.md==md);
curveData.push(azVal.azi );
}
else if(mdIndex>0)
{
  curveData.push(curveData[mdIndex-1]);
}
else{
curveData.push(Number.NaN);
}
    });
   
    // data.forEach((val) => {
    //   md.push(val.md);
    //   incl.push(val.incl);
    // });

    curve.data=curveData;

trackX.push(this.createCurve(curve));
          }
          else if (curve.show )//&& curve.data.length > 0
            {
            trackX.push(this.createCurve(curve));
          }
        });


        this.logWidget.addTrack(trackType).setName(trackInfo.trackName)
          .addChild(
            trackX
          ).setWidth(350).setBorders({ top: true, left: true, right: true }).enableClipping(true);
      }
    });
    this.logWidget.getToolByName("cross-hair").setEnabled(false);
    this.logWidget
      .getToolByName("TrackPanning")
      .on(PanningEvents.onPanning, () => {
        this.isAutoScroll = false;
        this.cdr.detectChanges();
        let limts= this.logWidget.getVisibleDepthLimits();

if(limts.high>=this.plotMaxDepth-500 && limts.low<=this.plotMinDepth+500)
{
  this.logWidget.fitToHeight();
}
if(limts.high>=this.plotMaxDepth-200)
{
    this.isAutoScroll = true;
   this.cdr.detectChanges();
}

      });
    if (this.staticTemplateSharedService.fillCanvasWidth) {
      this.logWidget.fitToWidth();
     }
     this.ChangeOrientation();
     
     
    if (this.lstOfTrack.length > 4) {
      this.logWidget.fitToWidth();
    }
    if (!this.swtichToTvd) {
      this.logWidget.connectTool(new WellLogTooltip(this.logWidget, this.canvasToPlot.nativeElement, this.lstOfTrack, this.indexCurveDepth, this.indexCurveTime, this.hideHeader,this.wellService));
    }
    else {
      this.logWidget.connectTool(new WellLogTooltip(this.logWidget, this.canvasToPlot.nativeElement, this.lstOfTrack, this.indexCurveTVD, this.indexCurveTime, this.hideHeader,this.wellService));
    }
     // let lowLimtWhiteSpace= (this.indexCurveTime.length *1.5/100);
     //   let highLimitWhiteSpace= (this.indexCurveTime.length *3/100);
    this.logWidget.setDepthLimits(this.plotMinDepth-100, this.plotMaxDepth +158);
    
    if (this.isAutoScroll) {
      this.logWidget.scrollToIndex(
        this.plotMaxDepth +200,
        ScrollToLocation.BOTTOM,
        false,
      );
    }
    if(this.loadNextSetOfData) {
      this.loadNextSetOfData=false;
      let highlimtPercentageValue= ((this.plotMaxDepth- this.plotMinDepth) *25/100) +this.plotMinDepth;
       this.logWidget.scrollToIndex(
       highlimtPercentageValue,
        ScrollToLocation.VISIBLE,
        false,
      );
    }
  
    this.logWidget.getToolByName("rubberband").setEnabled(true).setAutoDisabled(false)
      .on(RubberBandEvents.onZoomEnd, (_eventType, _sender, _eventArgs) => {
        this.isAutoScroll = false;
      });

    for (
      let i = 0;
      i < this.logWidget.getHeaderContainer().getChildrenCount();
      ++i
    ) {
      const header = this.logWidget.getHeaderContainer().getChild(i);
      if (header instanceof LogTrackHeader) {
        header
          .setBorderVisibility(true)
          .setProperties()
          .setTopToBottom(true)
          .setBorderLineStyle({
            color: '#AFBDD6',
            width: 1,
            pattern: Patterns.Solid,
          });
      }
    }
     const header = new AdaptiveLogCurveVisualHeader()
            .setElement({
                [LogCurveHeaderElements.ScaleTo]: {'section': Sections.Top},
                [LogCurveHeaderElements.ScaleFrom]: {'section': Sections.Top},
                [LogCurveHeaderElements.Name]: {'section': Sections.Top},
                [LogCurveHeaderElements.Unit]: {'section': Sections.Bottom},
                [LogCurveHeaderElements.Tracking]: {'section': Sections.Bottom}
            })
      
        const headerProvider = this.logWidget.getHeaderContainer().getHeaderProvider();
        headerProvider.registerHeaderProvider(CompositeLogCurve.getClassName(), header);

        headerProvider.registerHeaderProvider(LogTrack.getClassName(), new LogTrackVisualHeader());

    const header2d = new AdaptiveLog2DVisualHeader()
      .setElement({
        [Log2dHeaderElements.ScaleTo]: { section: Sections.Top },
        [Log2dHeaderElements.ScaleFrom]: { section: Sections.Top },
        [Log2dHeaderElements.Tracking]: { section: Sections.Bottom },
        [Log2dHeaderElements.Unit]: { section: Sections.Bottom },
      })
      .setCursorEnabled(true);
    headerProvider.registerHeaderProvider(Log2DVisual.getClassName(), header2d);

    

    this.showLoading = false;
    this.wellService.setHeader(this.hideHeader,this.logWidget);
     this.FitToheight();
    
    
    if (this.darkMode) {
      let css = this.generateBlackThemeCSS();
      this.logWidget.setCss(new CssStyle({ css: css }));
    }
    //this.logWidget.setScaleScrollStrategy(ScaleScrollStrategy.)
  }
  SaveTrackInfo() {
    this.drawPlot();
    this.createScene();
  }
  createCurve(curveInfo: IWellboreLogData) {
    const values = curveInfo.data;
    const depths = values.map(
      (_val, i) =>
        this.plotMinDepth +
        (i * (this.plotMaxDepth - this.plotMinDepth)) / (values.length - 1),
    );
    const data = new LogData(depths, values);

    let curveValuePosition: AnchorType = AnchorType.None;
    switch (curveInfo.valuePosition) {
      case "Left":
        curveValuePosition = AnchorType.RightCenter;
        break;
      case "Right":
        curveValuePosition = AnchorType.LeftCenter;
        break;
      case "Center":
        curveValuePosition = AnchorType.TopCenter;
        break;
    }
    let lastValue: number = 0;
    if (curveInfo.data.length > 0) {
      lastValue = this.wellService.getLastValueOfCurve(
        curveInfo.data,
        curveInfo.data.length - 1,
      );
    }
    let min: number = 0;
    let max: number = 0;
    if (curveInfo.min != "") {
      min = curveInfo.min;
    }
    if (curveInfo.max != "") {
      max = curveInfo.max;
    }

    return new LogCurve(data)
      .setName(
        curveInfo.displayName +
          "(" +
          (Math.round(lastValue * 100) / 100).toFixed(2) +
          " " +
          curveInfo.unit +
          ")",
      )
      .setVisibleValue(curveInfo.showValue)
      .setTextReference(TextReference.Sample)
      .setTextAnchorType(curveValuePosition)
      .setHideOverlappedValues(true)
      .setDisplayUnit(curveInfo.unit)
      .setTextDecimationStep(curveInfo.textDecimationStep)
      .setTextStyle({
        color: curveInfo.color,
        font: "bold 12px Roboto",
      })
      .setLineStyle({
        color: curveInfo.color,
        width: 2,
        // width: curveInfo.lineWidth,
        pattern: curveInfo.lineStyle,
      })
      .setClippingLimits(min, max);
  }

  createCurveIndex(values: any[], isDepth: boolean = false) {
    const depths1 = values.map(
      (_val, i) =>
        this.plotMinDepth +
        (i * (this.plotMaxDepth - this.plotMinDepth)) / (values.length - 1),
    );

    let indexValue: LogMarker[] = [];
    let step =  values.length/12;
    if (isDepth) {
      indexValue.push(
        this.IndexCurveValue(
          depths1[Math.round(step / 4)],
          values[Math.round(step / 4)],
        ),
      );
      for (let i = step; i < values.length; i = i + step) {
        indexValue.push(
          this.IndexCurveValue(depths1[Math.round(i)], values[Math.round(i)]),
        );
      }
      indexValue.push(
        this.IndexCurveValue(
          depths1[depths1.length - 1],
          values[values.length - 1],
        ),
      );
    } else {
   //   step = 60*1;
      let date = formatDate(values[0], "dd-MM-yyyy", "en");
      indexValue.push(
        this.IndexCurveValue(
          depths1[Math.round(step / 4)],
          formatDate(
            values[Math.round(step / 4)],
            "dd-MM-yyyy\n HH:mm:ss",
            "en",
          ),
        ),
      );
      for (let i = step; i < values.length; i = i + step) {
        let value = values[Math.round(i)];
        if (value != null && value != undefined) {
          let tempDate = formatDate(value, "dd-MM-yyyy", "en");
          if (date == tempDate) {
            indexValue.push(
              this.IndexCurveValue(
                depths1[Math.round(i)],
                formatDate(value, "HH:mm:ss", "en"),
              ),
            );
          } else {
            date = formatDate(value, "dd-MM-yyyy", "en");
            indexValue.push(
              this.IndexCurveValue(
                depths1[Math.round(i)],
                formatDate(value, "dd-MM-yyyy\n HH:mm:ss", "en"),
              ),
            );
          }
        }
      }
      indexValue.push(
        this.IndexCurveValue(
          depths1[depths1.length - 1],
          formatDate(values[values.length - 1], "HH:mm:ss", "en"),
        ),
      );
    }

    return indexValue;
  }
  IndexCurveValue(depth: number, value: any) {
    return new LogMarker(depth, value)
      .setNameLabelPosition(AnchorType.Center)
      .setVisibleDepthLabel(false)
      .setLineStyle({ width: 0 })
      .setTextStyle({ color: KnownColors.Black });
  }
  loadDateTrajectory() {
    let fromDate = this.indexCurveTime[0];
    let toDate = this.indexCurveTime[this.indexCurveTime.length - 1];
    let depthStep = this.rgDep / this.indexCurveTime.length;
    let hint: any[] = [];
    for (let i = 0; i < this.indexCurveTime.length; i++) {
      hint.push({ depth: depthStep, time: new Date(this.indexCurveTime[i]) });
      depthStep += depthStep;
    }
    const data: LogDrillingSection.Options = {
      depthfrom: this.plotMinDepth,
      depthto: this.plotMaxDepth,
      valuefrom: { date: fromDate },
      valueto: { date: toDate },
      hint: hint,
    };
    return new LogDrillingSectionContainer().addSection(
      new LogDrillingSection(data),
    );
  }

  private currentScale=1;
  private minScale=0.1;
  private maxScale=10;

setPlotRange(maxDepth: number, minDepth: number) {
  this.plotMaxDepth = maxDepth;
  this.plotMinDepth = minDepth;
  this.initialPlotRange = maxDepth - minDepth;
}

ZoomIn() {  
  if (this.currentScale < 0) { 
       this.logWidget.fitToHeight();
}
else{
  this.currentScale=1;
}
   this.currentScale *= (5 / 4);
   this.logWidget.scale(this.currentScale);
    this.isAutoScroll=false;
}

ZoomOut() {
   if (this.initialPlotRange === 0) {
    console.log('Initial plot range is not defined. Cannot calculate scale.');
    return;
  }
const currentScale = (this.plotMaxDepth - this.plotMinDepth) / this.initialPlotRange;
  console.log(currentScale); 
  const rect = this.canvasToPlot.nativeElement;  
  if (this.currentScale > this.minScale) {
    this.currentScale *= (4 / 5);
    this.logWidget.scale(this.currentScale);
    if (this.currentScale <= 0.5) { 
      this.logWidget.fitToHeight();
      this.plotMaxDepth += 10; 
     this.plotMinDepth -= 10;
    }
    console.log('Zoom out');
  } else {
    console.log('Minimum zoom out level reached.');      
  }
  this.isAutoScroll=false;
}

  FitToheight() {
    if (this.isFitToheight) {
      this.logWidget.fitToHeight();
    } else {
      this.logWidget.setVisibleDepthLimits(this._defaultZoomLimits);
    }
  }
  ZoomReset() {
    this.isFitToheight = false;
    this.isAutoScroll = true;
    this.isFirstTimeLoading=true;
    this.logWidget.setVisibleDepthLimits(this._defaultZoomLimits);
    this.currentScale=1;
       this.getLiveTrackCurveInfo();
  }
 

  AutoScrollToggle(): void {
     this.isAutoScroll = !this.isAutoScroll;
  }
  NewTrack(isIndex = false) {
    let track: ITracks = {
      trackName: this.selectedLog,
      trackNo: this.lstOfTrack.length + 1,
      curves: [],
      trackType: "Linear",
      // mnemonicLst: [],
      isIndex: isIndex,
      isDepth: false,
      isMudLog: false,
      isImage: false,
      comments: [],
    };
    this.lstOfTrack.push(track);
    this.drawPlot();
    this.createScene();
    this.showToast("Track", "Added New Track Successfully");
  }
  AddNewMnemonic(trackNo: number) {
    this.lstOfTrack.forEach((val, index) => {
      if (val.trackNo == trackNo) {
        let curveInfo = this.wellService.GetDefaultMnemonic(
          this.lstOfTrack.length > 0
            ? this.lstOfTrack[Number(index)].curves.length + 1
            : 0,
        );
        this.lstOfTrack[index].curves.push(curveInfo);

        this.showToast("Mnemonic", "Added a new Mnemonic Successfully");
      }
    });
  }
  DeleteTrack(trackNo: number) {
    if (confirm("Are you sure for deleting track")) {
      let index = this.lstOfTrack.findIndex((obj) => obj.trackNo == trackNo);
      this.lstOfTrack.splice(index, 1);
      this.drawPlot();
      this.createScene();

      this.showToast("Track", "Deleted track Successfully");
    }
  }
  RemoveMnemonic(trackNo: number, displayOrder: number) {
    if (confirm("Are you sure for deleting curve")) {
      let index = this.lstOfTrack.findIndex((obj) => obj.trackNo == trackNo);
      let curveIndex = this.lstOfTrack[index].curves.findIndex(
        (cur) => cur.displayOrder == displayOrder,
      );
      this.lstOfTrack[index].curves.splice(curveIndex, 1);
      this.drawPlot();
      this.createScene();
      this.showToast("Mnemonic", " Removed Curve Successfully");
    }
  }
  OpenCardConfiguration() {
     this.showCharConfig=!this.showCharConfig;
   
  }

  SaveChartConfiguration() {
    this.drawPlot();
    this.createScene();
  }

  exportToPDF(template: string) {
    const limits = this.logWidget.getDepthLimits();
    const compression = BrowserInfo.isFirefox() !== true;
    let a = this.logWidget.getExportElement();
    let documentHeader: any = template;
    return this.logWidget.exportToPdf({
      output: "Widget",
      //'printsettings': settings['printSettings'],
      printsettings: {
        scaling: ScalingOptions.FitWidth,
        top: 0.2,
        bottom: 0.2,
        left: 0.5,
        right: 0.5,
        // paperformat:pape
      },
      limits: {
        start: limits.getLow(),
        end: limits.getHigh(),
      },
      documentheader: documentHeader, //new HeaderComponent(660,20,"sdfs"),

      footer: new FooterComponent(600, 20),
      imagecompression: {
        mode: ImageCompression.NONE,
      },
      streamcompression: compression,
      //  'progress': progress
    });
  }
  PrintToPdf() {
    //  let aa = this.wellService.getReportTemplate().subscribe(resposne=> {
    //   let abc= resposne;
    //   this.exportToPDF(abc);
    //  });

    let a: any = this.plot.getRoot();
    this.logWidget.getVisibleModelLimits();
    // NodeExport.exportToImage()
    let x: any = NodeExport.exportToImageUrl(
      this.logWidget,
      a.getBounds().width * getPixelScale(),
      a.getBounds().height * getPixelScale(),
      false,
      false,
      new Rect(0, 0, a.getBounds().width, a.getBounds().height), //this.logWidget.getVisibleModelLimits()
    );
    let imgString = x.replace("data:image/png;base64,", "");
    this.wellService
      .printWellLog(this.well, this.wellbore, imgString, "", "", "", "")
      .subscribe((response) => {
        let a: any = response;

        let abc = new Blob([a], { type: "application/pdf" });

        var downloadURL = window.URL.createObjectURL(abc);
        var link = document.createElement("a");
        link.href = downloadURL;
        link.download = "Report.pdf";
        link.click();
      });

    //   plotImage.src=x;
    this.imageSrc = x;
  }

  showToast(toastHeader: string, toastMessage: string) {
    this.toastHeader = toastHeader;
    this.toastMessage = toastMessage;
    const elm = document.getElementById("toastMsg");
    const toast = new bootstrap.Toast(elm);
    toast.show();
  }
  closeTrajPopup() {
    this.showTrajectoryData = false;
    //document.getElementById("btnCloseTraj")!.click();
  }
  MoveDownTrack(_trackNo: number, trackIndex: number) {
    if (trackIndex == this.lstOfTrack.length - 1) return;
    this.lstOfTrack[trackIndex].trackNo =
      this.lstOfTrack[trackIndex + 1].trackNo;
    this.lstOfTrack[trackIndex + 1].trackNo =
      this.lstOfTrack[trackIndex + 1].trackNo - 1;

    this.lstOfTrack = this.lstOfTrack.sort((x, y) =>
      x.trackNo > y.trackNo ? 1 : x.trackNo < y.trackNo ? -1 : 0,
    );
  }
  MoveUpTrack(_trackNo: number, trackIndex: number) {
    if (trackIndex == 0) return;
    this.lstOfTrack[trackIndex].trackNo =
      this.lstOfTrack[trackIndex - 1].trackNo;
    this.lstOfTrack[trackIndex - 1].trackNo =
      this.lstOfTrack[trackIndex - 1].trackNo + 1;
    this.lstOfTrack = this.lstOfTrack.sort((x, y) =>
      x.trackNo > y.trackNo ? 1 : x.trackNo < y.trackNo ? -1 : 0,
    );
  }

  generateBlackThemeCSS() {
    const DEFAULT_WLW_CLASSES = [
      '*[cssclass="horizontalGrid"] {',
      "   tickgenerator-major-tickstyle-color: #AFBDD633;",
      "   tickgenerator-minor-tickstyle-color: #AFBDD633;",
      "}",
      '*[cssclass="verticalGrid"] {',
      "   linestyle-color: #AFBDD633;",
      "}",
    ].join("\n");

    const DEFAULT_CARNAC_CLASSES = [
      "* {",
      "  textstyle-font : 11px Roboto;",
      "  textstyle-color : #AFBDD6;",
      "}",
    ].join("\n");

    const DEFAULT_CONTAINERS_CLASS = [
      '*[cssclass="headerPlotControl"] {',
      "   fillstyle-color: #233045ee;",
      "}",
      '*[cssclass="footerPlotControl"] {',
      "   fillstyle-color: #233045;",
      "}",
      '*[cssclass="trackPlotControl"] {',
      "   fillstyle-color: #233045;",
      "}",
    ].join("\n");

    const DEFAULT_INDEXTRACK_HEADER = [
      ".geotoolkit.welllog.header {",
      "   displayvaluetextstyle-color : #19be64ff;",
      "   displayvaluetextstyle-font : bold 12px Roboto;",
      "   fillStyle-color : #233045",
      "   borderlinestyle-color: #AFBDD633;",
      "}",
      ".CustomLogAxisVisualHeader {",
      "   displayvaluetextstyle-color : #f17878ff;",
      "   displayvaluetextstyle-font : bold 12px Roboto;",
      "   fillStyle-color : #7b72b3ff;",
      "   borderlinestyle-color: #AFBDD6;",
      "}",
      '.CustomLogAxisVisualHeader[cssclass="FooterAxis"] {',
      "   valuetypestyle:text;",
      "   headertype:simple;",
      "}",
    ].join("\n");

    //header section 
    const DEFAULT_LOGCURVE_ADAPTIVE_HEADER = [
      ".geotoolkit.welllog.header.AdaptiveLogCurveVisualHeader {",
      "   element-tracking-textstyle-font : bold 14px Roboto;",
      "   element-tracking-textstyle-color : #233045;",
      "   fillStyle-color : #233045;",
      "   textstyle-color : #fff;",
      // "   textstyle-color : #AFBDD6ff;",
      "   textstyle-font : 12px Roboto;",
      "}",
    ].join("\n");

    const EXAMPLE_BY_NAME = [
      '*[name="Track # 2"] {',
      "   backgroundcolor-color : #5D4037;",
      "}",
    ].join("\n");

    const EXAMPLE_BY_ID = [
      '*[id="AXIS"] {',
      "   tickgenerator-major-tickstyle-color: #FFD180;",
      "   tickgenerator-major-tickstyle-width: 2;",
      "   tickgenerator-major-labelstyle-color: #EFEFEF;",
      "   tickgenerator-major-labelstyle-font: 12px Roboto;",
      "   tickgenerator-minor-tickstyle-color: #EFEFEF;",
      "   tickgenerator-edge-labelstyle-color: #EFEFEF;",
      "   tickgenerator-edge-tickstyle-color: #EFEFEF;",
      "   tickgenerator-edge-labelstyle-font: 12px Roboto;",
      "}",
    ].join("\n");

    const SCROLL_BAR_CSSCLASS = [
      '*[cssclass="headerverticalscroll"] {',
      "   fillstyle-color: darkgray;",
      "   caretfillstyle-color: #233045;",
      "   arrowlinestyle-color: black;",
      "}",
      '*[cssclass="trackhorizontalscroll"] {',
      "   fillstyle-color: darkgray;",
      "   caretfillstyle-color: #233045;",
      "   arrowlinestyle-color: black;",
      "}",
      '*[cssclass="trackverticalscroll"] {',
      "   fillstyle-color: darkgray;",
      "   caretfillstyle-color: #233045;",
      "   arrowlinestyle-color: black;",
      "}",
      '*[cssclass="footerverticalscroll"] {',
      "   fillstyle-color: darkgray;",
      "   caretfillstyle-color: #233045;",
      "   arrowlinestyle-color: black;",
      "}",
    ].join("\n");

    const SPLITTER_CSSCLASS = [
      '*[cssclass="containersplitter"] {',
      "   fillStyle-color: #AFBDD6;",
      "   linestyle-color: #AFBDD6;",
      "}",
      '*[cssclass="tracksplitter"] {',
      "   fillStyle-color: #AFBDD6;",
      "   linestyle-color: #AFBDD6;",
      "}",
    ].join("\n");

    return [
      DEFAULT_WLW_CLASSES,
      DEFAULT_CARNAC_CLASSES,
      DEFAULT_CONTAINERS_CLASS,
      DEFAULT_INDEXTRACK_HEADER,
      DEFAULT_LOGCURVE_ADAPTIVE_HEADER,
      EXAMPLE_BY_NAME,
      EXAMPLE_BY_ID,
      SCROLL_BAR_CSSCLASS,
      SPLITTER_CSSCLASS,
    ].join("");
  }

  createImageCurveFromSample(curveInfo: IWellboreLogData) {
    const values = imageDataSample;
    const depths = values.map(
      (_val, i) =>
        this.plotMinDepth +
        (i * (this.plotMaxDepth - this.plotMinDepth)) / (values.length - 1),
    );
    const log2dData = new Log2DVisualData();

    for (let index = 0; index < values.length; index++) {
      let value: any = [];
      if (Number.isNaN(values[index])) {
        // Let's just build dummy data.
        value = [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ];
      } else {
        // if (typeof values[index] === "string"){
        // Split the array if value is !NaN.
        value = values[index].values; // .split(' ').map(Number);
      }

      let piDistance = (2 * Math.PI) / (value.length - 1);

      let angles = [];
      let angle = 0;

      for (let j = 0; j < value.length; j++) {
        angles.push(angle);
        angle += piDistance;
      }

      log2dData.getRows().push(new Log2DDataRow(depths[index], value, angles));
    }

    const min = 1.95, // log2dData.getMinValue(),
      max = 2.95; //log2dData.getMaxValue();

    // Set options
    let colors, delta;
    delta = (max - min) / 3;
    colors = new DefaultColorProvider()
      .setNamedColor("NegativeInfinity", "blue")
      .setNamedColor("PositiveInfinity", "green")
      .addColor(min, "#7cb342") // 0 is the minimum value on this color provider
      .addColor(min + delta, "yellow")
      .addColor(min + 2 * delta, "orange")
      .addColor(max, "red");

    // Create Visual
    return (
      new Log2DVisual()
        .setName(curveInfo.displayName + "(" + curveInfo.unit + ")")
        // .setVisible(true)
        // .setLineStyle({ 'color': curveInfo.color, 'width': curveInfo.lineWidth, 'pattern': curveInfo.lineStyle })
        .setData(log2dData)
        .setColorProvider(colors)
        .setOffsets(0)
        .setMicroPosition(0, 1)
    ); // DEFAULT: Visual model limits are from 0,1
  }

  createImageCurve(curveInfo: IWellboreLogData) {
    const values = curveInfo.data;
    const depths = values.map(
      (_val, i) =>
        this.plotMinDepth +
        (i * (this.plotMaxDepth - this.plotMinDepth)) / (values.length - 1),
    );
    const log2dData = new Log2DVisualData();

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    for (let index = 0; index < values.length; index++) {
      let value: any = [];
      if (Number.isNaN(values[index])) {
        // Let's just build dummy data.
        value = [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ];
      } else if (typeof values[index] === "string") {
        // Split the array if value is !NaN.
        value = values[index].split(" ").map(Number);
        let localMax = Math.max(...value);
        max = max < localMax ? localMax : max;
        let localMin = Math.min(...value);
        min = min > localMin ? localMin : min;
      }

      let piDistance = (2 * Math.PI) / (value.length - 1);

      let angles = [];
      let angle = 0;

      for (let j = 0; j < value.length; j++) {
        angles.push(angle);
        angle += piDistance;
      }

      log2dData.getRows().push(new Log2DDataRow(depths[index], value, angles));
    }
    log2dData.updateLimits();

    // Set options
    let colors, delta;
    delta = (max - min) / 3;
    colors = new DefaultColorProvider()
      .setNamedColor("NegativeInfinity", "blue")
      .setNamedColor("PositiveInfinity", "green")
      .addColor(min, "#7cb342") // 0 is the minimum value on this color provider
      .addColor(min + delta, "yellow")
      .addColor(min + 2 * delta, "orange")
      .addColor(max, "red");

    // Create Visual
    return new Log2DVisual()
      .setName(curveInfo.displayName + "(" + curveInfo.unit + ")")
      .setData(log2dData)
      .setColorProvider(colors)
      .setOffsets(0)
      .setMicroPosition(0, 1); // DEFAULT: Visual model limits are from 0,1
  }

  createSceneImage(trackInfo: ITracks) {
    if (trackInfo.curves.length > 0) {
      let trackX: any = [];
      trackInfo.curves.forEach((curve) => {
        if (curve.show && curve.data.length > 0) {
          trackX.push(
            this.createImageCurve(curve).setPlotType(PlotTypes.Linear),
          );
        }

        const headerProvider = this.logWidget
          .getHeaderContainer()
          .getHeaderProvider();
        headerProvider.registerHeaderProvider(
          Log2DVisual.getClassName(),
          new CompositeLog2DVisualHeader(),
        );

        this.logWidget
          .addTrack(TrackType.LinearTrack)
          .setName(trackInfo.trackName)
          .addChild(trackX);
      });
    }
  }
  // TODO !!! almost there.

  createFillCurve(
    curve1: LogCurve | LogReferenceLine,
    curve2: LogCurve | LogReferenceLine,
    patternName: string,
    color: string,
    pattern: any,
  ): LogFill {
    return new LogFill({
      name: patternName,
      curve1: curve1,
      curve2: curve2,
      fillstyle: {
        pattern: pattern, //this.patternFactory.getPattern(pattern)!,
        color: color,
      },
    });
  }

  createLithologyStack(logDataLithologies: any[]) {
    // this.patternFactory.setLoadTimeout(500);

    const fillStyles: Record<string, FillStyle.Type> = {
      PCT_SST: {
        color: "#2196f3",
        pattern: this.patternFactory.getPattern("sandstone")!,
      },
      INT_SST: {
        color: "#2196f3",
        pattern: this.patternFactory.getPattern("sandstone")!,
      },

      PCT_DOL: {
        color: "#7cb342",
        pattern: this.patternFactory.getPattern("dolomite")!,
      },
      INT_DOL: {
        color: "#7cb342",
        pattern: this.patternFactory.getPattern("dolomite")!,
      },

      PCT_SH: {
        color: "#bdbdbd",
        pattern: this.patternFactory.getPattern("shale")!,
      },
      INT_SH: {
        color: "#bdbdbd",
        pattern: this.patternFactory.getPattern("shale")!,
      },

      INT_LS: {
        color: "#fdd835",
        pattern: this.patternFactory.getPattern("lime")!,
      },
      PCT_LS: {
        color: "#fdd835",
        pattern: this.patternFactory.getPattern("lime")!,
      },

      INT_DOLLS: {
        color: KnownColors.Blue,
        pattern: this.patternFactory.getPattern("dolomite")!,
      },
      INT_UNK: {
        color: KnownColors.Gray,
        pattern: this.patternFactory.getPattern("sandstone")!,
      },
      INT_NS: {
        color: KnownColors.Indigo,
        pattern: this.patternFactory.getPattern("sandstone")!,
      },
      INT_SLTST: {
        color: "#fdd835",
        pattern: this.patternFactory.getPattern("siltstone")!,
      },
      INT_CLAY: {
        color: KnownColors.Red,
        pattern: this.patternFactory.getPattern("claystone")!,
      },
      INT_ANHY: {
        color: KnownColors.Red,
        pattern: this.patternFactory.getPattern("claystone")!,
      },
      PCT_CLAY: {
        color: KnownColors.Red,
        pattern: this.patternFactory.getPattern("claystone")!,
      },
      PCT_SLTST: {
        color: "#2196f3",
        pattern: this.patternFactory.getPattern("siltstone")!,
      },
      PCT_UNK: {
        color: KnownColors.Gray,
        pattern: this.patternFactory.getPattern("sandstone")!,
      },
      PCT_ANHY: {
        color: KnownColors.Red,
        pattern: this.patternFactory.getPattern("claystone")!,
      },
      PCT_CLCAR: {
        color: KnownColors.Blue,
        pattern: this.patternFactory.getPattern("sandstone")!,
      },
      PCT_ARGLS: {
        color: KnownColors.Indigo,
        pattern: this.patternFactory.getPattern("sandstone")!,
      },
      //PCT_UNK
    };

    this.tLithFill = [];

    for (let index = 0; index < this.litTypes.length - 1; index++) {
      const key1 = this.litTypes[index];
      let color1 = "white"; // Default color.
      let pattern1 = null;
      if (key1 in fillStyles) {
        color1 = (fillStyles[key1] as { color: string; pattern: any }).color;
        pattern1 = (fillStyles[key1] as { color: string; pattern: any })
          .pattern;
      }

      const key2 = this.litTypes[index + 1];
      let color2 = "white"; // Default color.
      let pattern2 = null;
      if (key2 in fillStyles) {
        color2 = (fillStyles[key2] as { color: string; pattern: any }).color;
        pattern2 = (fillStyles[key2] as { color: string; pattern: any })
          .pattern;
      }

      let type1 = this.createLogCurve(
        logDataLithologies[index],
        color1,
        undefined,
        InterpolationType.MiddleStep,
      );
      let type2 = this.createLogCurve(
        logDataLithologies[index + 1],
        color2,
        undefined,
        InterpolationType.MiddleStep,
      );

      this.tLithFill.push(
        this.createFillCurve(type1, type2, key2, color2, pattern2),
      );
    }

    let MudDepth: number[];

    MudDepth = this.mudLogDepth.map(
      (val, i) =>
        this.plotMinDepth +
        (i * (this.plotMaxDepth - this.plotMinDepth)) /
          (this.mudLogDepth.length - 1),
    );
  

    const lithologyFlexBox = new LogLithology({
      depths: MudDepth,
      fillstyles: this.tLithFill.map(
        (item: LogFill) => fillStyles[item.getName()],
      ), //item.getFillStyle()),
      // 'titles': this.tLithFill.map((item: {getName: () => string}) => item.getName().toLowerCase())
      titles: this.tLithFill.map((item: { getName: () => string }) =>
        item.getName(),
      ),
    });

    return lithologyFlexBox;
  }
  createSceneLithology(trackInfo: ITracks) {
      let logDataLithologies = trackInfo.curves;
    if (logDataLithologies.length > 0) {
      let lithology = this.createLithologyStack(logDataLithologies); // this.createLithology();

      // Step by step.
      const tLith = this.logWidget
        .addTrack(TrackType.LinearTrack)
        .setName(trackInfo.trackName)
        .addChild(lithology);
      this.logWidget
        .getTrackHeader(tLith)
        .setCss(
          ".geotoolkit.welllog.header.LogFillVisualHeader{ visible: false; }",
        );
      tLith.addChild(lithology);
      for (let i = 0; i < this.tLithFill.length; ++i) {
        tLith.addChild(this.tLithFill[i]);
      }
      const headerProvider = this.logWidget
        .getHeaderContainer()
        .getHeaderProvider();
      const logLithologyHeader = headerProvider.getHeader(lithology);
      if (logLithologyHeader instanceof LogLithologyHeader) {
        logLithologyHeader.setFlexBoxOptions({
          enabled: true,
        });
      } else if (logLithologyHeader instanceof AdaptiveLogLithologyHeader) {
        logLithologyHeader.setDiscreteDisplayType(
          DiscreteFillDisplayType.FlexBox,
        );
      }
    }
  }
  createLogCurve(
    curveData: LogData<null>,
    color?: string,
    limits?: [number, number],
    interpolation?: InterpolationType,
  ): LogCurve {
    const curve = new LogCurve(curveData).setLineStyle({
      color,
      width: 1.25 * getPixelScale(),
    });

    if (interpolation != null) {
      curve.setInterpolationType(interpolation);
    }

    if (limits instanceof Array && limits.length === 2) {
      curve.setNormalizationLimits(limits[0], limits[1]);
    }
    return curve;
  }

  constructLogLithology() {}

  selectedMudEvent(pSelectedLog: any, trackNo: number) {
    this.showLoading = true;
    let selectedlogObject: any;
    let logIndex: number = 1;
    let trackIndex = this.lstOfTrack.findIndex((obj) => obj.trackNo == trackNo);

    this.wellboreObjects.forEach((val, _logIndex) => {
      if (val.objectId == pSelectedLog.target.value) {
        selectedlogObject = val;
        logIndex = _logIndex;
        return;
      }
    });
    let mudData = this.wellService.getMudlogData(
      this.well,
      this.wellbore,
      pSelectedLog.target.value,
      null,
      null,
    );
    this.mudLogDepth = [];
    this.mudLogDepthLith = [];

    // Create lithology datasources based on the type.
    let litTypesData: any[] = []; // LogData values for each of lithology type.
    let lenData = 0;
    let logDataLithologies = [];
    this.litTypes = [];
    this.lstOfTrack[trackIndex].curves = [];

    mudData.subscribe((response) => {
      this.flageMud = true;
      let mud: any = response;
      let mudlogData: any[] = mud.mudLogs;
      // console.log(mud);
      mudlogData.forEach((mudData) => {
        let geoData: any[] = mudData.geologyInterval;
        geoData.forEach((val) => {
          // if (numCtr >= maxNum) return;
          let abc = val.mdTop["#text"];
          this.mudLogDepth.push(Number(abc));

          let lithologyList = Array.isArray(val.lithology)
            ? val.lithology
            : [val.lithology];

          // Need to intialize 0 values for all lit types.
          for (let index = 0; index < litTypesData.length; index++) {
            litTypesData[index].push(0);
          }

          // let litDataLen = 0;
          // TODO!!! need to set value like the sample in lithology view in tutorial using LogData.
          lithologyList.forEach((lithology: any) => {

            if (this.litTypes.includes(lithology.type)) {
              // Check the length data for this type.
              let litIdx = this.litTypes.indexOf(lithology.type);
              litTypesData[litIdx][lenData] = lithology.lithPc["#text"]; // As it was set to 0 before loop.
            } else {
              // Add the type.
              this.litTypes.push(lithology.type);

              // Initialize data until that length.
              let litTypeData = new Array(lenData).fill(0);
              litTypeData.push(lithology.lithPc["#text"]);
              litTypesData.push(litTypeData);

            }
          });

          if (val.lithology) {
            let ab = val.lithology.type;
            if (ab == undefined) {
              ab = val.lithology[0].type;
            }

            if (!this.mudLogDepthLith.includes(ab)) {
              this.mudLogDepthLith.push(ab);
            }
          }

          lenData++;

        });
      });
      for (let index = 0; index < this.litTypes.length; index++) {
              logDataLithologies.push(
          new LogData(this.litTypes[index]).setValues(
            this.mudLogDepth,
            litTypesData[index],
          ),
        );
      }
      //
      this.lstOfTrack[trackIndex].curves = logDataLithologies;
      // console.log("Log data lithologies", logDataLithologies);

      //this.flageMud =false;
      this.showLoading = false;
    });

    this.flageMud = false;
    this.showLoading = false;
  }
  createComment(response: any) {
    let commentInfo: commentTrackInfo = {
      depthComment: [],
      timeComment: [],
      indexTime: this.indexCurveTime,
      indexdepth: this.indexCurveDepth,
    };
    let depths1: any[] = [];
    const depths: any[] = [];
    let isDepth = false;
    if(response && response.messages){
    const values: any[] = response.messages;
    
    this.lstOfTrack.forEach(trackInfo => {
      if (trackInfo.isDepth) {
        isDepth = true;
      }
    });
  
    if (isDepth) {
      depths1 = commentInfo.indexdepth.map((_val, i) => (this.plotMinDepth + i * (this.plotMaxDepth - this.plotMinDepth) / (commentInfo.indexdepth.length - 1)));
      //  this.indexCurveDepth.forEach((val, index) => {
       
      // });

        values.forEach((commentArray) => {
          let x = Number(commentArray.md["#text"]);
          let val: number = Number(this.indexCurveDepth.find((e) => e === x));
          if (val == x || (x != 0 && val - x < 1 && val - x > -1)) {
            let index = this.indexCurveDepth.findIndex((e) => e === x);

            if (!commentInfo.depthComment.includes(commentArray.messageText)) {
              commentInfo.depthComment.push(commentArray.messageText);
              depths.push(depths1[index]);
            }
          }
        });
      } else {
        let tempTimeArray: any[] = [];

        depths1 = commentInfo.indexTime.map(
          (_val, i) =>
            this.plotMinDepth +
            (i * (this.plotMaxDepth - this.plotMinDepth)) /
              (commentInfo.indexTime.length - 1),
        );

        this.indexCurveTime.forEach((val, index) => {
          tempTimeArray.push(
            formatDate(val, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") + ".000z",
          );
        });

        values.forEach((commentArray) => {
          let y =
            formatDate(commentArray.dTim, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") +
            ".000z";
          let x = tempTimeArray.find((e) => e === y);
          if (x == y) {
            let index = tempTimeArray.findIndex((e) => e === y);
            commentInfo.timeComment.push(commentArray.messageText);
            depths.push(depths1[index]);
          }
        });
      }
    }
    const styles = ["#c8c8c8", "#fafafa"];

    this.logWidget
      .addTrack(TrackType.LinearTrack)
      .setName("Comment")
      .addChild(
        new LogMudLogSection()
          .setName("messageText")
          .setPaddingStyle("2mm")
          .setDepthsAndValues(
            depths,
            isDepth ? commentInfo.depthComment : commentInfo.timeComment,
          )
          .setEllipsisString(" ... more"),
      );
  }
  createRemarks(trackInfo: any) {
    let remarksInfo: remarksTrackInfo = {
      depthRemarks: [],
      timeRemarks: [],
      indexTime: this.indexCurveTime,
      indexdepth: this.indexCurveDepth,
    };
    let depths1: any[] = [];
    const depths: any[] = [];
    let isDepth = false;
    
    let values: any[] = [];
    if(trackInfo?.trackName === 'Drillings Remarks'){
      values = this.drillingRemarksData;
    }
    if(trackInfo?.trackName === 'Gas Remarks'){
      values = this.gasRemarksData;
    }
    
    if(values?.length){
      this.lstOfTrack.forEach(trackInfo => {
        if (trackInfo.isDepth) {
          isDepth = true;
        }
      });
      if (isDepth) {
        depths1 = remarksInfo.indexdepth.map((_val, i) => (this.plotMinDepth + i * (this.plotMaxDepth - this.plotMinDepth) / (remarksInfo.indexdepth.length - 1)));

          values.forEach((remarkArray) => {
            let x = Number(remarkArray.depth);
            let val: number = Number(this.indexCurveDepth.find((e) => e === x));
            if (val == x || (x != 0 && val - x < 1 && val - x > -1)) {
              let index = this.indexCurveDepth.findIndex((e) => e === x);

              if (!remarksInfo.depthRemarks.includes(remarkArray.remarkText)) {
                remarksInfo.depthRemarks.push(remarkArray.remarkText);
                depths.push(depths1[index]);
              }
            }
          });
        } else {
          let tempTimeArray: any[] = [];

          depths1 = remarksInfo.indexTime.map(
            (_val, i) =>
              this.plotMinDepth +
              (i * (this.plotMaxDepth - this.plotMinDepth)) /
                (remarksInfo.indexTime.length - 1),
          );

          this.indexCurveTime.forEach((val, index) => {
            tempTimeArray.push(
              formatDate(val, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") + ".000z",
            );
          });

          values.forEach((remarkArray) => {
            let y =
              formatDate(remarkArray.time, "yyyy-MM-ddTHH:mm:ss", "en", "GMT") +
              ".000z";
            let x = tempTimeArray.find((e) => e === y);
            if (x == y) {
              let index = tempTimeArray.findIndex((e) => e === y);
              remarksInfo.timeRemarks.push(remarkArray.remarkText);
              depths.push(depths1[index]);
            }
          });
        }
    }
   
    const styles = ["#233045", "#233045"];
    const trackName = trackInfo?.trackName ?? 'Remarks'
    this.logWidget
      .addTrack(TrackType.LinearTrack)
      .setName(trackName)
      .addChild(
        new LogMudLogSection({
                'fillstyles': (depth, text, i) => (
                    styles[i % 2]
                )
            })
          .setPaddingStyle("2mm")
          .setDepthsAndValues(
            depths,
            isDepth ? remarksInfo.depthRemarks : remarksInfo.timeRemarks,
          )
          .setEllipsisString(" ... more"),
      );
  }


  
  handleRemarksData(responseData: any, type: string){
    if(responseData?.logs?.[0]?.logData?.data?.length){
      this.remarksLogArray = responseData?.logs?.[0]?.logData?.data;
      if(type === 'drill-remarks'){
        this.drillingRemarksData = this.transformRemarksApiResponse(this.remarksLogArray);
      }
      if(type === 'gas-remarks'){
        this.gasRemarksData = this.transformRemarksApiResponse(this.remarksLogArray);
      }
      
    }
  
  }

 transformRemarksApiResponse(inputArray:any) {
  return inputArray.map((item:any) => {
      // Split on the first comma that separates timestamp from remark
      const firstCommaIdx = item.indexOf(',');
      const timePart = item.substring(0, firstCommaIdx);
      const remarkPart = item.substring(firstCommaIdx + 1);

      return {
        time: timePart,
        remarkText: this.cleanRemark(remarkPart)
      };
    });
  }
  cleanRemark(raw: any) {
    let cleaned = raw.replace(/^"+|"+$/g, '');
    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/G\/L/g, 'GL');

    return cleaned;
  }
  
  ngOnDestroy() {
    console.log('ngondestroy inside realtime display this.intervalTimer',this.intervalTimer);
 
  }
}
