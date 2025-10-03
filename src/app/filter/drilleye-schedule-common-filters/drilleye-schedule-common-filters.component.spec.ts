import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrilleyeScheduleCommonFiltersComponent } from './drilleye-schedule-common-filters.component';

describe('DrilleyeScheduleCommonFiltersComponent', () => {
  let component: DrilleyeScheduleCommonFiltersComponent;
  let fixture: ComponentFixture<DrilleyeScheduleCommonFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrilleyeScheduleCommonFiltersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DrilleyeScheduleCommonFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
