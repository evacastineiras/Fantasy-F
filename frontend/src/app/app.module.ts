import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { LandingBaseComponent } from './landing/landing-base/landing-base.component';
import { LoginComponent } from './landing/login/login.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingBaseComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
