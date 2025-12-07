import {
  Component,
  Inject,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, NgTemplateOutlet } from '@angular/common';

import { MultiWellDataService } from '../../service/multi-well-service/multiwelldata.service';
import { Well } from '../../models/well';
import { WellBoreList } from '../../models/well-bore-list';
import { WellBoreLogsList } from '../../models/well-bore-log-depth'; // <-- check this import path/name in your project
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StaticTemplateSharedService } from '../../pages/staticTemplate/static-template-shared-service';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RccMultiWellDisplayComponent } from '../rcc-multi-well-display.component';
import { CorrelationDisplayComponent } from '../../well-log/components/correlation-display/correlation-display.component';

@Component({
  selector: 'app-multi-well-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgTemplateOutlet,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    CorrelationDisplayComponent,
    RccMultiWellDisplayComponent,
  ],
  templateUrl: './multi-well-filter.component.html',
  styleUrl: './multi-well-filter.component.scss',
})
export class MultiWellFilterComponent implements OnInit {
  multiWellService = inject(MultiWellDataService);
  formBuilder = inject(FormBuilder);

  wellOptions: Well[] = [];
  wellBoreOptions: WellBoreList[] = [];
  wellBoreLogOptions: WellBoreLogsList[] = [];

  // separate mnemonic options for tracks & widgets
  trackMnemonicOptions: any[][] = [];
  widgetMnemonicOptions: any[][] = [];

  wellForm!: FormGroup;
  token!: string;
  isLoading = true;
  result: any;
  filteredOptions: Well[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef)
    public dialogRef: MatDialogRef<MultiWellFilterComponent>,
    private staticTemplateSharedService: StaticTemplateSharedService
  ) {}

  ngOnInit(): void {
    this.token = '' + localStorage.getItem('token');

    this.wellForm = this.formBuilder.group({
      wells: this.formBuilder.array([]),
    });

    // load wells list
    this.multiWellService.getAllWellList(this.token).subscribe({
      next: (data: any) => {
        this.wellOptions = data as Well[];
      },
      error: (err) => console.error('Failed to load wells', err),
    });
  }

  // ---------- getters ----------

  get wells(): FormArray {
    return this.wellForm.get('wells') as FormArray;
  }

  getTrackMnemonics(index: number): FormArray {
    return this.wells.at(index).get('trackMnemonics') as FormArray;
  }

  getWidgetMnemonics(index: number): FormArray {
    return this.wells.at(index).get('widgetMnemonics') as FormArray;
  }

  selectedWellControl(index: number): FormControl {
    return this.wells.at(index).get('selectedWell') as FormControl;
  }

  selectedWellBoreControl(index: number): FormControl {
    return this.wells.at(index).get('selectedWellBore') as FormControl;
  }

  // ---------- display helpers ----------

  getDisplayValue(well: Well): string {
    return well ? well.name : '';
  }

  getWellBoreDisplayValue(wellBore: any): string {
    return wellBore ? wellBore.name : '';
  }

  filterOptions(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.filteredOptions = this.wellOptions.filter((option) =>
      option.name.toLowerCase().includes(value.toLowerCase())
    );
  }

  // ---------- add / remove wells ----------

  addWell(): void {
    const wellGroup = this.formBuilder.group({
      selectedWell: this.formBuilder.control<Well | null>(
        null,
        Validators.required
      ),
      selectedWellBore: ['', Validators.required],
      trackMnemonics: this.formBuilder.array([]),
      widgetMnemonics: this.formBuilder.array([]),
    });

    this.wells.push(wellGroup);

    // init arrays for this well
    this.wellBoreOptions.push({ wellbores: [], SuppMsgOut: '' });
    this.wellBoreLogOptions.push({
      depthLogs: [],
      timeLogs: [],
      logs: [],
      SuppMsgOut: '',
    });
    this.trackMnemonicOptions.push([]);
    this.widgetMnemonicOptions.push([]);

    const wellIndex = this.wells.length - 1;

    // when well changes → reset wellbore & logs & mnemonics
    wellGroup
      .get('selectedWell')
      ?.valueChanges.subscribe((selectedWell: Well | null) => {
        this.wellBoreOptions[wellIndex] = { wellbores: [], SuppMsgOut: '' };
        this.wellBoreLogOptions[wellIndex] = {
          depthLogs: [],
          timeLogs: [],
          logs: [],
          SuppMsgOut: '',
        };

        wellGroup.get('selectedWellBore')?.setValue('');

        // reset track & widget groups
        this.getTrackMnemonics(wellIndex).clear();
        this.getWidgetMnemonics(wellIndex).clear();
        this.trackMnemonicOptions[wellIndex] = [];
        this.widgetMnemonicOptions[wellIndex] = [];

        if (!selectedWell) {
          return;
        }

        this.fetchWellBoreOptions(wellIndex, selectedWell);
      });

    // when wellbore changes → fetch logs & reset existing mnemonic rows
    wellGroup
      .get('selectedWellBore')
      ?.valueChanges.subscribe((selectedWellBore: any) => {
        const selectedWell = wellGroup.get('selectedWell')?.value as Well | null;

        this.wellBoreLogOptions[wellIndex] = {
          depthLogs: [],
          timeLogs: [],
          logs: [],
          SuppMsgOut: '',
        };
        this.trackMnemonicOptions[wellIndex] = [];
        this.widgetMnemonicOptions[wellIndex] = [];

        // clear current selections in rows
        this.getTrackMnemonics(wellIndex).controls.forEach((mnCtrl, mnIdx) => {
          mnCtrl.get('selectedWellBoreLog')?.setValue('');
          mnCtrl.get('mnemonic')?.setValue('');
          this.trackMnemonicOptions[wellIndex][mnIdx] = [];
        });
        this.getWidgetMnemonics(wellIndex).controls.forEach((mnCtrl, mnIdx) => {
          mnCtrl.get('selectedWellBoreLog')?.setValue('');
          mnCtrl.get('mnemonic')?.setValue('');
          this.widgetMnemonicOptions[wellIndex][mnIdx] = [];
        });

        if (!selectedWellBore || !selectedWell) {
          return;
        }

        this.multiWellService
          .getWellBoreLogsList(
            this.token,
            selectedWell,
            selectedWellBore,
            'measured depth'
          )
          .subscribe({
            next: (logsOptions) => {
              this.wellBoreLogOptions[wellIndex] =
                logsOptions as WellBoreLogsList;
            },
            error: (err) => console.error('error loading logs', err),
          });
      });
  }

  removeWell(wellIdx: number) {
    this.wells.removeAt(wellIdx);
    this.wellBoreOptions.splice(wellIdx, 1);
    this.wellBoreLogOptions.splice(wellIdx, 1);
    this.trackMnemonicOptions.splice(wellIdx, 1);
    this.widgetMnemonicOptions.splice(wellIdx, 1);
  }

  // ---------- fetch wellbore list ----------

  fetchWellBoreOptions(index: number, selectedWell: Well) {
    this.multiWellService.getWellBoreList(this.token, selectedWell).subscribe({
      next: (data: WellBoreList) => {
        this.wellBoreOptions[index] = data;
      },
      error: (err) => {
        console.error('error loading wellbores', err);
      },
    });
  }

  // ---------- Track Mnemonics ----------

  addTrackMnemonic(wellIndex: number) {
    const mnemonicGroup = this.formBuilder.group({
      selectedWellBoreLog: ['', Validators.required],
      mnemonic: ['', Validators.required],
    });

    this.getTrackMnemonics(wellIndex).push(mnemonicGroup);
    const mnemonicIndex = this.getTrackMnemonics(wellIndex).length - 1;

    if (!this.trackMnemonicOptions[wellIndex]) {
      this.trackMnemonicOptions[wellIndex] = [];
    }
    this.trackMnemonicOptions[wellIndex][mnemonicIndex] = [];

    mnemonicGroup
      .get('selectedWellBoreLog')
      ?.valueChanges.subscribe((selectedLog: any) => {
        if (!selectedLog || !selectedLog.logCurveInfo) {
          this.trackMnemonicOptions[wellIndex][mnemonicIndex] = [];
          mnemonicGroup.get('mnemonic')?.setValue('');
          return;
        }

        // fill dropdown with mnemonics from logCurveInfo
        this.trackMnemonicOptions[wellIndex][mnemonicIndex] =
          selectedLog.logCurveInfo;
        mnemonicGroup.get('mnemonic')?.setValue('');
      });
  }

  removeTrackMnemonic(wellIdx: number, mnemonicIdx: number) {
    this.getTrackMnemonics(wellIdx).removeAt(mnemonicIdx);
    if (this.trackMnemonicOptions[wellIdx]) {
      this.trackMnemonicOptions[wellIdx].splice(mnemonicIdx, 1);
    }
  }

  // ---------- Widget Mnemonics ----------

  addWidgetMnemonic(wellIndex: number) {
    const mnemonicGroup = this.formBuilder.group({
      selectedWellBoreLog: ['', Validators.required],
      mnemonic: ['', Validators.required],
    });

    this.getWidgetMnemonics(wellIndex).push(mnemonicGroup);
    const mnemonicIndex = this.getWidgetMnemonics(wellIndex).length - 1;

    if (!this.widgetMnemonicOptions[wellIndex]) {
      this.widgetMnemonicOptions[wellIndex] = [];
    }
    this.widgetMnemonicOptions[wellIndex][mnemonicIndex] = [];

    mnemonicGroup
      .get('selectedWellBoreLog')
      ?.valueChanges.subscribe((selectedLog: any) => {
        if (!selectedLog || !selectedLog.logCurveInfo) {
          this.widgetMnemonicOptions[wellIndex][mnemonicIndex] = [];
          mnemonicGroup.get('mnemonic')?.setValue('');
          return;
        }

        // fill dropdown with mnemonics from logCurveInfo
        this.widgetMnemonicOptions[wellIndex][mnemonicIndex] =
          selectedLog.logCurveInfo;
        mnemonicGroup.get('mnemonic')?.setValue('');
      });
  }

  removeWidgetMnemonic(wellIdx: number, mnemonicIdx: number) {
    this.getWidgetMnemonics(wellIdx).removeAt(mnemonicIdx);
    if (this.widgetMnemonicOptions[wellIdx]) {
      this.widgetMnemonicOptions[wellIdx].splice(mnemonicIdx, 1);
    }
  }

  // ---------- Submit / buttons ----------

  get isSubmitDisabled(): boolean {
    if (this.wellForm.invalid || this.wells.length === 0) {
      return true;
    }

    // each well must have at least 1 track OR 1 widget mnemonic
    for (let i = 0; i < this.wells.length; i++) {
      const tCount = this.getTrackMnemonics(i).length;
      const wCount = this.getWidgetMnemonics(i).length;
      if (tCount === 0 && wCount === 0) {
        return true;
      }
    }
    return false;
  }

  submit(): void {
    if (this.wellForm.valid) {
      this.result = { ...this.wellForm.value };
      localStorage.setItem(
        'multiWellFilterData',
        JSON.stringify(this.wellForm.value)
      );
      this.staticTemplateSharedService.setMultiWellFilterData(this.result);

      const storedData = JSON.parse(
        localStorage.getItem('multiWellFilterData') || '{}'
      );
      console.log('storedData --', storedData);
      console.log(
        'result FROM well log comp ',
        JSON.stringify(
          this.staticTemplateSharedService.getMultiWellFilterData()
        )
      );
      // this.dialogRef.close();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
