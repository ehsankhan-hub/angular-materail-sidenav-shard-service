import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealTimeDisplayComponentComponent } from './real-time-display-component.component';

describe('RealTimeDisplayComponentComponent', () => {
  let component: RealTimeDisplayComponentComponent;
  let fixture: ComponentFixture<RealTimeDisplayComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealTimeDisplayComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RealTimeDisplayComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
