import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { AppDetailsComponent } from './app-details/app-details.component';
import { AppDetailsFieldComponent } from './app-details-field/app-details-field.component';

@NgModule({
  declarations: [AppComponent, AppDetailsComponent, AppDetailsFieldComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
