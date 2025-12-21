import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { Observable, of, startWith, switchMap, tap } from 'rxjs';
import { MultiWellDataService } from '../../services/multi-well-data.service'; 
import { Well, WellBore, WellBoreLogsList, MnemonicInfo, MultiWellFilterResult, MnemonicItem, WellBoreLog, WellBoreList, WellFormGroup, MnemonicFormGroup } from '../models/well';
import { MatDialogRef } from '@angular/material/dialog';
import { StaticTemplateSharedService } from '../../services/static-template-shared.service'; 
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';

// Interface for the temporary structure holding wellbore options
interface WellBoreOptionItem {
  wellbores: WellBore[];
  SuppMsgOut: string;
}

// Interface for the temporary structure holding log/mnemonic options
interface WellBoreLogOptionItem {
  logs: WellBoreLog[];
  depthLogs: WellBoreLog[];
  timeLogs: WellBoreLog[];
  SuppMsgOut: string;
}

@Component({
  selector: 'app-multi-well-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    // Add any other Angular Material modules used (like MatDialogClose)
  ],
  templateUrl: './multi-well-filter.component.html',
  styleUrl: './multi-well-filter.component.scss',
})
export class MultiWellFilterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private multiWellDataService = inject(MultiWellDataService);
  private dialogRef = inject(MatDialogRef<MultiWellFilterComponent>);
  private staticTemplateSharedService = inject(StaticTemplateSharedService);

  wellForm!: FormGroup;
  wellOptions: Well[] = [];
  filteredOptions: Well[] = [];

  // Arrays to hold the dynamic options for wellbores and mnemonics
  wellBoreOptions: WellBoreOptionItem[] = [];
  wellBoreLogOptions: WellBoreLogOptionItem[] = [];
  mnemonicOptions: MnemonicInfo[][][] = []; // [wellIdx][mnemonicIdx][optionList]

  isSubmitDisabled: boolean = false;
  result: MultiWellFilterResult = { wells: [] };

  get wells(): FormArray {
    return this.wellForm.get('wells') as FormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadWellOptions();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.wellForm = this.fb.group({
      wells: this.fb.array([]),
    });
  }

  private loadInitialData(): void {
    const initialData = this.staticTemplateSharedService.getMultiWellFilterData();
    if (initialData && initialData.wells.length > 0) {
      initialData.wells.forEach(wellGroup => {
        const wellFormGroup = this.createWellFormGroup(wellGroup.selectedWell, wellGroup.selectedWellBore);

        this.wells.push(wellFormGroup);
        const wellIdx = this.wells.length - 1;

        // Initialize mnemonic options arrays for the new well
        this.mnemonicOptions[wellIdx] = [];

        wellGroup.mnemonicList.forEach(mnemonicItem => {
          const mnemonicFormGroup = this.createMnemonicFormGroup(mnemonicItem.selectedWellBoreLog, mnemonicItem.mnemonic);
          this.getMnemonics(wellIdx).push(mnemonicFormGroup);

          // Manually load logs and mnemonics for the pre-selected values
          this.loadLogsForWellbore(wellIdx, wellGroup.selectedWell, wellGroup.selectedWellBore).subscribe(() => {
              this.loadMnemonicsForLog(wellIdx, this.getMnemonics(wellIdx).length - 1, mnemonicItem.selectedWellBoreLog);
          });
        });

        // Trigger loading options for wellbores and logs
        this.onWellSelected(wellIdx, wellGroup.selectedWell);
      });
      // Set the global result
      this.result = initialData;
    } else {
      // Start with one empty well group if no initial data
      this.addWell();
    }
  }

  private loadWellOptions(): void {
    this.multiWellDataService.getAllWellList().subscribe(options => {
      this.wellOptions = options;
      this.filteredOptions = options; // Initialize filtered options
    });
  }

  // --- Form Group Creation Helpers ---

  createWellFormGroup(well: Well | null = null, wellBore: WellBore | null = null): FormGroup {
    const group = this.fb.group<WellFormGroup>({
      selectedWell: new FormControl<Well | null>(well, [Validators.required]),
      selectedWellBore: new FormControl<WellBore | null>(wellBore, [Validators.required]),
      mnemonicList: this.fb.array<FormGroup<MnemonicFormGroup>>([]),
    });

    const wellIdx = this.wells.length;

    // Set up listeners for changes
    // Set up listeners for changes
    group.controls['selectedWell'].valueChanges.pipe(
      tap(() => group.controls['selectedWellBore'].setValue(null)), // Clear wellbore on well change
      switchMap((selectedWell) => {
        if (selectedWell && selectedWell.uid) {
          return this.onWellSelected(wellIdx, selectedWell);
        }
        this.wellBoreOptions[wellIdx] = { wellbores: [], SuppMsgOut: '' };
        return of(null);
      })
    ).subscribe();

    group.controls['selectedWellBore'].valueChanges.pipe(
      switchMap((selectedWellBore) => {
        // Clear all mnemonics and logs when wellbore changes
        (group.controls['mnemonicList'] as FormArray).clear();
        this.wellBoreLogOptions[wellIdx] = { logs: [], depthLogs: [], timeLogs: [], SuppMsgOut: '' };
        this.mnemonicOptions[wellIdx] = [];

        if (selectedWellBore && group.controls['selectedWell'].value) {
          return this.loadLogsForWellbore(wellIdx, group.controls['selectedWell'].value, selectedWellBore);
        }
        return of(null);
      })
    ).subscribe();

    return group;
  }

  createMnemonicFormGroup(log: WellBoreLog | null = null, mnemonic: MnemonicInfo | null = null): FormGroup {
    const group = this.fb.group<MnemonicFormGroup>({
      selectedWellBoreLog: new FormControl<WellBoreLog | null>(log, [Validators.required]),
      mnemonic: new FormControl<MnemonicInfo | null>(mnemonic, [Validators.required]),
    });

    const wellIdx = this.wells.length - 1;
    const mnemonicIdx = this.getMnemonics(wellIdx).length;

    // Initialize mnemonic options array for the new mnemonic
    if (!this.mnemonicOptions[wellIdx]) this.mnemonicOptions[wellIdx] = [];
    this.mnemonicOptions[wellIdx][mnemonicIdx] = [];


    group.controls['selectedWellBoreLog'].valueChanges.pipe(
      switchMap((selectedLog) => {
        if (selectedLog) {
          this.loadMnemonicsForLog(wellIdx, mnemonicIdx, selectedLog);
        }
        return of(null);
      })
    ).subscribe();

    return group;
  }

  // --- Data Loading Logic ---

  onWellSelected(wellIdx: number, selectedWell: Well): Observable<WellBoreList | null> {
    return this.multiWellDataService.getWellBoreList(selectedWell).pipe(
      tap((data) => {
        this.wellBoreOptions[wellIdx] = data;
      })
    );
  }

  loadLogsForWellbore(wellIdx: number, well: Well, wellbore: WellBore): Observable<WellBoreLogsList | null> {
    return this.multiWellDataService.getWellBoreLogsList(well, wellbore, 'depth').pipe(
      tap((data) => {
        this.wellBoreLogOptions[wellIdx] = data;
      })
    );
  }

  loadMnemonicsForLog(wellIdx: number, mnemonicIdx: number, selectedLog: WellBoreLog): void {
    if (!selectedLog) return;
    // LogCurveInfo contains the list of available mnemonics
    this.mnemonicOptions[wellIdx][mnemonicIdx] = selectedLog.logCurveInfo;
    this.getMnemonicControl(wellIdx, mnemonicIdx, 'mnemonic').setValue(null); // Clear mnemonic selection
  }

  // --- Form Array Management ---

  addWell(): void {
    this.wells.push(this.createWellFormGroup());
    this.wellBoreOptions.push({ wellbores: [], SuppMsgOut: '' });
    this.wellBoreLogOptions.push({ logs: [], depthLogs: [], timeLogs: [], SuppMsgOut: '' });
    this.mnemonicOptions.push([]);
  }

  removeWell(idx: number): void {
    this.wells.removeAt(idx);
    this.wellBoreOptions.splice(idx, 1);
    this.wellBoreLogOptions.splice(idx, 1);
    this.mnemonicOptions.splice(idx, 1);
  }

  getMnemonics(wellIdx: number): FormArray {
    return this.wells.at(wellIdx).get('mnemonicList') as FormArray;
  }

  addMnemonic(wellIdx: number): void {
    this.getMnemonics(wellIdx).push(this.createMnemonicFormGroup());
  }

  removeMnemonic(wellIdx: number, mnemonicIdx: number): void {
    this.getMnemonics(wellIdx).removeAt(mnemonicIdx);
    if (this.mnemonicOptions[wellIdx]) {
        this.mnemonicOptions[wellIdx].splice(mnemonicIdx, 1);
    }
  }

  // --- Autocomplete Helpers ---

// src/app/multi-well-filter/multi-well-filter.component.ts (for consistency)

selectedWellControl(idx: number): FormControl<Well | null> {
  // Assert the return value is a FormControl
  return this.wells.at(idx).get('selectedWell') as FormControl<Well | null>;
}

selectedWellBoreControl(idx: number): FormControl<WellBore | null> {
  // Assert the return value is a FormControl
  return this.wells.at(idx).get('selectedWellBore') as FormControl<WellBore | null>;
}

// src/app/multi-well-filter/multi-well-filter.component.ts (Revised Method)

// ...

getMnemonicControl(wellIdx: number, mnemonicIdx: number, controlName: keyof MnemonicFormGroup): FormControl<any> {
  const mnemonicArray = this.getMnemonics(wellIdx);
  
  // Use the string casting fix from the previous step
  const controlPath = controlName as string; 
  
  // Use '!' to assert it's non-null, and then assert the return value is a FormControl
  return mnemonicArray.at(mnemonicIdx).get(controlPath)! as FormControl<any>;
}

  filterOptions(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredOptions = this.wellOptions.filter(option =>
      option.name.toLowerCase().includes(value.toLowerCase())
    );
  }

  getDisplayValue(well: Well | null): string {
    return well ? well.name : '';
  }

  getWellBoreDisplayValue(wellBore: WellBore | null): string {
    return wellBore ? wellBore.name : '';
  }

  // --- Submission Logic ---

  submit(): void {
    if (this.wellForm.valid) {
      // Map the form value to the expected result interface
      const formValue = this.wellForm.value;
      this.result = {
        wells: formValue.wells.map((wellGroup: any) => ({
          selectedWell: wellGroup.selectedWell,
          selectedWellBore: wellGroup.selectedWellBore,
          mnemonicList: wellGroup.mnemonicList.map((mnemonicItem: any) => ({
            selectedWellBoreLog: mnemonicItem.selectedWellBoreLog,
            mnemonic: mnemonicItem.mnemonic,
          })) as MnemonicItem[],
        })),
      };

      // 1. Persist/Publish data
      // NOTE: Logic for localStorage storage would go here, but is omitted for simplicity.
      this.staticTemplateSharedService.setMultiWellFilterData(this.result);

      // 2. Close the dialog
      this.closeDialog(this.result);
    } else {
      // Optional: Mark all fields as touched to show errors
      this.wellForm.markAllAsTouched();
    }
  }

  closeDialog(result?: MultiWellFilterResult): void {
    this.dialogRef.close(result);
  }
}