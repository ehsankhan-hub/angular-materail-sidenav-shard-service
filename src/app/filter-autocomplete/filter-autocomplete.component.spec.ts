import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterAutocompleteComponent } from './filter-autocomplete.component';

describe('FilterAutocompleteComponent', () => {
  let component: FilterAutocompleteComponent;
  let fixture: ComponentFixture<FilterAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterAutocompleteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
