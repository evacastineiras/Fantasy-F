import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule} from '@angular/common/http';
import { DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { LOCALE_ID } from '@angular/core'; 
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { AppComponent } from './app.component';
import { LandingBaseComponent } from './landing/landing-base/landing-base.component';
import { LoginComponent } from './landing/login/login.component';
import { RegisterComponent } from './landing/register/register.component';
import { AppRoutingModule } from './app-routing.module';
import { LeagueIndexComponent } from './leagueIndex/league-index/league-index.component';
import { SelectLeagueIndexComponent } from './leagueIndex/league-index/select-league-index/select-league-index.component';
import { PrivateLeagueComponent } from './leagueIndex/league-index/private-league/private-league.component';
import { CreateLeagueComponent } from './leagueIndex/league-index/create-league/create-league.component';
import { GeneralComponent } from './general/general.component';
import { NavigatorComponent } from './general/navigator/navigator.component';
import { HomeComponent } from './general/home/home.component';
import { MarketComponent } from './general/market/market.component';
import { TeamComponent } from './general/team/team.component';
import { StatsComponent } from './general/stats/stats.component';
import { LeagueComponent } from './general/league/league.component';
import { MoreComponent } from './general/more/more.component';
import { ProfileComponent } from './general/options/profile/profile.component';
import { RulesComponent } from './general/more/rules/rules.component';
import { BudgetBoxComponent } from './general/budget-box/budget-box.component';
import { PlayerDetailComponent } from './player-detail/player-detail.component';
import { NotificationsComponent } from './general/options/notifications/notifications.component';

registerLocaleData(localeEs, 'es');

@NgModule({
  declarations: [
    AppComponent,
    LandingBaseComponent,
    LoginComponent,
    RegisterComponent,
    LeagueIndexComponent,
    SelectLeagueIndexComponent,
    PrivateLeagueComponent,
    CreateLeagueComponent,
    GeneralComponent,
    NavigatorComponent,
    HomeComponent,
    MarketComponent,
    TeamComponent,
    StatsComponent,
    LeagueComponent,
    MoreComponent,
    ProfileComponent,
    RulesComponent,
    BudgetBoxComponent,
    PlayerDetailComponent,
    NotificationsComponent,
  ],
  imports: [
    BrowserModule,
    DatePipe,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
