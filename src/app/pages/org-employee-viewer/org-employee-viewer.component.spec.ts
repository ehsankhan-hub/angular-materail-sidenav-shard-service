import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgEmployeeViewerComponent } from './org-employee-viewer.component';

describe('OrgEmployeeViewerComponent', () => {
  let component: OrgEmployeeViewerComponent;
  let fixture: ComponentFixture<OrgEmployeeViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgEmployeeViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrgEmployeeViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
