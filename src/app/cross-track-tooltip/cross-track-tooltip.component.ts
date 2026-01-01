import { Component } from '@angular/core';
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
@Component({
  selector: 'app-cross-track-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './cross-track-tooltip.component.html',
  styleUrl: './cross-track-tooltip.component.css'
})
export class CrossTrackTooltip extends ToolTipTool implements OnDestroy {
  private readonly _selector = new Selector();
  private _host: HTMLElement;
  private _trackInfo: ITracks[] = [];
  private _indexCurveDepth: number[] = [];
  private _indexCurveTime: Date[] = [];
  private _hideHeader = false;

  // POOLS & TRACKING
  private _tooltipPool: HTMLElement[] = [];
  private _horizontalLinePool: HTMLElement[] = [];
  private _circlePool: { [curveName: string]: HTMLElement } = {};
  private _pinnedRows: HTMLElement[] = [];

  private _isTickActive = false;
  private _lastMousePt: Point | undefined;

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

      this._initializePools();
      this.setCallback(this._callbackWrapper.bind(this));

      // Click to Pin Listener
      this._widget.getCanvas().addEventListener('click', (event: MouseEvent) => {
          if (this._lastMousePt) {
              this._pinCurrentTooltip(this._lastMousePt);
          }
      });
  }

  private _initializePools() {
      for (let i = 0; i < 15; i++) {
          const el = document.createElement('div');
          el.className = 'cg-tooltip-container';
          el.style.cssText = 'position:absolute; display:none; pointer-events:none; z-index:9999; background:rgba(35,35,35,0.9); color:white; border:1px solid #aaa; border-radius:3px; padding:4px; font-size:10px; left:0px; top:0px;';
          el.style.willChange = 'transform';
          document.body.appendChild(el);
          this._tooltipPool.push(el);
      }
      for (let i = 0; i < 5; i++) {
          const line = document.createElement('div');
          line.style.cssText = 'position:absolute; height:1px; background:rgba(255,255,255,0.6); display:none; z-index:9997; pointer-events:none; left:0px; top:0px;';
          line.style.willChange = 'transform';
          document.body.appendChild(line);
          this._horizontalLinePool.push(line);
      }
  }

  private _callbackWrapper(pt: Point): any {
      this._lastMousePt = pt;
      if (this._isTickActive) return null;
      this._isTickActive = true;

      window.requestAnimationFrame(() => {
          if (this._lastMousePt) this._tooltipCallback(this._lastMousePt);
          this._isTickActive = false;
      });
      return null;
  }

  private _tooltipCallback(pt: Point): any {
      this._resetAll();

      const manipLayer: any = this._widget.getTrackManipulatorLayer();
      const sceneTransform = manipLayer?.getSceneTransform?.();
      const depth = sceneTransform ? sceneTransform.inverseTransformPoint(pt).getY() : pt.y;

      const tracks = from(this._widget).where(node => node instanceof LogTrack).toArray();

      tracks.forEach((trackNode, i) => {
          const logTrack = trackNode as LogTrack;
          const bounds = logTrack.getBounds();
          if (bounds) {
              this._drawForTrack(logTrack, pt, depth, i);
          }
      });
      return null;
  }

  private _drawForTrack(logTrack: LogTrack, pt: Point, depth: number, poolIdx: number): void {
      const index = this._widget.getTrackIndex(logTrack);
      const hostRect = this._host.getBoundingClientRect();
      const bounds = logTrack.getBounds();

      // Horizontal Line (Global)
      if (poolIdx === 0) {
          const line = this._horizontalLinePool[0];
          if (line) {
              line.style.display = 'block';
              line.style.width = `${hostRect.width}px`;
              line.style.transform = `translate3d(${hostRect.left}px, ${pt.y + hostRect.top}px, 0)`;
          }
      }

      if (pt.y < this._widget.getHeaderHeight() || !this._trackInfo[index]) return;

      // Tooltip
      const tooltip = this._tooltipPool[poolIdx % this._tooltipPool.length];
      if (tooltip) {
          tooltip.innerHTML = this._buildTooltipContent(index, depth);
          tooltip.style.display = 'block';
          const tx = bounds.getCenterX() + hostRect.left - (tooltip.offsetWidth / 2 || 50);
          const ty = pt.y + hostRect.top + 15;
          tooltip.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }

      this._drawCircles(index, pt, logTrack, hostRect);
  }

  private _drawCircles(trackIndex: number, pt: Point, logTrack: LogTrack, hostRect: DOMRect) {
      const track = this._trackInfo[trackIndex];
      const bounds = logTrack.getBounds();
      if (!bounds || !track) return;

      const trackHeight = hostRect.height - this._widget.getHeaderHeight();
      const isTimeIndex = track.curves.some(c => !c.isDepth);
      const indexArrayLength = isTimeIndex ? this._indexCurveTime.length : this._indexCurveDepth.length;
      if (indexArrayLength === 0) return;

      let sharedIdx = Math.round(((pt.y - this._widget.getHeaderHeight()) / trackHeight) * (indexArrayLength - 1));
      sharedIdx = Math.max(0, Math.min(indexArrayLength - 1, sharedIdx));

      track.curves.forEach(curve => {
          if (!this._circlePool[curve.displayName]) {
              const circle = document.createElement('div');
              circle.style.cssText = 'position:absolute; width:10px; height:10px; margin-top:-5px; margin-left:-5px; border-radius:50%; z-index:9998; pointer-events:none; display:none; left:0px; top:0px;';
              document.body.appendChild(circle);
              this._circlePool[curve.displayName] = circle;
          }
          const circle = this._circlePool[curve.displayName];
          const data = curve.data;
          const valRaw = data ? data[sharedIdx] : undefined;
          const value = parseFloat(valRaw);

          if (isNaN(value) || !curve.show) {
              circle.style.display = 'none';
              return;
          }

          const xRel = (value - curve.min) / (curve.max - curve.min);
          const xPos = (xRel * bounds.getWidth()) + bounds.getLeft() + hostRect.left;
          circle.style.background = curve.color;
          circle.style.transform = `translate3d(${xPos}px, ${pt.y + hostRect.top}px, 0)`;
          circle.style.display = 'block';
      });
  }

  private _buildTooltipContent(trackIdx: number, depth: number): string {
      const track = this._trackInfo[trackIdx];
      if (!track) return '';
      let html = `<b>${track.trackName}</b><br>`;
      const isTimeIndex = track.curves.some(c => !c.isDepth);
      let idx = -1;

      if (isTimeIndex && this._indexCurveTime.length > 0) {
          const timeRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
          idx = Math.round(((depth - this.wellService.plotMinDepth) / timeRange) * (this._indexCurveTime.length - 1));
          idx = Math.max(0, Math.min(this._indexCurveTime.length - 1, idx));
          const timeVal = this._indexCurveTime[idx];
          html += `Time: ${timeVal ? formatDate(new Date(timeVal), 'HH:mm:ss', 'en') : 'N/A'}<br>`;
      } else {
          const depthRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
          idx = Math.round(((depth - this.wellService.plotMinDepth) / depthRange) * (this._indexCurveDepth.length - 1));
          idx = Math.max(0, Math.min(this._indexCurveDepth.length - 1, idx));
          html += `Depth: ${this._indexCurveDepth[idx] ?? 'N/A'}<br>`;
      }

      track.curves.forEach(curve => {
          if (!curve.show || !curve.data) return;
          const valRaw = curve.data[idx];
          const displayVal = (valRaw === undefined || valRaw === 'NaN') ? 'N/A' : valRaw;
          html += `${curve.displayName}: ${displayVal} ${curve.unit ?? ''}<br>`;
      });
      return html;
  }

  private _pinCurrentTooltip(pt: Point): void {
      const manipLayer: any = this._widget.getTrackManipulatorLayer();
      const depth = manipLayer?.getSceneTransform?.().inverseTransformPoint(pt).getY() ?? pt.y;
      const hostRect = this._host.getBoundingClientRect();
      const tracks = from(this._widget).where(node => node instanceof LogTrack).toArray();

      const rowGroup = document.createElement('div');
      document.body.appendChild(rowGroup);
      this._pinnedRows.push(rowGroup);

      const pinnedLine = document.createElement('div');
      pinnedLine.style.cssText = `position:absolute; height:1px; background:#ffcc00; width:${hostRect.width}px; z-index:9990; pointer-events:none; border-top:1px dashed #ffcc00; left:0px; top:0px;`;
      pinnedLine.style.transform = `translate3d(${hostRect.left}px, ${pt.y + hostRect.top}px, 0)`;
      rowGroup.appendChild(pinnedLine);

      tracks.forEach((trackNode) => {
          const logTrack = trackNode as LogTrack;
          const bounds = logTrack.getBounds();
          const index = this._widget.getTrackIndex(logTrack);
          if (bounds) {
              const pinnedBox = document.createElement('div');
              pinnedBox.style.cssText = 'position:absolute; z-index:10000; padding:5px; border-radius:3px; background:rgba(30,30,30,0.95); border:1px solid #ffcc00; color:white; font-size:10px; pointer-events:auto; min-width:110px; cursor:move; left:0px; top:0px;';
              const isClickedTrack = bounds.contains(pt.x, pt.y);
              pinnedBox.innerHTML = `<div class="drag-handle" style="border-bottom:1px solid #555; margin-bottom:4px;">${isClickedTrack ? '<span class="close-row" style="float:right; color:#f44; cursor:pointer;">✕</span>' : ''}<b>PINNED</b></div>${this._buildTooltipContent(index, depth)}`;
              pinnedBox.style.transform = `translate3d(${bounds.getCenterX() + hostRect.left - 55}px, ${pt.y + hostRect.top + 10}px, 0)`;

              let isDragging = false; let offset = { x: 0, y: 0 };
              pinnedBox.onmousedown = (e) => {
                  if ((e.target as HTMLElement).classList.contains('close-row')) return;
                  isDragging = true;
                  const matrix = new WebKitCSSMatrix(window.getComputedStyle(pinnedBox).transform);
                  offset = { x: e.clientX - matrix.m41, y: e.clientY - matrix.m42 };
              };
              window.addEventListener('mousemove', (e) => {
                  if (isDragging) pinnedBox.style.transform = `translate3d(${e.clientX - offset.x}px, ${e.clientY - offset.y}px, 0)`;
              });
              window.addEventListener('mouseup', () => isDragging = false);

              if (isClickedTrack) pinnedBox.querySelector('.close-row')?.addEventListener('click', () => { rowGroup.remove(); this._pinnedRows = this._pinnedRows.filter(r => r !== rowGroup); });
              rowGroup.appendChild(pinnedBox);
          }
      });
  }

  private _resetAll(): void {
      this._tooltipPool.forEach(t => t.style.display = 'none');
      this._horizontalLinePool.forEach(l => l.style.display = 'none');
      Object.values(this._circlePool).forEach(c => c.style.display = 'none');
  }

  ngOnDestroy(): void {
      this._isTickActive = false;
      this._resetAll();
      this._tooltipPool.forEach(t => t.remove());
      this._horizontalLinePool.forEach(l => l.remove());
      Object.values(this._circlePool).forEach(c => c.remove());
      this._pinnedRows.forEach(r => r.remove());
  }

  public destroy(): void { this.ngOnDestroy(); }
}