import { Component, Inject, OnInit, inject } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MultiWellDataService } from "../../service/multi-well-service/multiwelldata.service";
import { Well } from "../../models/well";
import { WellBoreList } from "../../models/well-bore-list";
import { NgTemplateOutlet } from "@angular/common";
import { WellBoreLogsList } from "../../models/well-bore-logs-list";
import { MatDialogRef } from "@angular/material/dialog";
import { StaticTemplateSharedService } from "../../pages/staticTemplate/static-template-shared-service";

// ⭐ New: Material modules for autocomplete
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";

@Component({
  selector: 'app-multi-well-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule
  ],
  templateUrl: './multi-well-filter.component.html',
  styleUrl: './multi-well-filter.component.scss'
})
export class FilterautocompleteComponent implements OnInit {
  multiWellService = inject(MultiWellDataService);
  formBuilder = inject(FormBuilder);

  tracks: any[] = [];
  wellOptions!: Well[];
  wellBoreOptions: WellBoreList[] = [];
  wellBoreLogOptions: WellBoreLogsList[] = [];
  mnemonicOptions: any[][] = []; // [wellIdx][mnemonicIdx] = curve list

  wellForm!: FormGroup;
  token!: string;
  isLoading = true;
  result: any;

  // ⭐ Filtered lists used by autocomplete
  filteredWells: any[][] = [];              // [wellIdx] = Well[]
  filteredWellBores: any[][] = [];          // [wellIdx] = Wellbore[]
  filteredWellBoreLogs: any[][][] = [];     // [wellIdx][mnemonicIdx] = logs[]
  filteredMnemonics: any[][][] = [];        // [wellIdx][mnemonicIdx] = mnems[]

  constructor(
    @Inject(MatDialogRef) public dialogRef: MatDialogRef<MultiWellFilterComponent>,
    private sharedService: StaticTemplateSharedService
  ) { }

  ngOnInit(): void {
    this.token = "" + localStorage.getItem("token");

    this.wellForm = this.formBuilder.group({
      wells: this.formBuilder.array([]),
    });

    // 1️⃣ Load wells list from backend
    this.multiWellService.getAllWellList(this.token).subscribe({
      next: (data: any) => {
        this.wellOptions = data as Well[];
        this.isLoading = false;

        // 2️⃣ Only AFTER wells are loaded, restore previously selected wells
        this.restorePreviouslySelectedWells();
      },
      error: (err) => {
        console.error("Failed to load wells");
        this.isLoading = false;
      },
    });
  }

  // Restore previously saved state from shared service (called after wells load)
  private restorePreviouslySelectedWells(): void {
    this.sharedService.multiWellFilterData$.subscribe((data: any) => {
      if (!data) return;

      const wells = data.wells || [];

      // Create same number of well rows
      wells.forEach(() => this.addWell());

      wells.forEach((w: any, idx: number) => {
        // WELL
        const wellObj =
          this.wellOptions?.find(x => x.uid === w.selectedWell?.uid) ||
          w.selectedWell;

        this.wells.at(idx).get("selectedWell")?.setValue(wellObj, { emitEvent: true });
        this.wells.at(idx).get("selectedWellText")?.setValue(wellObj?.name || "");

        // Ensure wellbore lists are fetched (valueChanges in addWell() will handle some logic too)
        if (wellObj) {
          this.fetchWllBoreOptions(idx, wellObj);
        }

        // Let async calls fill wellBoreOptions & logs
        setTimeout(() => {
          // WELLBORE
          const boreObj =
            this.wellBoreOptions[idx]?.wellbores
              ?.find((x: any) => x.uid === w.selectedWellBore?.uid) ||
            w.selectedWellBore;

          this.wells.at(idx).get("selectedWellBore")?.setValue(boreObj, { emitEvent: true });
          this.wells.at(idx).get("selectedWellBoreText")?.setValue(boreObj?.name || "");

          // If saved log options exist, reuse them
          if (w.wellBoreLogOptions) {
            this.wellBoreLogOptions[idx] = w.wellBoreLogOptions;
          }

          // MNEMONIC LIST
          (w.mnemonicList || []).forEach((m: any, mIdx: number) => {
            this.addMnemonic(idx); // creates controls, valueChanges etc.

            const mnemonicGroup = this.getMnemonics(idx).at(mIdx) as FormGroup;

            const logObj =
              this.wellBoreLogOptions[idx]?.logs
                ?.find((x: any) => x.uid === m.selectedWellBoreLog?.uid) ||
              m.selectedWellBoreLog;

            mnemonicGroup.get("selectedWellBoreLog")?.setValue(logObj);
            mnemonicGroup.get("selectedWellBoreLogText")?.setValue(logObj?.name || "");

            const allCurves = logObj?.logCurveInfo || [];
            this.mnemonicOptions[idx][mIdx] = allCurves;

            const mnemonicObj =
              allCurves.find((x: any) =>
                x.mnemonic === m.mnemonic?.mnemonic || x.mnemonic === m.mnemonic
              ) || m.mnemonic;

            mnemonicGroup.get("mnemonic")?.setValue(mnemonicObj);
            mnemonicGroup.get("mnemonicText")?.setValue(mnemonicObj?.mnemonic || "");
          });
        });
      });
    });
  }

  // ---------- getters ----------
  get wells(): FormArray {
    return this.wellForm.get("wells") as FormArray;
  }

  getMnemonics(index: number): FormArray {
    return this.wells.at(index).get("mnemonicList") as FormArray;
  }

  // ---------- add/remove WELL ----------
  addWell(): void {
    const wellGroup = this.formBuilder.group({
      selectedWell: this.formBuilder.control<Well | null>(null, Validators.required),
      selectedWellText: this.formBuilder.control<string>(""),   // for autocomplete display
      selectedWellBore: this.formBuilder.control<any | null>(null, Validators.required),
      selectedWellBoreText: this.formBuilder.control<string>(""),
      mnemonicList: this.formBuilder.array([]),
    });

    const index = this.wells.length;

    this.wells.push(wellGroup);

    // Init options arrays
    this.wellBoreOptions[index] = { wellbores: [], SuppMsgOut: "" };
    this.wellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: "" };

    if (!this.filteredWells[index]) this.filteredWells[index] = [];
    if (!this.filteredWellBores[index]) this.filteredWellBores[index] = [];

    // When WELL changes
    wellGroup.get("selectedWell")?.valueChanges.subscribe((selectedWell) => {
      this.wellBoreOptions[index] = { wellbores: [], SuppMsgOut: "" };
      this.wellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: "" };

      wellGroup.get("selectedWellBore")?.setValue(null);
      wellGroup.get("selectedWellBoreText")?.setValue("");

      const mnemonicList = this.getMnemonics(index);
      mnemonicList.controls.forEach((mnemonic) => {
        mnemonic.get("selectedWellBoreLog")?.setValue(null);
        mnemonic.get("selectedWellBoreLogText")?.setValue("");
        mnemonic.get("mnemonic")?.setValue(null);
        mnemonic.get("mnemonicText")?.setValue("");
      });

      this.mnemonicOptions[index] = [];

      if (!selectedWell) return;

      this.fetchWllBoreOptions(index, selectedWell as Well);
    });

    // When WELLBORE changes
    wellGroup.get("selectedWellBore")?.valueChanges.subscribe((wellbores: any) => {
      this.wellBoreLogOptions[index] = { depthLogs: [], timeLogs: [], logs: [], SuppMsgOut: "" };

      const mnemonicList = this.getMnemonics(index);
      mnemonicList.controls.forEach((mnemonic, mnemonicIdx) => {
        mnemonic.get("selectedWellBoreLog")?.setValue(null);
        mnemonic.get("selectedWellBoreLogText")?.setValue("");
        mnemonic.get("mnemonic")?.setValue(null);
        mnemonic.get("mnemonicText")?.setValue("");

        if (!this.mnemonicOptions[index]) this.mnemonicOptions[index] = [];
        this.mnemonicOptions[index][mnemonicIdx] = [];
      });

      const well = wellGroup.get("selectedWell")?.value as Well;
      if (!wellbores || !well) return;

      this.multiWellService
        .getWellBoreLogsList(this.token, well, wellbores, "measured depth")
        .subscribe({
          next: (logsOptions) => {
            this.wellBoreLogOptions[index] = logsOptions as WellBoreLogsList;
          },
          error: (err) => console.log("error loading logs", err),
        });
    });
  }

  fetchWllBoreOptions(index: number, selectedValue: Well) {
    this.multiWellService
      .getWellBoreList(this.token, selectedValue as any)
      .subscribe({
        next: (data: WellBoreList) => {
          this.wellBoreOptions[index] = data;
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  removeWell(wellIdx: number) {
    this.wells.removeAt(wellIdx);
    this.wellBoreOptions.splice(wellIdx, 1);
    this.wellBoreLogOptions.splice(wellIdx, 1);
    this.mnemonicOptions.splice(wellIdx, 1);
    this.filteredWells.splice(wellIdx, 1);
    this.filteredWellBores.splice(wellIdx, 1);
    this.filteredWellBoreLogs.splice(wellIdx, 1);
    this.filteredMnemonics.splice(wellIdx, 1);
  }

  // ---------- add/remove MNEMONIC ----------
  addMnemonic(index: number): void {
    const mnemonicGroup = this.formBuilder.group({
      selectedWellBoreLog: this.formBuilder.control<any | null>(null, Validators.required),
      selectedWellBoreLogText: this.formBuilder.control<string>(""),
      mnemonic: this.formBuilder.control<any | null>(null, Validators.required),
      mnemonicText: this.formBuilder.control<string>(""),
    });

    this.getMnemonics(index).push(mnemonicGroup);

    const mnemonicIndex = this.getMnemonics(index).length - 1;

    if (!this.mnemonicOptions[index]) {
      this.mnemonicOptions[index] = [];
    }

    // When WELLBORE LOG changes, update available mnemonics
    mnemonicGroup
      .get("selectedWellBoreLog")
      ?.valueChanges.subscribe((selectedLogData: any) => {
        this.mnemonicOptions[index][mnemonicIndex] =
          selectedLogData?.logCurveInfo || [];

        mnemonicGroup.get("mnemonic")?.setValue(null);
        mnemonicGroup.get("mnemonicText")?.setValue("");
      });
  }

  removeMnemonic(wellIdx: number, mnemonicIdx: number) {
    this.getMnemonics(wellIdx).removeAt(mnemonicIdx);
    if (this.mnemonicOptions[wellIdx]) {
      this.mnemonicOptions[wellIdx].splice(mnemonicIdx, 1);
    }
  }

  // ---------- submit / close ----------
  get isSubmitDisabled(): boolean {
    if (this.wellForm.invalid || this.wells.length === 0) {
      return true;
    }

    return this.wells.controls.some((well) => {
      const mnemonics = well.get("mnemonicList") as FormArray;
      return mnemonics.length === 0;
    });
  }

  submit(): void {
    if (this.wellForm.valid) {
      const result = { wells: this.wellForm.value?.wells || [] };
      this.sharedService.mergeSelectedWells(result);
      this.dialogRef.close();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  // ---------- AUTOCOMPLETE HELPERS ----------

  // WELL filter + selection
  filterWells(idx: number) {
    const ctrl = this.wells.at(idx).get("selectedWellText") as FormControl;
    const search = (ctrl?.value || "").toString().toLowerCase();

    if (!search) {
      this.filteredWells[idx] = [];
      return;
    }

    this.filteredWells[idx] = (this.wellOptions || []).filter(w =>
      (w.name || "").toLowerCase().includes(search)
    );
  }

  onWellSelected(idx: number, well: Well) {
    this.wells.at(idx).get("selectedWell")?.setValue(well);
    this.wells.at(idx).get("selectedWellText")?.setValue(well?.name || "");
  }

  // WELLBORE filter + selection
  filterWellBores(idx: number) {
    const ctrl = this.wells.at(idx).get("selectedWellBoreText") as FormControl;
    const search = (ctrl?.value || "").toString().toLowerCase();

    const all = this.wellBoreOptions[idx]?.wellbores || [];
    if (!search) {
      this.filteredWellBores[idx] = [];
      return;
    }

    this.filteredWellBores[idx] = all.filter((b: any) =>
      (b.name || "").toLowerCase().includes(search)
    );
  }

  onWellBoreSelected(idx: number, bore: any) {
    this.wells.at(idx).get("selectedWellBore")?.setValue(bore);
    this.wells.at(idx).get("selectedWellBoreText")?.setValue(bore?.name || "");
  }

  // WELLBORE LOG filter + selection
  filterWellBoreLogs(idx: number, mnemonicIdx: number) {
    const group = this.getMnemonics(idx).at(mnemonicIdx) as FormGroup;
    const ctrl = group.get("selectedWellBoreLogText") as FormControl;
    const search = (ctrl?.value || "").toString().toLowerCase();

    const all = this.wellBoreLogOptions[idx]?.logs || [];
    if (!this.filteredWellBoreLogs[idx]) this.filteredWellBoreLogs[idx] = [];

    if (!search) {
      this.filteredWellBoreLogs[idx][mnemonicIdx] = [];
      return;
    }

    this.filteredWellBoreLogs[idx][mnemonicIdx] = all.filter((log: any) =>
      (log.name || "").toLowerCase().includes(search)
    );
  }

  onWellBoreLogSelected(idx: number, mnemonicIdx: number, log: any) {
    const group = this.getMnemonics(idx).at(mnemonicIdx) as FormGroup;
    group.get("selectedWellBoreLog")?.setValue(log);
    group.get("selectedWellBoreLogText")?.setValue(log?.name || "");
  }

  // MNEMONIC filter + selection
  filterMnemonics(idx: number, mnemonicIdx: number) {
    const group = this.getMnemonics(idx).at(mnemonicIdx) as FormGroup;
    const ctrl = group.get("mnemonicText") as FormControl;
    const search = (ctrl?.value || "").toString().toLowerCase();

    const log = group.get("selectedWellBoreLog")?.value;
    const all = log?.logCurveInfo || this.mnemonicOptions[idx][mnemonicIdx] || [];

    if (!this.filteredMnemonics[idx]) this.filteredMnemonics[idx] = [];

    if (!search) {
      this.filteredMnemonics[idx][mnemonicIdx] = [];
      this.mnemonicOptions[idx][mnemonicIdx] = all;
      return;
    }

    const filtered = all.filter((m: any) =>
      (m.mnemonic || "").toLowerCase().includes(search)
    );
    this.filteredMnemonics[idx][mnemonicIdx] = filtered;
    this.mnemonicOptions[idx][mnemonicIdx] = filtered;
  }

  onMnemonicSelected(idx: number, mnemonicIdx: number, m: any) {
    const group = this.getMnemonics(idx).at(mnemonicIdx) as FormGroup;
    group.get("mnemonic")?.setValue(m);
    group.get("mnemonicText")?.setValue(m?.mnemonic || "");
  }

}
