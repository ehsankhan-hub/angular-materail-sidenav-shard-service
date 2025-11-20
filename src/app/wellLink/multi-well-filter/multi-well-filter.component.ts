
import { Component, Inject, inject, OnInit } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MultiWellDataService } from "../../services/multi-well-data.service";
import { Well } from "../models/well-bore-logs-list"; 
import { WellBoreList } from "../models/well-bore-logs-list"; 
import { NgTemplateOutlet } from "@angular/common";
import { WellBoreLogsList } from "../models/well-bore-logs-list";  

import { MatDialogRef } from "@angular/material/dialog";
import { StaticTemplateSharedService } from "../../services/static-template-shared.service"; 
import { MatFormFieldModule } from "@angular/material/form-field";
import { AppAutocompleteComponent } from "../app-autocomplete/app-autocomplete.component";

@Component({
  selector: 'app-multi-well-filter',
  standalone: true,
  imports: [ReactiveFormsModule,MatFormFieldModule,AppAutocompleteComponent, NgTemplateOutlet],
  templateUrl: './multi-well-filter.component.html',
  styleUrl: './multi-well-filter.component.scss'
})
export class MultiWellFilterComponent implements OnInit {
  multiWellService = inject(MultiWellDataService);
  formBuilder = inject(FormBuilder);
  tracks = [];
  wellOptions!: Well[];
  wellBoreOptions: WellBoreList[] = [];
  wellBoreLogOptions: WellBoreLogsList[] = [];
  mnemonicOptions: any[][] = [];
  wellForm!: FormGroup;
  token!: string;
  isLoading = true;
  result: any;
  constructor(@Inject(MatDialogRef) public dialogRef: MatDialogRef<MultiWellFilterComponent>,private  sharedService:StaticTemplateSharedService) { }
  ngOnInit(): void {
    this.token = "" + localStorage.getItem("token");
    this.wellForm = this.formBuilder.group({
      wells: this.formBuilder.array([]),
     
    });

    this.multiWellService.getAllWellList().subscribe({
      next: (data: any) => {
        // console.log(data);

        this.wellOptions = data as Well[];
        this.restorePreviouslySelectedWells();
      },
      error: (err) => console.error("Failed to load wells"),
    });
   
   
    
 
 
    

  }
  restorePreviouslySelectedWells(){
  this.sharedService.multiWellFilterData$.subscribe((data: any) => {
    if (!data) return;
  
    const wells = data.wells || [];
    wells.forEach((w: any) => this.addWell());
  
    wells.forEach((w: any, idx: number) => {
      const wellObj = this.wellOptions.find(x => x.uid === w.selectedWell.uid);
      this.wells.at(idx).get("selectedWell")?.setValue(wellObj, { emitEvent: true });
  
      // Load wellbores for this well
      if (wellObj) {
        this.fetchWllBoreOptions(idx, wellObj);
      }
      
  
      setTimeout(() => {
        const boreObj = this.wellBoreOptions[idx].wellbores
          .find(x => x.uid === w.selectedWellBore.uid);
        this.wells.at(idx).get("selectedWellBore")?.setValue(boreObj, { emitEvent: true });
  
        // Load logs
        this.wellBoreLogOptions[idx] = w.wellBoreLogOptions;
  
        // Mnemonics
        w.mnemonicList.forEach((m: any, mIdx: number) => {
          this.addMnemonic(idx);
          const logObj = this.wellBoreLogOptions[idx].logs
            .find(x => x.uid === m.selectedWellBoreLog.uid);
          this.getMnemonics(idx).at(mIdx).get("selectedWellBoreLog")?.setValue(logObj);
  
          const mnemonicObj = logObj?.logCurveInfo.find((x: any) =>
            x.mnemonic === m.mnemonic.mnemonic);
          this.getMnemonics(idx).at(mIdx).get("mnemonic")?.setValue(mnemonicObj);
        });
      });
    });
  });
}

  compareWell = (o1: any, o2: any) =>
  o1 && o2 ? o1.uid === o2.uid : o1 === o2;

compareWellBore = (o1: any, o2: any) =>
  o1 && o2 ? o1.uid === o2.uid : o1 === o2;

compareMnemonic = (o1: any, o2: any) =>
  o1 && o2 ? o1.mnemonic === o2.mnemonic : o1 === o2;



  get wells(): FormArray {
        return this.wellForm.get("wells") as FormArray;
  }
  getMnemonics(index: number): FormArray {
    return this.wells.at(index).get("mnemonicList") as FormArray;
  }
  // adds new track to the graph
  addWell(): void {
    const wellGroup = this.formBuilder.group({
      selectedWell: this.formBuilder.control<Well | null>(
        null,
        Validators.required,
      ),
      selectedWellBore: ["", Validators.required],
      mnemonicList: this.formBuilder.array([]),
    });

    this.wells.push(wellGroup);
    this.wellBoreOptions.push({
      wellbores: [],
      SuppMsgOut: "",
    }); // initialize it with empty array
    this.wellBoreLogOptions.push({
      depthLogs: [],
      timeLogs: [],
      logs: [],
      SuppMsgOut: "",
    }); // initialize it with empty array

    const index = this.wells.length - 1;

    wellGroup.get("selectedWell")?.valueChanges.subscribe((selectedWell) => {
      this.wellBoreOptions[index] = {
        wellbores: [],
        SuppMsgOut: "",
      };
      this.wellBoreLogOptions[index] = {
        depthLogs: [],
        timeLogs: [],
        logs: [],
        SuppMsgOut: "",
      };

      wellGroup.get("selectedWellBore")?.setValue("");
      const mnemonicList = this.getMnemonics(index);
      mnemonicList.controls.forEach((mnemonic) =>
        mnemonic.get("selectedWellBoreLog")?.setValue(""),
      );

      if (!selectedWell) return;

      this.fetchWllBoreOptions(index, selectedWell as any);
    });

    wellGroup
      .get("selectedWellBore")
      ?.valueChanges.subscribe((wellbores: any) => {
        this.wellBoreLogOptions[index] = {
          depthLogs: [],
          timeLogs: [],
          logs: [],
          SuppMsgOut: "",
        };
        const mnemonicList = this.getMnemonics(index);
        mnemonicList.controls.forEach((mnemonic, mnemonicIdx) => {
          mnemonic.get("selectedWellBoreLog")?.setValue(""),
            mnemonic.get("mnemonic")?.setValue("");
          this.mnemonicOptions[index][mnemonicIdx] = [];
        });

        const well = wellGroup.get("selectedWell")?.value as Well;
        console.log("selected well !!!", well);

        if (!wellbores || !well) return;
        this.multiWellService
          .getWellBoreLogsList( well, wellbores, "measured depth")
          .subscribe({
            next: (logsOptions) => {
              console.log("Logs Data", logsOptions);

              this.wellBoreLogOptions[index] = logsOptions as unknown as WellBoreLogsList;
            },
            error: (err) => console.log("error loading logs", err),
          });
      });
  }

  fetchWllBoreOptions(index: number, selectedValue: Well) {
    this.multiWellService
      .getWellBoreList( selectedValue.uid as any)
      .subscribe({
        next: (data: WellBoreList) => {
          // console.log("wellbore data", data);

          this.wellBoreOptions[index] = data;
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  addMnemonic(index: number): void {
    const mnemonicGroup = this.formBuilder.group({
      selectedWellBoreLog: ["", Validators.required],
      mnemonic: ["", Validators.required],
    });
    this.getMnemonics(index).push(mnemonicGroup);

    const mnemonicIndex = this.getMnemonics(index).length - 1;

    // if theres no list of logs set the mnemonic array to empty for
    if (!this.mnemonicOptions[index]) {
      this.mnemonicOptions[index] = [];
    }

    // this.mnemonicOptions[index][mnemonicIndex] = [];
    mnemonicGroup
      .get("selectedWellBoreLog")
      ?.valueChanges.subscribe((selectedLogData: any) => {
        // const log = this.wellBoreLogOptions[index];
        // const selectedLog = log.find()
        this.mnemonicOptions[index][mnemonicIndex] =
          selectedLogData.logCurveInfo;

        console.log("mnemonicOptions", this.mnemonicOptions);

        mnemonicGroup.get("mnemonic")?.setValue("");
      });
  }

  removeMnemonic(wellIdx: number, mnemonicIdx: number) {
    this.getMnemonics(wellIdx).removeAt(mnemonicIdx);
  }

  removeWell(wellIdx: number) {
    this.wells.removeAt(wellIdx);
  }

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
    // this.result = { ...this.wellForm.value };
      const result={ wells:this.wellForm.value?.wells || []}
      this.sharedService.setMultiWellFilterData(this.result);
     // this.sharedService.mergeSelectedWells(result)
     // console.log("result FROM well log comp ", JSON.stringify(this.sharedService.getMultiWellFilterData()));
      this.dialogRef.close();
      
    }
  }
  closeDialog(){
    this.dialogRef.close();
  }
}

