import {Injectable} from "@angular/core";
import {RpcService} from "./rpc.service";
import {grpc} from "grpc-web-client";
import {CreatureService} from "../../pb/evolve_pb_service";
import {GenerateCreatureRpcRequest, GenerateCreatureRpcResponse} from "../../pb/evolve_pb";
import {Creature} from "../../models/creature.model";
import {Observable, Observer} from "rxjs";
import UnaryOutput = grpc.UnaryOutput;

@Injectable({
  providedIn: "root"
})
export class CreatureRpcService {
  constructor(
    private rpcService: RpcService
  ) {
  }

  public generateCreature(): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const generateCreatureRequest: GenerateCreatureRpcRequest = new GenerateCreatureRpcRequest();

        this.rpcService.unary(
          CreatureService.GenerateCreatureRpc,
          generateCreatureRequest,
          (output: UnaryOutput<GenerateCreatureRpcResponse>): void => {
            observer.next(<Creature>output.message.toObject());
            observer.complete();
          }
        );
      }
    );
  }
}
