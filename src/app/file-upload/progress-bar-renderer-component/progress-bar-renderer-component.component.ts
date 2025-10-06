import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-bar-container">
      <div class="progress-bar-fill" [style.width.%]="value || 0"></div>
    </div>
  `,
  styles: [`
    .progress-bar-container {
      width: 100%;
      height: 16px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
    }
    .progress-bar-fill {
      height: 100%;
      background: repeating-linear-gradient(
        -45deg,
        #ff1744,
        #ff1744 10px,
        #ff4569 10px,
        #ff4569 20px
      );
      border-radius: 10px 0 0 10px;
      animation: move-stripes 1s linear infinite;
      transition: width 0.3s ease-out;
    }
    @keyframes move-stripes {
      0% { background-position: 0 0; }
      100% { background-position: 40px 0; }
    }
  `]
})
export class ProgressBarRendererComponent {
  @Input() value: number = 0;
}

