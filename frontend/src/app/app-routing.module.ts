import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingBaseComponent } from './landing/landing-base/landing-base.component';
import { LeagueIndexComponent } from './leagueIndex/league-index/league-index.component';
import {RegisterGuard} from './landing/register/register.guard'

const routes: Routes = [
    {path: '', component: LandingBaseComponent},
    {path: 'leagueIndex', component: LeagueIndexComponent, canActivate: [RegisterGuard]}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule {}