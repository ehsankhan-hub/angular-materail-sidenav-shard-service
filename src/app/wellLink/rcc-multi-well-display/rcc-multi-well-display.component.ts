import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { StaticTemplateSharedService } from '../../services/static-template-shared.service';  
import { MultiWellFilterComponent } from '../multi-well-filter/multi-well-filter.component';

@Component({
  selector: 'app-rcc-multi-well-display',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './rcc-multi-well-display.component.html',
  styleUrl: './rcc-multi-well-display.component.scss'
})
export class RccMultiWellDisplayComponent implements OnInit {
  wellsData: any[] = [];

  constructor(
    private dialog: MatDialog,
    private sharedService: StaticTemplateSharedService
  ) {}

  ngOnInit(): void {
    // Subscribe to selection changes
    this.sharedService.multiWellFilterData$.subscribe(data => {
      if (data && data.wells) {
        this.wellsData = data.wells;
      }
    });

    // Default wells (similar to your list)
    const defaultWells = {
      wells: [
        {
          selectedWell: { uid: 'W1', name: 'ABHD_112' },
          selectedWellBore: { uid: 'WB1', name: 'ABHD_112_0' },
          mnemonicList: []
        },
        {
          selectedWell: { uid: 'W2', name: 'ABHD_104' },
          selectedWellBore: { uid: 'WB2', name: 'ABHD_104_2' },
          mnemonicList: []
        }
      ]
    };

    this.sharedService.setMultiWellFilterData(defaultWells);
  }

  addWell(): void {
    this.dialog.open(MultiWellFilterComponent, {
      width: '80%',
      height: '80vh'
    });
  }
}
