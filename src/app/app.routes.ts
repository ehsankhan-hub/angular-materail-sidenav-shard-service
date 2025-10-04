import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PartnersComponent } from './pages/partners/partners.component';
import { TrainingComponent } from './pages/training/training.component';
import { EventsComponent } from './pages/events/events.component';
import { SupportComponent } from './pages/support/support.component';
import { LandingComponent } from './layout/landing/landing.component';
import { LoginComponent } from './login/login/login.component';
import { RecentBooksComponent } from './recent-books/recent-books.component';
import { AllBooksComponent } from './all-books/all-books.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { ReviewersComponent } from './pages/reviewers/reviewers.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'reviewers',
    component: ReviewersComponent,
  },

  {
    path: 'landing',
    component: LandingComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'partners', component: PartnersComponent },
      {
        path: 'training',
        component: TrainingComponent,
      },
      {
        path: 'event',
        component: EventsComponent,
      },
      {
        path: 'support',
        component: SupportComponent,
      },
      {path:'registration',component:RegistrationComponent},
      { path: 'recent', component: RecentBooksComponent },  // ✅ new route
      { path: 'all', component: AllBooksComponent },        // ✅ new route
    ],
  },
];
