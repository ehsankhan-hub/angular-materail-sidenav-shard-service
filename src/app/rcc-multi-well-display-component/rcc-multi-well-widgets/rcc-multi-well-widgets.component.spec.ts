import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RccMultiWellWidgetsComponent } from './rcc-multi-well-widgets.component';

describe('RccMultiWellWidgetsComponent', () => {
  let component: RccMultiWellWidgetsComponent;
  let fixture: ComponentFixture<RccMultiWellWidgetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RccMultiWellWidgetsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RccMultiWellWidgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
