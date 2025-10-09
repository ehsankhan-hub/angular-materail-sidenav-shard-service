import { Component } from '@angular/core';

import { MatExpansionModule } from '@angular/material/expansion'; 
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { from } from 'rxjs';
import { OrgEmployeeViewerComponent } from '../org-employee-viewer/org-employee-viewer.component';
import { CardsComponent } from '../cards/cards.component';

@Component({
    selector: 'app-home',
    standalone: true, 
    imports: [
       CommonModule,
        MatExpansionModule ,
        MatCardModule,
        FlexLayoutModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatRadioModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatInputModule,
        OrgEmployeeViewerComponent,
        CardsComponent
        
      ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent {
  rigs = ['Rig 1', 'Rig 2', 'Rig 3']; // sample options
  from!:FormGroup
  constructor(private fb: FormBuilder) {
    this.from = this.fb.group({
      name: [''],
      description: [''],
      remarks: [''],
      
    });
  }
}
