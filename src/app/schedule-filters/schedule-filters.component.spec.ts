import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleFiltersComponent } from './schedule-filters.component';

describe('ScheduleFiltersComponent', () => {
  let component: ScheduleFiltersComponent;
  let fixture: ComponentFixture<ScheduleFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleFiltersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScheduleFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
