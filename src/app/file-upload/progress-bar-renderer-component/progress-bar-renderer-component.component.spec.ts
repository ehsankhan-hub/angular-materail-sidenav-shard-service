import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressBarRendererComponentComponent } from './progress-bar-renderer-component.component';

describe('ProgressBarRendererComponentComponent', () => {
  let component: ProgressBarRendererComponentComponent;
  let fixture: ComponentFixture<ProgressBarRendererComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBarRendererComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProgressBarRendererComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
