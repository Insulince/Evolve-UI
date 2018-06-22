import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {AppComponent} from "./app.component";
import {EvolveComponent} from "./components/evolve/evolve.component";
import {AppRoutingModule} from "./app-routing.module";
import {PageNotFoundComponent} from "./components/page-not-found/page-not-found.component";
import {GridifyPipe} from "./pipes/gridify.pipe";

@NgModule({
  declarations: [
    AppComponent,
    EvolveComponent,
    PageNotFoundComponent,
    GridifyPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
