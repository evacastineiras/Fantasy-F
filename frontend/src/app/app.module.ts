import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { LandingBaseComponent } from './landing/landing-base/landing-base.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingBaseComponent,
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
