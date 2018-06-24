import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {RpcService} from "./services/rpc/rpc.service";
import {CreatureRpcService} from "./services/rpc/creature-rpc.service";

@Component({
  selector: "evolve-ui-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  constructor(private router: Router,
              private rpcService: RpcService,
              private creatureRpcService: CreatureRpcService) {
  }

  public ngOnInit(): void {
  }

  public titleClicked(): void {
    this.router.navigate(["/evolve", {}]);
  }
}
