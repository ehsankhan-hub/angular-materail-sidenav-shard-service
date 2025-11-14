import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiWellViewComponent } from './multi-well-view.component';

describe('MultiWellViewComponent', () => {
  let component: MultiWellViewComponent;
  let fixture: ComponentFixture<MultiWellViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiWellViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiWellViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
