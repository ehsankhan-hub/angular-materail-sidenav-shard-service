import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: "app-rcc-multi-well-widgets",
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: "./rcc-multi-well-widgets.component.html",
  styleUrls: ["./rcc-multi-well-widgets.component.scss"],
})
export class RccMultiWellWidgetsComponent {
  @Input() wellName: string = "";
  @Input() widgets: { label: string; value: any }[] = [];
}
