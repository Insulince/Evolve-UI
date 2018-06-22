import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {RpcService} from "./services/rpc/rpc.service";
import {CreatureRpcService} from "./services/rpc/creature-rpc.service";
import {Creature} from "./models/creature.model";

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

  genCreature(): void {
    this.creatureRpcService.generateCreature().subscribe(
      (creature: Creature): void => {
        console.log(creature);
      },
      (error: Error): void => {
        console.error(error);
      },
      (): void => {
        console.log("creatureRpcService.generateCreature Observable is now complete!");
      }
    );
  }
}
