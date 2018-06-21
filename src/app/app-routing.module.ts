import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {EvolveComponent} from "./components/evolve/evolve.component";
import {PageNotFoundComponent} from "./components/page-not-found/page-not-found.component";

const routes: Routes = [
  {
    path: "",
    redirectTo: "/evolve",
    pathMatch: "full"
  },
  {
    path: "evolve",
    component: EvolveComponent
  },
  {
    path: "page-not-found",
    component: PageNotFoundComponent
  },
  {
    path: "**",
    redirectTo: "/page-not-found",
    pathMatch: "full"
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
