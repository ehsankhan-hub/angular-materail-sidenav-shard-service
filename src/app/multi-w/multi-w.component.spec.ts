import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiWComponent } from './multi-w.component';

describe('MultiWComponent', () => {
  let component: MultiWComponent;
  let fixture: ComponentFixture<MultiWComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiWComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiWComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
