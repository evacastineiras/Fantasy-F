import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule} from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { LandingBaseComponent } from './landing/landing-base/landing-base.component';
import { LoginComponent } from './landing/login/login.component';
import { RegisterComponent } from './landing/register/register.component';
import { AppRoutingModule } from './app-routing.module';
import { LeagueIndexComponent } from './leagueIndex/league-index/league-index.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingBaseComponent,
    LoginComponent,
    RegisterComponent,
    LeagueIndexComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
