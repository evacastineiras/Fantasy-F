import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingBaseComponent } from './landing/landing-base/landing-base.component';
import { LeagueIndexComponent } from './leagueIndex/league-index/league-index.component';
import { GeneralComponent } from './general/general.component';
import {RegisterGuard} from './landing/register/register.guard'
import { UserGuard } from './user.guard';
import { ProfileComponent } from './general/options/profile/profile.component';
import { PlayerDetailComponent } from './player-detail/player-detail.component';
import { NotificationsComponent } from './general/options/notifications/notifications.component';

const routes: Routes = [
    {path: '', component: LandingBaseComponent},
    {path: 'leagueIndex', component: LeagueIndexComponent, canActivate: [RegisterGuard]},
     {path: 'home', component: GeneralComponent, canActivate: [UserGuard]},
     {path: 'profile', component: ProfileComponent},
     {path: 'notifications', component: NotificationsComponent},
     { path: 'jugadora/:id', component: PlayerDetailComponent }

];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule {}