import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RccMultiWellDisplayComponent } from '../../wellLink/rcc-multi-well-display/rcc-multi-well-display.component';
import { MultiWellViewComponent } from '../../multiWell/multi-well-view/multi-well-view.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';

@Component({
    selector: 'app-support',
    standalone: true, 
    imports: [RccMultiWellDisplayComponent,MatMenuModule,MultiWellViewComponent, MatButtonModule,
      FormsModule,CommonModule, ReactiveFormsModule,MatFormFieldModule,MatSelectModule,MatInputModule,MatButtonModule],
    templateUrl: './support.component.html',
    styleUrl: './support.component.css'
})
export class SupportComponent {
    registerForm: FormGroup;
    searchControl = new FormControl('');
    countryFilter = '';
    menuTimer: any;
  countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'sa', label: 'Saudi Arabia' },
    { value: 'in', label: 'India' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' }
  ];
  filteredCountries = [...this.countries];
  
  // Open immediately
  menuEnter(trigger: MatMenuTrigger) {
    if (this.menuTimer) {
      clearTimeout(this.menuTimer);
    }
    trigger.openMenu();
  }

  // Close after 100ms delay
  menuLeave(trigger: MatMenuTrigger) {
    this.menuTimer = setTimeout(() => {
      trigger.closeMenu();
    }, 100);
  }
  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      password: [''],
      confirmPassword: [''],
      phone: [''],
      country: ['']
    });
       // filter when user types in search
       this.searchControl.valueChanges.subscribe(value => {
        this.filterCountries(value || '');
      });
    }

    submitForm(){
      console.log(this.registerForm.value);
    }

    filterCountries(search: string) {
        const term = search.toLowerCase();
        this.filteredCountries = this.countries.filter(c =>
          c.label.toLowerCase().includes(term)
        );
      }

      onCountrySelect(selected: string) {
        console.log('Selected country:', selected);
        // 👇 Call your API or method here
       // this.fetchCountryData(selected);
      }
    
      fetchCountryData(country: string) {
        // Example method
        alert(`Fetching data for ${country}`);
      }

      // 1. Source JSON data
  logData = {
    displayName: 'ABG_L',
    min: 8,
    max: 550,
    mnemonic: 'ABG_L',
    unit: 'gAPI',
    wellId: 'A8SF_321',
  };

  // 2. Formatted data for the template table
  jsonData: any[] = []; 

  ngOnInit() {
    this.mapDataForTable();
  }

  mapDataForTable(): void {
    if (this.logData) {
      this.jsonData = [
        { key: 'Mnemonic', val: this.logData.mnemonic },
        { key: 'Unit', val: this.logData.unit },
        { key: 'Well ID', val: this.logData.wellId },
        { key: 'Range', val: `${this.logData.min} - ${this.logData.max}` }
      ];
    }
  }
  }
  
  
  

 
