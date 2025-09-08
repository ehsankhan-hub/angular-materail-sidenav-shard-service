import { Component } from '@angular/core';
import { RouterModule } from "@angular/router";
import { LandingComponent } from './layout/landing/landing.component';
import { ParentComponent } from './parent/parent.component';
// import { RouterModule, RouterOutlet } from '@angular/router';
// import { MatToolbarModule } from '@angular/material/toolbar';
// import { MatSidenavModule } from '@angular/material/sidenav';
// import { MatIconModule } from '@angular/material/icon';
// import { MatListModule } from '@angular/material/list';
// import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-root',
    //imports: [RouterOutlet,MatToolbarModule,MatSidenavModule,MatIconModule,MatListModule,MatButtonModule,RouterModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    standalone: true, 
    imports: [RouterModule,ParentComponent]
})
export class AppComponent {
  title = 'angular-sidenav';

  // menuItems: any[] =[
  //   {
  //     icon:'home',
  //     label:'Home',
  //     route:'home'
  //   },
  //   {
  //     icon:'handshake',
  //     label:'Partners',
  //     route:'partners'
  //   },
  //   {
  //     icon:'book',
  //     label:'Training',
  //     route:'training'
  //   },
  //   {
  //     icon:'event',
  //     label:'Events',
  //     route:'event'
  //   },
  //   {
  //     icon:'help',
  //     label:'Support',
  //     route:'support'
  //   }
  // ];
}
