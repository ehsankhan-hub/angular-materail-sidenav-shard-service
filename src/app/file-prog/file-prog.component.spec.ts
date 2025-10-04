import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileProgComponent } from './file-prog.component';

describe('FileProgComponent', () => {
  let component: FileProgComponent;
  let fixture: ComponentFixture<FileProgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileProgComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileProgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
