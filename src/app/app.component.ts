import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {Evolve, EvolveRequest, EvolveResponse} from "./pb/evolve_pb";
import {EvolveService} from "./pb/evolve_pb_service";
import {grpc} from "grpc-web-client";

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

  evolve(): void {
    const evolveRequest: EvolveRequest = new EvolveRequest();
    const evolve: Evolve = new Evolve();
    evolve.setA(55);
    evolveRequest.setEvolve(evolve);

    grpc.unary(EvolveService.Evolve, {
      request: evolveRequest,
      host: "http://localhost:8080",
      onEnd: (response: any): void => {
        console.log(response.message.toObject());
      }
    });
  }
}
