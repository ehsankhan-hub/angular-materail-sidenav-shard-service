import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiwellViewComponentComponent } from './multiwell-view-component.component';

describe('MultiwellViewComponentComponent', () => {
  let component: MultiwellViewComponentComponent;
  let fixture: ComponentFixture<MultiwellViewComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiwellViewComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiwellViewComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
