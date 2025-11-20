import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiWellFilterComponent } from './multi-well-filter.component';

describe('MultiWellFilterComponent', () => {
  let component: MultiWellFilterComponent;
  let fixture: ComponentFixture<MultiWellFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiWellFilterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiWellFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
