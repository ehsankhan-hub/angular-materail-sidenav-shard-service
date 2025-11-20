import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RccMultiWellDisplayComponent } from './rcc-multi-well-display.component';

describe('RccMultiWellDisplayComponent', () => {
  let component: RccMultiWellDisplayComponent;
  let fixture: ComponentFixture<RccMultiWellDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RccMultiWellDisplayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RccMultiWellDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
