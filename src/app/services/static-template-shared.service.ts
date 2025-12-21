// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class StaticTemplateSharedService {
//   private defaultWells = [
//     { well: 'ABHD_112', wellbore: 'ABHD_112_0', mnemonics: ['ROP_L', 'WOB_L'] },
//     { well: 'ABHD_104', wellbore: 'ABHD_104_2', mnemonics: ['ROP_L', 'WOB_L'] },
//     { well: 'ABHD_105', wellbore: 'ABHD_105_1', mnemonics: ['ROP_L', 'WOB_L'] },
//     { well: 'ABHD_106', wellbore: 'ABHD_106_0', mnemonics: ['ROP_L', 'WOB_L'] },
//     { well: 'ABHD_107', wellbore: 'ABHD_107_0', mnemonics: ['ROP_L', 'WOB_L'] }
//   ];

//   private multiWellFilterData = new BehaviorSubject<any>({ wells: this.defaultWells });
//   multiWellFilterData$ = this.multiWellFilterData.asObservable();

//   getDefaultWells(): any[] {
//     return JSON.parse(JSON.stringify(this.defaultWells));
//   }

//   setMultiWellFilterData(data: any) {
//     this.multiWellFilterData.next(data);
//   }

//   getMultiWellFilterData() {
//     return this.multiWellFilterData.getValue();
//   }
// }

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MultiWellFilterResult } from '../models/well'; 

@Injectable({
  providedIn: 'root',
})
export class StaticTemplateSharedService {
  // Use a BehaviorSubject to hold and stream the latest filter data
  private multiWellFilterDataSubject = new BehaviorSubject<MultiWellFilterResult | null>(null);

  setMultiWellFilterData(data: MultiWellFilterResult) {
    this.multiWellFilterDataSubject.next(data);
  }

  getMultiWellFilterData$(): Observable<MultiWellFilterResult | null> {
    return this.multiWellFilterDataSubject.asObservable();
  }

  // Gets the current value (used for initializing the form)
  getMultiWellFilterData(): MultiWellFilterResult | null {
    return this.multiWellFilterDataSubject.value;
  }
}