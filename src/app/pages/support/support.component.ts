import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-support',
    standalone: true, 
    imports: [FormsModule,CommonModule, ReactiveFormsModule,MatFormFieldModule,MatSelectModule,MatInputModule,MatButtonModule],
    templateUrl: './support.component.html',
    styleUrl: './support.component.css'
})
export class SupportComponent {
    registerForm: FormGroup;
    searchControl = new FormControl('');
    countryFilter = '';
  countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'sa', label: 'Saudi Arabia' },
    { value: 'in', label: 'India' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' }
  ];
  filteredCountries = [...this.countries];
  
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
  }
  
  
  

 
