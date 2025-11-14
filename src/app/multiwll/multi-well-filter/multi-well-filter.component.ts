import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { StaticTemplateSharedService } from '../../services/static-template-shared.service';  
@Component({
  selector: 'app-multi-well-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './multi-well-filter.component.html',
  styleUrls: ['./multi-well-filter.component.scss']
})
export class MultiWellFilterComponent implements OnInit {
  fb = inject(FormBuilder);
  private sharedService = inject(StaticTemplateSharedService);
  private dialogRef = inject(MatDialogRef<MultiWellFilterComponent>);

  wellsForm!: FormArray;
  wellsList: any[] = [];
  wellboresList: Record<string, any[]> = {};
  mnemonicsList: any[] = [];

  ngOnInit(): void {
    this.initializeData();
    this.loadForm();
  }

  /** Load initial wells / wellbores / mnemonics */
  initializeData() {
    // Default wells
    this.wellsList = [
      { uid: 'ABHD_112', name: 'ABHD_112' },
      { uid: 'ABHD_104', name: 'ABHD_104' },
      { uid: 'ABHD_118', name: 'ABHD_118' },
      { uid: 'ABHD_120', name: 'ABHD_120' },
      { uid: 'ABHD_121', name: 'ABHD_121' }
    ];

    // Wellbore list grouped by well
    this.wellboresList = {
      'ABHD_112': [
        { uid: 'ABHD_112_0', name: 'ABHD_112_0' },
        { uid: 'ABHD_112_1', name: 'ABHD_112_1' }
      ],
      'ABHD_104': [
        { uid: 'ABHD_104_0', name: 'ABHD_104_0' },
        { uid: 'ABHD_104_1', name: 'ABHD_104_1' }
      ],
      'ABHD_118': [
        { uid: 'ABHD_118_0', name: 'ABHD_118_0' }
      ],
      'ABHD_120': [
        { uid: 'ABHD_120_0', name: 'ABHD_120_0' }
      ],
      'ABHD_121': [
        { uid: 'ABHD_121_0', name: 'ABHD_121_0' }
      ]
    };

    // Mnemonics list
    this.mnemonicsList = [
      { uid: 'ROP_L', name: 'ROP_L' },
      { uid: 'WOB_L', name: 'WOB_L' },
      { uid: 'SGR_RT', name: 'SGR_RT' },
      { uid: 'TVD', name: 'TVD' }
    ];
  }

  /** Initialize form array */
  loadForm() {
    const defaults = this.sharedService.getMultiWellFilterData();
    const wells = defaults?.length ? defaults : this.getDefaultWells();
    this.wellsForm = this.fb.array(wells.map((w:any) => this.createWellGroup(w)));
  }
  compareObjects(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.uid === o2.uid : o1 === o2;
  }
  

  /** Form group for one well entry */
  createWellGroup(data?: any): FormGroup {
    return this.fb.group({
      selectedWell: [data?.selectedWell || null],
      selectedWellbore: [data?.selectedWellbore || null],
      selectedMnemonics: [data?.selectedMnemonics || []]
    });
  }

  /** Add new well row */
  addWell() {
    this.wellsForm.push(this.createWellGroup());
  }

  /** Remove well row */
  removeWell(index: number) {
    this.wellsForm.removeAt(index);
  }

  /** Get the correct wellbore list per selected well */
  getWellboresFor(well: any): any[] {
    return this.wellboresList[well?.uid] || [];
  }

  /** Default wells for first-time open */
  private getDefaultWells() {
    return [
      {
        selectedWell: { uid: 'ABHD_112', name: 'ABHD_112' },
        selectedWellbore: { uid: 'ABHD_112_0', name: 'ABHD_112_0' },
        selectedMnemonics: [
          { uid: 'ROP_L', name: 'ROP_L' },
          { uid: 'WOB_L', name: 'WOB_L' }
        ]
      },
      {
        selectedWell: { uid: 'ABHD_104', name: 'ABHD_104' },
        selectedWellbore: { uid: 'ABHD_104_0', name: 'ABHD_104_0' },
        selectedMnemonics: [
          { uid: 'ROP_L', name: 'ROP_L' },
          { uid: 'WOB_L', name: 'WOB_L' }
        ]
      }
    ];
  }

  /** Save selected wells to shared service */
  save() {
    const result = this.wellsForm.value;
    this.sharedService.setMultiWellFilterData(result);
    console.log("result FROM well log comp ", JSON.stringify(this.sharedService.getMultiWellFilterData()));
    this.dialogRef.close(result);
  }

  /** Close dialog without saving */
  cancel() {
    this.dialogRef.close();
  }
}
