import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilCComponent } from './fil-c.component';

describe('FilCComponent', () => {
  let component: FilCComponent;
  let fixture: ComponentFixture<FilCComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilCComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
