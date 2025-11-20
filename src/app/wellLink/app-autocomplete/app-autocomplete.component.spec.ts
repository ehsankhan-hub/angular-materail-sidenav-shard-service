import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppAutocompleteComponent } from './app-autocomplete.component';

describe('AppAutocompleteComponent', () => {
  let component: AppAutocompleteComponent;
  let fixture: ComponentFixture<AppAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppAutocompleteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AppAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
