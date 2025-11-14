import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { StaticTemplateSharedService } from '../../services/static-template-shared.service'; 
import { MultiWellFilterComponent } from '../multi-well-filter/multi-well-filter.component';

@Component({
  selector: 'app-rcc-multi-well-display',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule, MultiWellFilterComponent],
  templateUrl: './rcc-multi-well-display.component.html',
  styleUrls: ['./rcc-multi-well-display.component.scss']
})
export class RccMultiWellDisplayComponent implements OnInit {

  wellsData: any[] = [];
  filteredData: any;

  constructor(
    public dialog: MatDialog,
    private staticTemplateSharedService: StaticTemplateSharedService
  ) {}

  ngOnInit(): void {
    this.wellsData = this.staticTemplateSharedService.getDefaultWells();

    this.staticTemplateSharedService.multiWellFilterData$.subscribe((data: any) => {
      if (data?.wells?.length > 0) {
        this.wellsData = data.wells;
      }
    });
  }

  addWell(): void {
    const currentSelection = this.staticTemplateSharedService.getMultiWellFilterData();
    const dialogData =
      currentSelection && currentSelection.wells?.length > 0
        ? currentSelection
        : { wells: this.staticTemplateSharedService.getDefaultWells() };

    this.dialog.open(MultiWellFilterComponent, {
      width: '80%',
      height: '80vh',
      data: dialogData
    });
  }
}
