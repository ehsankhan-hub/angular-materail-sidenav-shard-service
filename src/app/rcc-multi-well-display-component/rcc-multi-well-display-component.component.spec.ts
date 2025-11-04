import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RccMultiWellDisplayComponentComponent } from './rcc-multi-well-display-component.component';

describe('RccMultiWellDisplayComponentComponent', () => {
  let component: RccMultiWellDisplayComponentComponent;
  let fixture: ComponentFixture<RccMultiWellDisplayComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RccMultiWellDisplayComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RccMultiWellDisplayComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
