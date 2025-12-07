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
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MultiWellDataService } from '../../service/multi-well-service/multiwelldata.service';
import { Well } from '../../models/well';
import { WellBoreList } from '../../models/well-bore-list';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { WellBoreLogsList } from '../../models/well-bore-logs-list';
import { WellBoreLogDepth } from '../../models/well-bore-log-depth';
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
export class MultiWellFilterComponent implements OnInit {
  multiWellService = inject(MultiWellDataService);
  formBuilder = inject(FormBuilder);
  tracks = [];

  // --- original arrays (kept for compatibility) ---
  wellOptions: Well[]; // available wells from API
  // CHANGED: we now maintain separate option containers for track & widget
  trackWellBoreOptions: WellBoreList[] = []; // NEW - per-index for track wells
  widgetWellBoreOptions: WellBoreList[] = []; // NEW - per-index for widget wells

  trackWellBoreLogOptions: WellBoreLogsList[] = []; // NEW
  widgetWellBoreLogOptions: WellBoreLogsList[] = []; // NEW

  trackMnemonicOptions: any[][] = []; // NEW
  widgetMnemonicOptions: any[][] = []; // NEW

  // CHANGED: new top-level form with two arrays
  wellForm: FormGroup; // will contain trackWells & widgetWells
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

    // CHANGED: form now has two arrays: trackWells and widgetWells
    this.wellForm = this.formBuilder.group({
      trackWells: this.formBuilder.array([]), // NEW
      widgetWells: this.formBuilder.array([]), // NEW
    });

    // Prefill logic: support both new structure and legacy 'wells' key
    const storedRaw = localStorage.getItem('multiWellFilterData');
    let storedData: any = null;
    try {
      storedData = storedRaw ? JSON.parse(storedRaw) : null;
    } catch (e) {
      storedData = null;
    }
    console.log('storedData  ngOnInit', storedData);

    // Load wells list from API (if needed). note: per your request you didn't want to
    // override wellOptions elsewhere; still safe to call. If you truly want to avoid this
    // remove the subscribe body.
    this.multiWellService.getAllWellList(this.token).subscribe({
      next: (data: any) => {
        this.wellOptions = data as Well[];
        this.filteredOptions = this.wellOptions;

        // After we have wellOptions, restore saved entries (if any)
        // Handle new structure
        if (storedData?.trackWells?.length) {
          storedData.trackWells.forEach((w: any) => {
            this.addTrackWell(w); // NEW - prefill track wells
          });
        }

        if (storedData?.widgetWells?.length) {
          storedData.widgetWells.forEach((w: any) => {
            this.addWidgetWell(w); // NEW - prefill widget wells
          });
        }

        // Legacy support: if old code stored 'wells' only
        if (!storedData?.trackWells && storedData?.wells?.length) {
          storedData.wells.forEach((w: any) => {
            this.addTrackWell(w); // treat legacy wells as trackWells by default
          });
        }
      },
      error: (err) => console.error('Failed to load wells'),
    });
  }

  // -------------------------
  // Form Array getters (NEW & CHANGED)
  // -------------------------
  get trackWells(): FormArray {
    return this.wellForm.get('trackWells') as FormArray; // NEW
  }
  get widgetWells(): FormArray {
    return this.wellForm.get('widgetWells') as FormArray; // NEW
  }

  // Keep a compatibility getter for 'wells' if old code still references it
  get wells(): FormArray {
    // CHANGED: return trackWells for backwards compatibility
    return this.trackWells;
  }

  getTrackMnemonics(index: number): FormArray {
    return this.trackWells.at(index).get('mnemonicList') as FormArray; // NEW
  }
  getWidgetMnemonics(index: number): FormArray {
    return this.widgetWells.at(index).get('mnemonicList') as FormArray; // NEW
  }

  // -------------------------
  // Display helpers (unchanged)
  // -------------------------
  selectedWellControlForTrack(index: number): FormControl {
    return this.trackWells.at(index).get('selectedWell') as FormControl;
  }
  selectedWellBoreControlForTrack(index: number): FormControl {
    return this.trackWells.at(index).get('selectedWellBore') as FormControl;
  }

  selectedWellControlForWidget(index: number): FormControl {
    return this.widgetWells.at(index).get('selectedWell') as FormControl;
  }
  selectedWellBoreControlForWidget(index: number): FormControl {
    return this.widgetWells.at(index).get('selectedWellBore') as FormControl;
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
    this.filteredOptions = this.wellOptions.filter((option) => {
      return option.name.toLowerCase().includes(value.toLowerCase());
    });
  }

  // -------------------------
  // Helper to create a well FormGroup (used for both track & widget) - NEW
  // -------------------------
  private createWellGroup(prefillData?: any): FormGroup {
    const wellGroup = this.formBuilder.group({
      selectedWell: this.formBuilder.control<Well | null>(
        prefillData?.selectedWell || null,
        Validators.required
      ),
      selectedWellBore: [prefillData?.selectedWellBore || '', Validators.required],
      mnemonicList: this.formBuilder.array([]),
    });
    return wellGroup;
  }

  // -------------------------
  // TRACK section functions (NEW)
  // -------------------------
  addTrackWell(prefillData?: any): void {
    const wellGroup = this.createWellGroup(prefillData); // NEW
    this.trackWells.push(wellGroup); // NEW

    // initialize track-specific options
    this.trackWellBoreOptions.push({ wellbores: [], SuppMsgOut: '' } as any);
    this.trackWellBoreLogOptions.push({ depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' } as any);
    this.trackMnemonicOptions[this.trackWells.length - 1] = [];

    const index = this.trackWells.length - 1;

    // subscribe to selectedWell changes (track)
    wellGroup.get('selectedWell')?.valueChanges.subscribe((selectedWell) => {
      this.trackWellBoreOptions[index] = { wellbores: [], SuppMsgOut: '' } as any;
      this.trackWellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' } as any;

      wellGroup.get('selectedWellBore')?.setValue('');
      const mnemonicList = this.getTrackMnemonics(index);
      mnemonicList.controls.forEach((mnemonic) =>
        mnemonic.get('selectedWellBoreLog')?.setValue('')
      );

      if (!selectedWell) return;
      this.fetchWllBoreOptionsForTrack(index, selectedWell as any);
    });

    // subscribe to selectedWellBore for track
    wellGroup.get('selectedWellBore')?.valueChanges.subscribe((wellbores: any) => {
      this.trackWellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' } as any;
      const mnemonicList = this.getTrackMnemonics(index);
      mnemonicList.controls.forEach((mnemonic, mnemonicIdx) => {
        mnemonic.get('selectedWellBoreLog')?.setValue('');
        mnemonic.get('mnemonic')?.setValue('');
        this.trackMnemonicOptions[index][mnemonicIdx] = [];
      });

      const well = wellGroup.get('selectedWell')?.value as Well;
      if (!wellbores || !well) return;

      this.multiWellService
        .getWellBoreLogsList(this.token, well, wellbores, 'measured depth')
        .subscribe({
          next: (logsOptions) => {
            this.trackWellBoreLogOptions[index] = logsOptions as WellBoreLogsList;

            // If prefill exists (we might have set selectedWellBore before)
            if (prefillDataExistsForGroup(wellGroup)) {
              // handled by prefill when the group was added
            }
          },
          error: (err) => console.log('error loading logs', err),
        });
    });

    // If prefill specified selectedWellBore, set it so valueChanges triggers
    if (prefillDataExists(prefillData)) {
      wellGroup.get('selectedWellBore')?.setValue(prefillData.selectedWellBore);
      // restore mnemonics
      if (prefillData?.mnemonicList?.length) {
        prefillData.mnemonicList.forEach((mnData: any) => {
          this.addTrackMnemonic(index, mnData);
        });
      }
    }
  }

  // -------------------------
  // WIDGET section functions (NEW)
  // -------------------------
  addWidgetWell(prefillData?: any): void {
    const wellGroup = this.createWellGroup(prefillData); // NEW
    this.widgetWells.push(wellGroup); // NEW

    // initialize widget-specific options
    this.widgetWellBoreOptions.push({ wellbores: [], SuppMsgOut: '' } as any);
    this.widgetWellBoreLogOptions.push({ depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' } as any);
    this.widgetMnemonicOptions[this.widgetWells.length - 1] = [];

    const index = this.widgetWells.length - 1;

    // subscribe to selectedWell changes (widget)
    wellGroup.get('selectedWell')?.valueChanges.subscribe((selectedWell) => {
      this.widgetWellBoreOptions[index] = { wellbores: [], SuppMsgOut: '' } as any;
      this.widgetWellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' } as any;

      wellGroup.get('selectedWellBore')?.setValue('');
      const mnemonicList = this.getWidgetMnemonics(index);
      mnemonicList.controls.forEach((mnemonic) =>
        mnemonic.get('selectedWellBoreLog')?.setValue('')
      );

      if (!selectedWell) return;
      this.fetchWllBoreOptionsForWidget(index, selectedWell as any);
    });

    // subscribe to selectedWellBore for widget
    wellGroup.get('selectedWellBore')?.valueChanges.subscribe((wellbores: any) => {
      this.widgetWellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: '' } as any;
      const mnemonicList = this.getWidgetMnemonics(index);
      mnemonicList.controls.forEach((mnemonic, mnemonicIdx) => {
        mnemonic.get('selectedWellBoreLog')?.setValue('');
        mnemonic.get('mnemonic')?.setValue('');
        this.widgetMnemonicOptions[index][mnemonicIdx] = [];
      });

      const well = wellGroup.get('selectedWell')?.value as Well;
      if (!wellbores || !well) return;

      this.multiWellService
        .getWellBoreLogsList(this.token, well, wellbores, 'measured depth')
        .subscribe({
          next: (logsOptions) => {
            this.widgetWellBoreLogOptions[index] = logsOptions as WellBoreLogsList;
          },
          error: (err) => console.log('error loading logs', err),
        });
    });

    // If prefill specified selectedWellBore, set it so valueChanges triggers
    if (prefillDataExists(prefillData)) {
      wellGroup.get('selectedWellBore')?.setValue(prefillData.selectedWellBore);
      // restore mnemonics
      if (prefillData?.mnemonicList?.length) {
        prefillData.mnemonicList.forEach((mnData: any) => {
          this.addWidgetMnemonic(index, mnData);
        });
      }
    }
  }

  // -------------------------
  // fetch wellbore options helpers (duplicated per section to keep logic separate) - NEW
  // -------------------------
  fetchWllBoreOptionsForTrack(index: number, selectedValue: Well) {
    this.multiWellService.getWellBoreList(this.token, selectedValue as any).subscribe({
      next: (data: WellBoreList) => {
        this.trackWellBoreOptions[index] = data;
      },
      error: (err) => console.error(err),
    });
  }

  fetchWllBoreOptionsForWidget(index: number, selectedValue: Well) {
    this.multiWellService.getWellBoreList(this.token, selectedValue as any).subscribe({
      next: (data: WellBoreList) => {
        this.widgetWellBoreOptions[index] = data;
      },
      error: (err) => console.error(err),
    });
  }

  // -------------------------
  // Mnemonic handling (duplicated per section)
  // -------------------------
  addTrackMnemonic(index: number, prefillData?: any): void {
    const mnemonicGroup = this.formBuilder.group({
      selectedWellBoreLog: [prefillData?.selectedWellBoreLog || '', Validators.required],
      mnemonic: [prefillData?.mnemonic || '', Validators.required],
    });
    this.getTrackMnemonics(index).push(mnemonicGroup);

    const mnemonicIndex = this.getTrackMnemonics(index).length - 1;
    if (!this.trackMnemonicOptions[index]) {
      this.trackMnemonicOptions[index] = [];
    }

    mnemonicGroup.get('selectedWellBoreLog')?.valueChanges.subscribe((selectedLogData: any) => {
      this.trackMnemonicOptions[index][mnemonicIndex] =
        selectedLogData?.logCurveInfo || [];
      // after logs loaded, if prefill had mnemonic, set it (prefill path handled earlier too)
      if (prefillData?.mnemonic) {
        mnemonicGroup.get('mnemonic')?.setValue(prefillData.mnemonic);
      } else {
        mnemonicGroup.get('mnemonic')?.setValue('');
      }
    });
  }

  addWidgetMnemonic(index: number, prefillData?: any): void {
    const mnemonicGroup = this.formBuilder.group({
      selectedWellBoreLog: [prefillData?.selectedWellBoreLog || '', Validators.required],
      mnemonic: [prefillData?.mnemonic || '', Validators.required],
    });
    this.getWidgetMnemonics(index).push(mnemonicGroup);

    const mnemonicIndex = this.getWidgetMnemonics(index).length - 1;
    if (!this.widgetMnemonicOptions[index]) {
      this.widgetMnemonicOptions[index] = [];
    }

    mnemonicGroup.get('selectedWellBoreLog')?.valueChanges.subscribe((selectedLogData: any) => {
      this.widgetMnemonicOptions[index][mnemonicIndex] =
        selectedLogData?.logCurveInfo || [];
      if (prefillData?.mnemonic) {
        mnemonicGroup.get('mnemonic')?.setValue(prefillData.mnemonic);
      } else {
        mnemonicGroup.get('mnemonic')?.setValue('');
      }
    });
  }

  removeTrackMnemonic(wellIdx: number, mnemonicIdx: number) {
    this.getTrackMnemonics(wellIdx).removeAt(mnemonicIdx);
  }

  removeWidgetMnemonic(wellIdx: number, mnemonicIdx: number) {
    this.getWidgetMnemonics(wellIdx).removeAt(mnemonicIdx);
  }

  removeTrackWell(wellIdx: number) {
    this.trackWells.removeAt(wellIdx);
  }
  removeWidgetWell(wellIdx: number) {
    this.widgetWells.removeAt(wellIdx);
  }

  // -------------------------
  // Validation (unchanged logic, applied to both arrays combined) - CHANGED
  // -------------------------
  get isSubmitDisabled(): boolean {
    // require at least one track well OR one widget well and ensure each selected has mnemonics
    const noTracks = this.trackWells.length === 0;
    const noWidgets = this.widgetWells.length === 0;

    if (noTracks && noWidgets) return true;

    const trackInvalid = this.trackWells.controls.some((well) => {
      const mnemonics = well.get('mnemonicList') as FormArray;
      return mnemonics.length === 0;
    });

    const widgetInvalid = this.widgetWells.controls.some((well) => {
      const mnemonics = well.get('mnemonicList') as FormArray;
      return mnemonics.length === 0;
    });

    return trackInvalid || widgetInvalid;
  }

  // -------------------------
  // Submit: save both trackWells and widgetWells - CHANGED
  // -------------------------
  submit(): void {
    // Build plain JS objects to store
    const trackWellsValue = this.trackWells.value;
    const widgetWellsValue = this.widgetWells.value;

    // Save both and keep legacy 'wells' = trackWells for backward compatibility
    const resultObj = {
      trackWells: trackWellsValue,
      widgetWells: widgetWellsValue,
      wells: trackWellsValue, // legacy fallback
    };

    localStorage.setItem('multiWellFilterData', JSON.stringify(resultObj));
    this.staticTemplateSharedService.setMultiWellFilterData(resultObj);

    console.log('storedData --', resultObj);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}

// -------------------------
// small helper functions (module-scope) to aid readability
// -------------------------
function prefillDataExists(prefillData: any): boolean {
  return !!(prefillData && (prefillData.selectedWellBore || prefillData.mnemonicList));
}
function prefillDataExistsForGroup(group: FormGroup): boolean {
  // placeholder - not used heavily; included for clarity
  return false;
}
