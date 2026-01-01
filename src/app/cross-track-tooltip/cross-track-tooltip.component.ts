

private _debouncedHandle(pt: Point): void {
  this._lastMousePt = pt;
  
  // Use requestAnimationFrame for "Instant" feel instead of setTimeout
  if (this._debounceTimer !== undefined) {
      cancelAnimationFrame(this._debounceTimer);
  }
  
  this._debounceTimer = window.requestAnimationFrame(() => {
      if (this._lastMousePt) {
          this._tooltipCallback(this._lastMousePt);
      }
      this._debounceTimer = undefined;
  });
}



//////////////

private _drawForTrack(logTrack: LogTrack, pt: Point, depth: number): void {
  this._currentSequenceIndex++;
  const bounds: any = logTrack.getBounds();
  const index = this._widget.getTrackIndex(logTrack);
  const headerHeight = this._widget.getHeaderHeight();
  const hostRect = this._host.getBoundingClientRect();
  
  this._drawHorizontalLine(index, pt.y, logTrack);

  // 1. Instant Hide if out of bounds (No Delay)
  if (pt.y < headerHeight || 
      pt.y > hostRect.bottom || 
      this._trackInfo[index]?.isIndex || 
      this._trackInfo[index]?.curves?.length === 0
  ) {
      this._hideTooltip(index);
      this._removeHorizontalLine(index);
      return;
  }

  // 2. Immediate Logic (Removed the setTimeout that was here)
  this._currentTrackIdx = index;
  const tooltip = this._getTooltipContainer(index);
  
  // Update content and style immediately
  tooltip.innerHTML = this._buildTooltipContent(depth); 
  tooltip.style.display = 'block';
  
  // Position Logic
  const tooltipHeight = tooltip.offsetHeight || 50;
  const spaceBelow = hostRect.bottom - (pt.y + hostRect.top);
  
  // Flip logic: if not enough space below, show above the mouse
  const topPos = (spaceBelow < tooltipHeight + 20) 
      ? (pt.y + hostRect.top - tooltipHeight - 15) 
      : (pt.y + hostRect.top + 15);

  tooltip.style.top = `${topPos}px`;
  tooltip.style.left = `${bounds.getCenterX() - bounds.getWidth() / 3 + hostRect.left - 20}px`;

  // 3. Draw Circles Synchronously
  const track = this._trackInfo[index];
  const curves = track.curves;
  const trackSelftRight = logTrack.getBounds()?.getRight() ?? 0;
  const trackSelfLeft = logTrack.getBounds()?.getLeft() ?? 0;

  curves.forEach(curve => {
      this._updateCirclePosition(curve, pt, trackSelfLeft, trackSelftRight, hostRect.left, hostRect.top);
  });
}

///

private _updateCirclePosition(curve: any, pt: Point, trackLeft: number, trackRight: number, hostLeft: number, hostTop: number) {
  if (!this._curveCircles[curve.displayName]) {
      const circle = document.createElement('div');
      circle.className = 'cg-cirlce-container';
      circle.style.cssText = `position:absolute; width:12px; height:12px; margin-top:-6px; margin-left:-6px; border-radius:50%; background:${curve.color}; z-index:10001; opacity:0.9;`;
      document.body.appendChild(circle);
      this._curveCircles[curve.displayName] = circle;
  }

  const circle = this._curveCircles[curve.displayName];
  const data = curve.data;
  if (!data || !curve.show) {
      circle.style.display = 'none';
      return;
  }

  // Calculate Index based on mouse Y
  const trackHeight = this._host.getBoundingClientRect().height - this._widget.getHeaderHeight();
  const valRange = curve.max - curve.min;
  const valueAtY = curve.min + valRange * (1 - (pt.y - this._widget.getHeaderHeight()) / trackHeight);
  let idx = Math.round((valueAtY - curve.min) / valRange * (data.length - 1));
  idx = Math.max(0, Math.min(data.length - 1, idx));

  const val = parseFloat(data[idx]);
  const xPercent = (val - curve.min) / valRange;
  const xPos = (xPercent * (trackRight - trackLeft)) + trackLeft + hostLeft;

  if (isNaN(xPos) || xPos < hostLeft) {
      circle.style.display = 'none';
  } else {
      circle.style.left = `${xPos}px`;
      circle.style.top = `${hostTop + pt.y}px`;
      circle.style.display = 'block';
  }
}



////////////////

export class CrossTrackTooltip extends ToolTipTool implements OnDestroy {
  private readonly _selector = new Selector();
  private _host: HTMLElement;
  private _trackInfo: ITracks[] = [];
  private _indexCurveDepth: number[] = [];
  private _indexCurveTime: Date[] = [];
  private _hideHeader = false;

  // Dynamic Arrays (No fixed size)
  private _tooltipPool: HTMLElement[] = [];
  private _horizontalLinePool: HTMLElement[] = [];
  private _circlePool: { [curveName: string]: HTMLElement } = {};

  private _debounceTimer: any;
  private _lastMousePt: Point | undefined;
  private readonly _debounceDelay = 20;

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

      this.setCallback(this._callbackWrapper.bind(this));
      
      // Fix for scrolling: hide everything when the view moves
      this._host.addEventListener('wheel', () => this._resetAll(), { passive: true });
  }

  private _callbackWrapper(pt: Point): any {
      // Clear immediately on move to prevent "ghosts"
      this._resetAll();
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
      this._resetAll();

      const manipLayer: any = this._widget.getTrackManipulatorLayer();
      const sceneTransform = manipLayer?.getSceneTransform?.();
      const depth = sceneTransform ? sceneTransform.inverseTransformPoint(pt).getY() : pt.y;

      const tracks = from(this._widget)
          .where(node => node instanceof LogTrack)
          .selectToArray();

      tracks.forEach((trackNode, i) => {
          const logTrack = trackNode as LogTrack;
          const bounds = logTrack.getBounds();
          if (bounds) {
              this._drawForTrack(logTrack, pt, depth, i);
          }
      });
      return null;
  }

  private _drawForTrack(logTrack: LogTrack, pt: Point, depth: number, idx: number): void {
      const trackIdx = this._widget.getTrackIndex(logTrack);
      const hostRect = this._host.getBoundingClientRect();
      const bounds = logTrack.getBounds();
      if (!bounds || !this._trackInfo[trackIdx]) return;

      // 1. DYNAMIC HORIZONTAL LINE
      if (!this._horizontalLinePool[idx]) {
          const line = document.createElement('div');
          line.style.cssText = 'position:absolute; height:1px; background:white; z-index:10000; pointer-events:none; display:none;';
          document.body.appendChild(line);
          this._horizontalLinePool[idx] = line;
      }
      const line = this._horizontalLinePool[idx];
      line.style.display = 'block';
      line.style.width = `${hostRect.width}px`;
      line.style.left = `${hostRect.left}px`;
      line.style.top = `${pt.y + hostRect.top}px`;

      if (pt.y < this._widget.getHeaderHeight()) return;

      // 2. DYNAMIC TOOLTIP
      if (!this._tooltipPool[idx]) {
          const el = document.createElement('div');
          el.className = 'cg-tooltip-container';
          el.style.cssText = 'position:absolute; pointer-events:none; z-index:99999; background:rgba(0,0,0,0.7); color:white; border:1px solid #777; border-radius:3px; padding:4px; font-size:10px; display:none;';
          document.body.appendChild(el);
          this._tooltipPool[idx] = el;
      }
      const tooltip = this._tooltipPool[idx];
      tooltip.innerHTML = this._buildTooltipContent(trackIdx, depth);
      tooltip.style.display = 'block';

      const tx = bounds.getCenterX() + hostRect.left - (tooltip.offsetWidth / 2 || 50);
      const ty = pt.y + hostRect.top + 15;
      tooltip.style.left = `${tx}px`;
      tooltip.style.top = `${ty}px`;

      // 3. CIRCLES
      this._drawCircles(trackIdx, pt, logTrack, hostRect);
  }

  private _drawCircles(trackIndex: number, pt: Point, logTrack: LogTrack, hostRect: DOMRect) {
      const curves = this._trackInfo[trackIndex].curves;
      const bounds = logTrack.getBounds();
      if (!bounds) return;

      curves.forEach(curve => {
          if (!this._circlePool[curve.displayName]) {
              const circle = document.createElement('div');
              circle.style.cssText = 'position:absolute; width:8px; height:8px; margin-top:-4px; margin-left:-4px; border-radius:50%; z-index:10001; pointer-events:none; display:none;';
              document.body.appendChild(circle);
              this._circlePool[curve.displayName] = circle;
          }
          const circle = this._circlePool[curve.displayName];
          
          // Data Index Logic
          const trackHeight = hostRect.height - this._widget.getHeaderHeight();
          const depthRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
          const currentYDepth = ((pt.y - this._widget.getHeaderHeight()) / trackHeight) * depthRange + this.wellService.plotMinDepth;
          
          let dataIdx = Math.round(((currentYDepth - this.wellService.plotMinDepth) / depthRange) * (curve.data.length - 1));
          dataIdx = Math.max(0, Math.min(curve.data.length - 1, dataIdx));

          const val = parseFloat(curve.data[dataIdx]);
          if (isNaN(val) || !curve.show) {
              circle.style.display = 'none';
              return;
          }

          const xRel = (val - curve.min) / (curve.max - curve.min);
          const xPos = (xRel * bounds.getWidth()) + bounds.getLeft() + hostRect.left;
          circle.style.background = curve.color;
          circle.style.left = `${xPos}px`;
          circle.style.top = `${pt.y + hostRect.top}px`;
          circle.style.display = 'block';
      });
  }

  private _resetAll(): void {
      this._tooltipPool.forEach(t => { if(t) t.style.display = 'none'; });
      this._horizontalLinePool.forEach(l => { if(l) l.style.display = 'none'; });
      Object.values(this._circlePool).forEach(c => { if(c) c.style.display = 'none'; });
  }

  private _buildTooltipContent(trackIdx: number, depth: number): string {
    const track = this._trackInfo[trackIdx];
    if (!track) return '';
    let html = `<b>${track.trackName}</b><br>`;
    const isTimeIndex = track.curves.some(c => !c.isDepth);
    const depthRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
    let idx = Math.round(((depth - this.wellService.plotMinDepth) / depthRange) * (isTimeIndex ? this._indexCurveTime.length - 1 : this._indexCurveDepth.length - 1));
    idx = Math.max(0, Math.min(isTimeIndex ? this._indexCurveTime.length - 1 : this._indexCurveDepth.length - 1, idx));

    if (isTimeIndex) {
        const timeVal = this._indexCurveTime[idx];
        html += `Time: ${timeVal ? formatDate(new Date(timeVal), 'HH:mm:ss', 'en') : 'N/A'}<br>`;
    } else {
        html += `Depth: ${this._indexCurveDepth[idx] ?? 'N/A'}<br>`;
    }

    track.curves.forEach(curve => {
        if (!curve.show || !curve.data) return;
        const val = curve.data[idx];
        html += `${curve.displayName}: ${val} ${curve.unit ?? ''}<br>`;
    });
    return html;
  }

  ngOnDestroy(): void {
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._resetAll();
      this._tooltipPool.forEach(t => t.remove());
      this._horizontalLinePool.forEach(l => l.remove());
      Object.values(this._circlePool).forEach(c => c.remove());
  }
}











///////////////




// import { Component } from '@angular/core';
// import { ToolTipTool } from '@int/geotoolkit/controls/tools/ToolTipTool';
// import { Point } from '@int/geotoolkit/util/Point';
// import { Selector } from '@int/geotoolkit/selection/Selector';
// import { WellLogWidget } from '@int/geotoolkit/welllog/widgets/WellLogWidget';
// import { Obfuscate } from '@int/geotoolkit/decorators';
// import { LogTrack } from '@int/geotoolkit/welllog/LogTrack';
// import { from } from '@int/geotoolkit/selection/from';
// import { ITracks } from '../../models/chart/tracks';
// import { formatDate } from '@angular/common';
// import { WellDataService } from '../../../app/service/well-service/well.service';
// import { OnDestroy } from '@angular/core';
// @Component({
//   selector: 'app-cross-track-tooltip',
//   standalone: true,
//   imports: [],
//   templateUrl: './cross-track-tooltip.component.html',
//   styleUrl: './cross-track-tooltip.component.css'
// })
// export class CrossTrackTooltip extends ToolTipTool implements OnDestroy {
//   private readonly _selector = new Selector();
//   private _host: HTMLElement;
//   private _trackInfo: ITracks[] = [];
//   private _indexCurveDepth: number[] = [];
//   private _indexCurveTime: Date[] = [];
//   private _hideHeader = false;

//   // POOLS & TRACKING
//   private _tooltipPool: HTMLElement[] = [];
//   private _horizontalLinePool: HTMLElement[] = [];
//   private _circlePool: { [curveName: string]: HTMLElement } = {};
//   private _pinnedRows: HTMLElement[] = [];

//   private _isTickActive = false;
//   private _lastMousePt: Point | undefined;

//   constructor(
//       private readonly _widget: WellLogWidget,
//       host: HTMLElement,
//       trackInfo: ITracks[],
//       indexCurveDepth: number[],
//       indexCurveTime: Date[],
//       hideHeader: boolean,
//       private wellService: WellDataService
//   ) {
//       super({ layer: _widget, autoupdate: false, autoflip: true });
//       this._host = host;
//       this._trackInfo = trackInfo;
//       this._indexCurveDepth = indexCurveDepth;
//       this._indexCurveTime = indexCurveTime;
//       this._hideHeader = hideHeader;

//       this._initializePools();
//       this.setCallback(this._callbackWrapper.bind(this));

//       // Click to Pin Listener
//       this._widget.getCanvas().addEventListener('click', (event: MouseEvent) => {
//           if (this._lastMousePt) {
//               this._pinCurrentTooltip(this._lastMousePt);
//           }
//       });
//   }

//   private _initializePools() {
//       for (let i = 0; i < 15; i++) {
//           const el = document.createElement('div');
//           el.className = 'cg-tooltip-container';
//           el.style.cssText = 'position:absolute; display:none; pointer-events:none; z-index:9999; background:rgba(35,35,35,0.9); color:white; border:1px solid #aaa; border-radius:3px; padding:4px; font-size:10px; left:0px; top:0px;';
//           el.style.willChange = 'transform';
//           document.body.appendChild(el);
//           this._tooltipPool.push(el);
//       }
//       for (let i = 0; i < 5; i++) {
//           const line = document.createElement('div');
//           line.style.cssText = 'position:absolute; height:1px; background:rgba(255,255,255,0.6); display:none; z-index:9997; pointer-events:none; left:0px; top:0px;';
//           line.style.willChange = 'transform';
//           document.body.appendChild(line);
//           this._horizontalLinePool.push(line);
//       }
//   }

//   private _callbackWrapper(pt: Point): any {
//       this._lastMousePt = pt;
//       if (this._isTickActive) return null;
//       this._isTickActive = true;

//       window.requestAnimationFrame(() => {
//           if (this._lastMousePt) this._tooltipCallback(this._lastMousePt);
//           this._isTickActive = false;
//       });
//       return null;
//   }

//   private _tooltipCallback(pt: Point): any {
//       this._resetAll();

//       const manipLayer: any = this._widget.getTrackManipulatorLayer();
//       const sceneTransform = manipLayer?.getSceneTransform?.();
//       const depth = sceneTransform ? sceneTransform.inverseTransformPoint(pt).getY() : pt.y;

//       const tracks = from(this._widget).where(node => node instanceof LogTrack).toArray();

//       tracks.forEach((trackNode, i) => {
//           const logTrack = trackNode as LogTrack;
//           const bounds = logTrack.getBounds();
//           if (bounds) {
//               this._drawForTrack(logTrack, pt, depth, i);
//           }
//       });
//       return null;
//   }

//   private _drawForTrack(logTrack: LogTrack, pt: Point, depth: number, poolIdx: number): void {
//       const index = this._widget.getTrackIndex(logTrack);
//       const hostRect = this._host.getBoundingClientRect();
//       const bounds = logTrack.getBounds();

//       // Horizontal Line (Global)
//       if (poolIdx === 0) {
//           const line = this._horizontalLinePool[0];
//           if (line) {
//               line.style.display = 'block';
//               line.style.width = `${hostRect.width}px`;
//               line.style.transform = `translate3d(${hostRect.left}px, ${pt.y + hostRect.top}px, 0)`;
//           }
//       }

//       if (pt.y < this._widget.getHeaderHeight() || !this._trackInfo[index]) return;

//       // Tooltip
//       const tooltip = this._tooltipPool[poolIdx % this._tooltipPool.length];
//       if (tooltip) {
//           tooltip.innerHTML = this._buildTooltipContent(index, depth);
//           tooltip.style.display = 'block';
//           const tx = bounds.getCenterX() + hostRect.left - (tooltip.offsetWidth / 2 || 50);
//           const ty = pt.y + hostRect.top + 15;
//           tooltip.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
//       }

//       this._drawCircles(index, pt, logTrack, hostRect);
//   }

//   private _drawCircles(trackIndex: number, pt: Point, logTrack: LogTrack, hostRect: DOMRect) {
//       const track = this._trackInfo[trackIndex];
//       const bounds = logTrack.getBounds();
//       if (!bounds || !track) return;

//       const trackHeight = hostRect.height - this._widget.getHeaderHeight();
//       const isTimeIndex = track.curves.some(c => !c.isDepth);
//       const indexArrayLength = isTimeIndex ? this._indexCurveTime.length : this._indexCurveDepth.length;
//       if (indexArrayLength === 0) return;

//       let sharedIdx = Math.round(((pt.y - this._widget.getHeaderHeight()) / trackHeight) * (indexArrayLength - 1));
//       sharedIdx = Math.max(0, Math.min(indexArrayLength - 1, sharedIdx));

//       track.curves.forEach(curve => {
//           if (!this._circlePool[curve.displayName]) {
//               const circle = document.createElement('div');
//               circle.style.cssText = 'position:absolute; width:10px; height:10px; margin-top:-5px; margin-left:-5px; border-radius:50%; z-index:9998; pointer-events:none; display:none; left:0px; top:0px;';
//               document.body.appendChild(circle);
//               this._circlePool[curve.displayName] = circle;
//           }
//           const circle = this._circlePool[curve.displayName];
//           const data = curve.data;
//           const valRaw = data ? data[sharedIdx] : undefined;
//           const value = parseFloat(valRaw);

//           if (isNaN(value) || !curve.show) {
//               circle.style.display = 'none';
//               return;
//           }

//           const xRel = (value - curve.min) / (curve.max - curve.min);
//           const xPos = (xRel * bounds.getWidth()) + bounds.getLeft() + hostRect.left;
//           circle.style.background = curve.color;
//           circle.style.transform = `translate3d(${xPos}px, ${pt.y + hostRect.top}px, 0)`;
//           circle.style.display = 'block';
//       });
//   }

//   private _buildTooltipContent(trackIdx: number, depth: number): string {
//       const track = this._trackInfo[trackIdx];
//       if (!track) return '';
//       let html = `<b>${track.trackName}</b><br>`;
//       const isTimeIndex = track.curves.some(c => !c.isDepth);
//       let idx = -1;

//       if (isTimeIndex && this._indexCurveTime.length > 0) {
//           const timeRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
//           idx = Math.round(((depth - this.wellService.plotMinDepth) / timeRange) * (this._indexCurveTime.length - 1));
//           idx = Math.max(0, Math.min(this._indexCurveTime.length - 1, idx));
//           const timeVal = this._indexCurveTime[idx];
//           html += `Time: ${timeVal ? formatDate(new Date(timeVal), 'HH:mm:ss', 'en') : 'N/A'}<br>`;
//       } else {
//           const depthRange = this.wellService.plotMaxDepth - this.wellService.plotMinDepth;
//           idx = Math.round(((depth - this.wellService.plotMinDepth) / depthRange) * (this._indexCurveDepth.length - 1));
//           idx = Math.max(0, Math.min(this._indexCurveDepth.length - 1, idx));
//           html += `Depth: ${this._indexCurveDepth[idx] ?? 'N/A'}<br>`;
//       }

//       track.curves.forEach(curve => {
//           if (!curve.show || !curve.data) return;
//           const valRaw = curve.data[idx];
//           const displayVal = (valRaw === undefined || valRaw === 'NaN') ? 'N/A' : valRaw;
//           html += `${curve.displayName}: ${displayVal} ${curve.unit ?? ''}<br>`;
//       });
//       return html;
//   }

//   private _pinCurrentTooltip(pt: Point): void {
//       const manipLayer: any = this._widget.getTrackManipulatorLayer();
//       const depth = manipLayer?.getSceneTransform?.().inverseTransformPoint(pt).getY() ?? pt.y;
//       const hostRect = this._host.getBoundingClientRect();
//       const tracks = from(this._widget).where(node => node instanceof LogTrack).toArray();

//       const rowGroup = document.createElement('div');
//       document.body.appendChild(rowGroup);
//       this._pinnedRows.push(rowGroup);

//       const pinnedLine = document.createElement('div');
//       pinnedLine.style.cssText = `position:absolute; height:1px; background:#ffcc00; width:${hostRect.width}px; z-index:9990; pointer-events:none; border-top:1px dashed #ffcc00; left:0px; top:0px;`;
//       pinnedLine.style.transform = `translate3d(${hostRect.left}px, ${pt.y + hostRect.top}px, 0)`;
//       rowGroup.appendChild(pinnedLine);

//       tracks.forEach((trackNode) => {
//           const logTrack = trackNode as LogTrack;
//           const bounds = logTrack.getBounds();
//           const index = this._widget.getTrackIndex(logTrack);
//           if (bounds) {
//               const pinnedBox = document.createElement('div');
//               pinnedBox.style.cssText = 'position:absolute; z-index:10000; padding:5px; border-radius:3px; background:rgba(30,30,30,0.95); border:1px solid #ffcc00; color:white; font-size:10px; pointer-events:auto; min-width:110px; cursor:move; left:0px; top:0px;';
//               const isClickedTrack = bounds.contains(pt.x, pt.y);
//               pinnedBox.innerHTML = `<div class="drag-handle" style="border-bottom:1px solid #555; margin-bottom:4px;">${isClickedTrack ? '<span class="close-row" style="float:right; color:#f44; cursor:pointer;">✕</span>' : ''}<b>PINNED</b></div>${this._buildTooltipContent(index, depth)}`;
//               pinnedBox.style.transform = `translate3d(${bounds.getCenterX() + hostRect.left - 55}px, ${pt.y + hostRect.top + 10}px, 0)`;

//               let isDragging = false; let offset = { x: 0, y: 0 };
//               pinnedBox.onmousedown = (e) => {
//                   if ((e.target as HTMLElement).classList.contains('close-row')) return;
//                   isDragging = true;
//                   const matrix = new WebKitCSSMatrix(window.getComputedStyle(pinnedBox).transform);
//                   offset = { x: e.clientX - matrix.m41, y: e.clientY - matrix.m42 };
//               };
//               window.addEventListener('mousemove', (e) => {
//                   if (isDragging) pinnedBox.style.transform = `translate3d(${e.clientX - offset.x}px, ${e.clientY - offset.y}px, 0)`;
//               });
//               window.addEventListener('mouseup', () => isDragging = false);

//               if (isClickedTrack) pinnedBox.querySelector('.close-row')?.addEventListener('click', () => { rowGroup.remove(); this._pinnedRows = this._pinnedRows.filter(r => r !== rowGroup); });
//               rowGroup.appendChild(pinnedBox);
//           }
//       });
//   }

//   private _resetAll(): void {
//       this._tooltipPool.forEach(t => t.style.display = 'none');
//       this._horizontalLinePool.forEach(l => l.style.display = 'none');
//       Object.values(this._circlePool).forEach(c => c.style.display = 'none');
//   }

//   ngOnDestroy(): void {
//       this._isTickActive = false;
//       this._resetAll();
//       this._tooltipPool.forEach(t => t.remove());
//       this._horizontalLinePool.forEach(l => l.remove());
//       Object.values(this._circlePool).forEach(c => c.remove());
//       this._pinnedRows.forEach(r => r.remove());
//   }

//   public destroy(): void { this.ngOnDestroy(); }
// }