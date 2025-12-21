import { AbstractControl } from "@angular/forms";

export interface Well {
  uid: string;
  name: string;
}

export interface WellBore {
  uid: string;
  name: string;
  '@uidWell': string;
  nameWell: string;
}

export interface WellBoreList {
  wellbores: WellBore[];
  SuppMsgOut: string;
}

export interface MnemonicInfo {
  '@uid': string;
  mnemonic: string;
  unit: string;
  curveDescription: string;
}

export interface WellBoreLog {
  uid: string;
  name: string;
  '@uidWell': string;
  '@uidWellbore': string;
  nameWell: string;
  nameWellbore: string;
  logCurveInfo: MnemonicInfo[];
}

export interface WellBoreLogsList {
  logs: WellBoreLog[];
  depthLogs: WellBoreLog[];
  timeLogs: WellBoreLog[];
  SuppMsgOut: string;
}

// Data structure passed from Filter to Display component
export interface SelectedWellData {
  well: Well;
  wellbore: WellBore;
  selectedTrackList: MnemonicItem[];
}

export interface MnemonicItem {
  selectedWellBoreLog: WellBoreLog;
  mnemonic: MnemonicInfo;
}

export interface MultiWellFilterResult {
  wells: {
    selectedWell: Well;
    selectedWellBore: WellBore;
    mnemonicList: MnemonicItem[];
  }[];
}

// Helper interface for the form array structure
export interface WellFormGroup {
    selectedWell: AbstractControl<Well | null>;
    selectedWellBore: AbstractControl<WellBore | null>;
    mnemonicList: AbstractControl<any>; // FormArray of MnemonicFormGroups
}

export interface MnemonicFormGroup {
    selectedWellBoreLog: AbstractControl<WellBoreLog | null>;
    mnemonic: AbstractControl<MnemonicInfo | null>;
}