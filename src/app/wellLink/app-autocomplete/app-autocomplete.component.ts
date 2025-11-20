import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule
  ],
  template: `
    <mat-form-field appearance="outline" class="w-100">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [formControl]="inputControl"
        [matAutocomplete]="auto"
        autocomplete="off"
      />

      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSelect($event.option.value)">
        <mat-option *ngFor="let option of filteredOptions | async" [value]="option">
          {{ option[displayField] }}
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>
  `
})
export class AppAutocompleteComponent implements OnInit, OnChanges {
  @Input() allOptions: any[] = [];
  @Input() selectedOptions: any | null = null;
  @Input() displayField: string = 'name';
  @Input() label: string = 'Select';

  @Output() selectedOptionsChange = new EventEmitter<any>();

  inputControl = new FormControl('');
  filteredOptions!: Observable<any[]>;

  ngOnInit(): void {
    this.initValue();
    this.setupFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOptions'] && !changes['selectedOptions'].firstChange) {
      this.initValue();
    }
    if (changes['allOptions'] && !changes['allOptions'].firstChange) {
      this.setupFilter();
    }
  }

  private initValue(): void {
    if (this.selectedOptions && this.selectedOptions[this.displayField]) {
      this.inputControl.setValue(this.selectedOptions[this.displayField], { emitEvent: false });
    } else {
      this.inputControl.setValue('', { emitEvent: false });
    }
  }

  private setupFilter(): void {
    this.filteredOptions = this.inputControl.valueChanges.pipe(
      startWith(this.inputControl.value || ''),
      map(value => {
        const filterValue = (value || '').toString().toLowerCase();
        return this.allOptions.filter(opt =>
          opt?.[this.displayField]?.toString().toLowerCase().includes(filterValue)
        );
      })
    );
  }

  onSelect(option: any): void {
    this.selectedOptionsChange.emit(option);
  }
}
