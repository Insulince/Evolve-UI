import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";

@Component({
  selector: "evolve-ui-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {
  }

  public ngOnInit(): void {
  }

  public titleClicked(): void {
    this.router.navigate(["/evolve", {}]);
  }
}
