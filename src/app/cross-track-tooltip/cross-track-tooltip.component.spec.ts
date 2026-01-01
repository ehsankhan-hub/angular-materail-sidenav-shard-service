import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrossTrackTooltipComponent } from './cross-track-tooltip.component';

describe('CrossTrackTooltipComponent', () => {
  let component: CrossTrackTooltipComponent;
  let fixture: ComponentFixture<CrossTrackTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrossTrackTooltipComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrossTrackTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
