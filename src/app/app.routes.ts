import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PartnersComponent } from './pages/partners/partners.component';
import { TrainingComponent } from './pages/training/training.component';
import { EventsComponent } from './pages/events/events.component';
import { SupportComponent } from './pages/support/support.component';

export const routes: Routes = [
    {
        path:'',
        pathMatch:'full',
        redirectTo:'home'
    },
    {
        path:'home',
        component: HomeComponent
    },
    {
        path:'partners',
        component:PartnersComponent
    },
    {
        path:'training',
        component:TrainingComponent
    },
    {
        path:'event',
        component:EventsComponent
    },
    {
        path:'support',
        component:SupportComponent
    },
];
