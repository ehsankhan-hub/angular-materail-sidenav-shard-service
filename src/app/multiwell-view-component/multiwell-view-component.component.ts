import {
  AfterViewInit,
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { WellService } from '../services/well.service';
import { IWellboreObject } from '../models/wellbore-object.model';

@Component({
  selector: 'app-multiwell-view',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './multiwell-view.component.html',
  styleUrls: ['./multiwell-view.component.scss'],
})
export class MultiwellViewComponent implements AfterViewInit {
  @ViewChildren('canvasTrack', { read: ElementRef })
  canvasTracks!: QueryList<ElementRef<HTMLCanvasElement>>;

  lstOfTrack: any[] = [];

  selectedWells = [
    { well: 'Well-A', wellbore: 'Main-1' },
    { well: 'Well-B', wellbore: 'Main-2' },
  ];

  constructor(private wellService: WellService) {}

  async ngAfterViewInit(): Promise<void> {
    await this.loadMultiWellLogs();
    this.renderAllWidgets();
  }

  /** Loads logs for all selected wells and builds track + widget structures */
  private async loadMultiWellLogs(): Promise<void> {
    this.lstOfTrack = [];

    for (const selected of this.selectedWells) {
      const wellLogs: IWellboreObject[] = await this.wellService.getLogHeaders(
        selected.well,
        selected.wellbore
      );

      const trackDef = {
        wellName: selected.well,
        wellboreName: selected.wellbore,
        curves: wellLogs.flatMap((log) =>
          log.objectInfo.map((curve:any) => ({
            mnemonic: curve.mnemonic,
            mnemonicId: curve.mnemonicId,
            unit: curve.unit,
            data: [],
            LogId: log.objectId,
            autoScale: true,
          }))
        ),
        widgets: [], // 👈 now each track has its own widget list
      };

      this.lstOfTrack.push(trackDef);
    }

    console.log('Loaded wells:', this.lstOfTrack);
  }

  /** Initializes INT.com log widgets for each canvas */
  private renderAllWidgets(): void {
    this.canvasTracks.forEach((canvasRef, i) => {
      const well = this.lstOfTrack[i];
      const logWidget = new (window as any).INT.LogWidget({
        container: canvasRef.nativeElement,
        title: `${well.wellName} – ${well.wellboreName}`,
        width: canvasRef.nativeElement.offsetWidth,
        height: 400,
      });

      // Add all curves
      well.curves.forEach((curve: any) =>
        logWidget.addCurve(curve.mnemonic, curve.data, curve.unit)
      );

      // store widget instance
      well.widget = logWidget;

      // initialize widgets panel for this track
      well.widgets = well.curves.map((c: any) => ({
        name: c.mnemonic,
        unit: c.unit,
        value: c.data?.length ? c.data[c.data.length - 1] : 0,
      }));
    });
  }

  /** Updates track and widgets when new data arrives (MQTT / API) */
  updateLiveData(liveData: any[]): void {
    liveData.forEach((entry) => {
      const track = this.lstOfTrack.find(
        (t) =>
          t.wellName === entry.wellName &&
          t.wellboreName === entry.wellboreName
      );
      if (!track || !track.widget) return;

      entry.curves.forEach((curveUpdate: any) => {
        const curve = track.curves.find(
          (c: any) => c.mnemonic === curveUpdate.mnemonic
        );
        if (curve) {
          curve.data = curveUpdate.data;
          track.widget.updateCurve(curve.mnemonic, curve.data);
        }
      });

      // update this track's widget panel
      track.widgets = track.curves.map((c: any) => ({
        name: c.mnemonic,
        unit: c.unit,
        value: c.data?.length ? c.data[c.data.length - 1] : 0,
      }));
    });
  }
}
