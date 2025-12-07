import {
  AfterViewInit,
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
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MultiWellDataService } from '../../service/multi-well-service/multiwelldata.service';
import { Well } from '../../models/well';
import { WellBoreList } from '../../models/well-bore-list';
import { WellBoreLogsList } from '../../models/well-bore-logs-list';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StaticTemplateSharedService } from '../../pages/staticTemplate/static-template-shared-service';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
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
    NgTemplateOutlet,
    MatAutocompleteModule,
    MatFormFieldModule,
    CorrelationDisplayComponent,
    MatInputModule,
    CommonModule,
    FormsModule,
    RccMultiWellDisplayComponent,
  ],
  templateUrl: './multi-well-filter.component.html',
  styleUrl: './multi-well-filter.component.scss',
})
export class MultiWellFilterComponent implements OnInit, AfterViewInit {
  multiWellService = inject(MultiWellDataService);
  formBuilder = inject(FormBuilder);

  wellOptions: Well[];
  wellBoreOptions: WellBoreList[] = [];
  wellBoreLogOptions: WellBoreLogsList[] = [];

  // Separate mnemonic arrays for Tracks and Widgets
  trackMnemonicOptions: any[][] = [];
  widgetMnemonicOptions: any[][] = [];

  wellForm: FormGroup;
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

  ngAfterViewInit(): void {
    const storedData = localStorage.getItem('multiWellFilterData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      this.wellForm.patchValue(parsedData);
      this.wells.controls.forEach((control, index) => {
        control
          .get('selectedWell')
          ?.setValue(
            this.wellOptions.find(
              (option) => option.uid === parsedData.wells[index].selectedWell
            )
          );
        control
          .get('selectedWellBore')
          ?.setValue(
            this.wellBoreOptions[index].wellbores.find(
              (option) =>
                option.uid === parsedData.wells[index].selectedWellBore
            )
          );
      });
    }
  }

  ngOnInit(): void {
    this.token = '' + localStorage.getItem('token');
    this.wellForm = this.formBuilder.group({
      wells: this.formBuilder.array([]),
    });

    const storedData = localStorage.getItem('multiWellFilterData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      parsedData.wells.forEach((well: any) => {
        const wellGroup = this.formBuilder.group({
          selectedWell: [well.selectedWell],
          selectedWellBore: [well.selectedWellBore],
          trackMnemonics: this.formBuilder.array([]),
          widgetMnemonics: this.formBuilder.array([]),
        });
        this.wells.push(wellGroup);
      });
    }

    this.multiWellService.getAllWellList(this.token).subscribe({
      next: (data: any) => {
        this.wellOptions = data as Well[];
      },
      error: (err) => console.error('Failed to load wells'),
    });
  }

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

  addWell(): void {
    const wellGroup = this.formBuilder.group({
      selectedWell: this.formBuilder.control<Well | null>(null, Validators.required),
      selectedWellBore: ['', Validators.required],
      trackMnemonics: this.formBuilder.array([]),
      widgetMnemonics: this.formBuilder.array([]),
    });

    this.wells.push(wellGroup);
    this.wellBoreOptions.push({ wellbores: [], SuppMsgOut: '' });
    this.wellBoreLogOptions.push({ depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' });
    this.trackMnemonicOptions.push([]);
    this.widgetMnemonicOptions.push([]);

    const index = this.wells.length - 1;

    wellGroup.get('selectedWell')?.valueChanges.subscribe((selectedWell) => {
      this.wellBoreOptions[index] = { wellbores: [], SuppMsgOut: '' };
      this.wellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' };

      wellGroup.get('selectedWellBore')?.setValue('');

      this.getTrackMnemonics(index).controls.forEach((mnemonic) =>
        mnemonic.get('selectedWellBoreLog')?.setValue('')
      );
      this.getWidgetMnemonics(index).controls.forEach((mnemonic) =>
        mnemonic.get('selectedWellBoreLog')?.setValue('')
      );

      if (!selectedWell) return;

      this.fetchWellBoreOptions(index, selectedWell as any);
    });

    wellGroup.get('selectedWellBore')?.valueChanges.subscribe((wellBore: any) => {
      const well = wellGroup.get('selectedWell')?.value as Well;
      if (!wellBore || !well) return;

      this.multiWellService.getWellBoreLogsList(this.token, well, wellBore, 'measured depth')
        .subscribe({
          next: (logsOptions) => {
            this.wellBoreLogOptions[index] = logsOptions as WellBoreLogsList;
            // reset track/widget mnemonic dropdowns
            this.trackMnemonicOptions[index] = [];
            this.widgetMnemonicOptions[index] = [];
            this.getTrackMnemonics(index).controls.forEach((mnemonic, mnIdx) => {
              mnemonic.get('mnemonic')?.setValue('');
              this.trackMnemonicOptions[index][mnIdx] = logsOptions.logs;
            });
            this.getWidgetMnemonics(index).controls.forEach((mnemonic, mnIdx) => {
              mnemonic.get('mnemonic')?.setValue('');
              this.widgetMnemonicOptions[index][mnIdx] = logsOptions.logs;
            });
          },
          error: (err) => console.log('error loading logs', err),
        });
    });
  }

  fetchWellBoreOptions(index: number, selectedValue: Well) {
    this.multiWellService.getWellBoreList(this.token, selectedValue as any).subscribe({
      next: (data: WellBoreList) => {
        this.wellBoreOptions[index] = data;
      },
      error: (err) => console.error(err),
    });
  }

  addTrackMnemonic(index: number) {
    const mnemonicGroup = this.formBuilder.group({
      selectedWellBoreLog: ['', Validators.required],
      mnemonic: ['', Validators.required],
    });
    const mnemonicIndex = this.getTrackMnemonics(index).length;
    this.getTrackMnemonics(index).push(mnemonicGroup);
    // initialize empty array for dropdown
    if (!this.trackMnemonicOptions[index]) this.trackMnemonicOptions[index] = [];
    this.trackMnemonicOptions[index][mnemonicIndex] = [];
  }

  addWidgetMnemonic(index: number) {
    const mnemonicGroup = this.formBuilder.group({
      selectedWellBoreLog: ['', Validators.required],
      mnemonic: ['', Validators.required],
    });
    const mnemonicIndex = this.getWidgetMnemonics(index).length;
    this.getWidgetMnemonics(index).push(mnemonicGroup);
    if (!this.widgetMnemonicOptions[index]) this.widgetMnemonicOptions[index] = [];
    this.widgetMnemonicOptions[index][mnemonicIndex] = [];
  }

  removeTrackMnemonic(wellIdx: number, mnemonicIdx: number) {
    this.getTrackMnemonics(wellIdx).removeAt(mnemonicIdx);
    this.trackMnemonicOptions[wellIdx].splice(mnemonicIdx, 1);
  }

  removeWidgetMnemonic(wellIdx: number, mnemonicIdx: number) {
    this.getWidgetMnemonics(wellIdx).removeAt(mnemonicIdx);
    this.widgetMnemonicOptions[wellIdx].splice(mnemonicIdx, 1);
  }

  removeWell(wellIdx: number) {
    this.wells.removeAt(wellIdx);
    this.wellBoreOptions.splice(wellIdx, 1);
    this.wellBoreLogOptions.splice(wellIdx, 1);
    this.trackMnemonicOptions.splice(wellIdx, 1);
    this.widgetMnemonicOptions.splice(wellIdx, 1);
  }

  get isSubmitDisabled(): boolean {
    if (this.wellForm.invalid || this.wells.length === 0) return true;
    return this.wells.controls.some(well =>
      this.getTrackMnemonics(this.wells.controls.indexOf(well)).length === 0 &&
      this.getWidgetMnemonics(this.wells.controls.indexOf(well)).length === 0
    );
  }

  submit(): void {
    if (this.wellForm.valid) {
      this.result = { ...this.wellForm.value };
      localStorage.setItem('multiWellFilterData', JSON.stringify(this.wellForm.value));
      this.staticTemplateSharedService.setMultiWellFilterData(this.result);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
