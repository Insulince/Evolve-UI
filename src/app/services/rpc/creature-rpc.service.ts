import {Injectable} from "@angular/core";
import {RpcService} from "./rpc.service";
import {grpc} from "grpc-web-client";
import {CreatureService} from "../../pb/evolve_pb_service";
import {GenerateCreatureRpcRequest, GenerateCreatureRpcResponse, GenerateCreaturesRpcRequest, GenerateCreaturesRpcResponse} from "../../pb/evolve_pb";
import {Creature} from "../../models/creature.model";
import {Observable, Observer} from "rxjs";
import {Code} from "grpc-web-client/dist/Code";
import UnaryOutput = grpc.UnaryOutput;
import Metadata = grpc.Metadata;

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

  public generateCreatures(quantity: number): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const generateCreaturesRequest: GenerateCreaturesRpcRequest = new GenerateCreaturesRpcRequest();
        generateCreaturesRequest.setQuantity(quantity);

        this.rpcService.invoke(
          CreatureService.GenerateCreaturesRpc,
          generateCreaturesRequest,
          (message: GenerateCreaturesRpcResponse): void => {
            // TODO: Figure out how to handle these typing. This does not feel quite right.
            observer.next(new Creature(message.getCreature()));
          },
          (code: Code, message: string, trailers: Metadata): void => {
            observer.complete();
          }
        );
      }
    );
  }
}
