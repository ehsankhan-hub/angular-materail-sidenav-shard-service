import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateTComponent } from './generate-t.component';

describe('GenerateTComponent', () => {
  let component: GenerateTComponent;
  let fixture: ComponentFixture<GenerateTComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateTComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GenerateTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
