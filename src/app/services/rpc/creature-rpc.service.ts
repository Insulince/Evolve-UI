import {Injectable} from "@angular/core";
import {RpcService} from "./rpc.service";
import {grpc} from "grpc-web-client";
import {CreatureService} from "../../pb/evolve_pb_service";
import {CreatureMessage, GenerateCreatureRpcRequest, GenerateCreatureRpcResponse, GenerateCreaturesRpcRequest, GenerateCreaturesRpcResponse, SimulateCreatureRpcRequest, SimulateCreatureRpcResponse, SimulateCreaturesRpcRequest, SimulateCreaturesRpcResponse} from "../../pb/evolve_pb";
import {Creature} from "../../models/creature.model";
import {Observable, Observer} from "rxjs";
import {Code} from "grpc-web-client/dist/Code";
import UnaryOutput = grpc.UnaryOutput;
import Metadata = grpc.Metadata;
import Client = grpc.Client;
import ProtobufMessage = grpc.ProtobufMessage;

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
            observer.next(new Creature(output.message.getCreaturemessage()));
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
            observer.next(new Creature(message.getCreaturemessage()));
          },
          (code: Code, message: string, trailers: Metadata): void => {
            observer.complete();
          }
        );
      }
    );
  }

  public simulateCreature(creature: Creature): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const simulateCreatureRequest: SimulateCreatureRpcRequest = new SimulateCreatureRpcRequest();
        const creatureMessage: CreatureMessage = new CreatureMessage();
        creatureMessage.setName(creature.name);
        creatureMessage.setGeneration(creature.generation);
        creatureMessage.setSpeed(creature.speed);
        creatureMessage.setStamina(creature.stamina);
        creatureMessage.setHealth(creature.health);
        creatureMessage.setGreed(creature.greed);
        simulateCreatureRequest.setCreaturemessage(creatureMessage);

        this.rpcService.unary(
          CreatureService.SimulateCreatureRpc,
          simulateCreatureRequest,
          (output: UnaryOutput<SimulateCreatureRpcResponse>): void => {
            observer.next(new Creature(output.message.getCreaturemessage()));
            observer.complete();
          }
        );
      }
    );
  }

  // TODO: Bi-di streaming is being whack. Maybe consider ditching it for just server streaming.
  public simulateCreatures(creatures: Array<Creature>): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const client: Client<ProtobufMessage, ProtobufMessage> = this.rpcService.client(
          CreatureService.SimulateCreaturesRpc,
          (a): void => {
            console.log("a:");
            console.log(a);
          }
        );

        client.start();

        creatures.forEach(
          (creature: Creature): void => {
            const simulateCreaturesRequest: SimulateCreaturesRpcRequest = new SimulateCreaturesRpcRequest();
            const creatureMessage: CreatureMessage = new CreatureMessage();
            creatureMessage.setName(creature.name);
            creatureMessage.setGeneration(creature.generation);
            creatureMessage.setSpeed(creature.speed);
            creatureMessage.setStamina(creature.stamina);
            creatureMessage.setHealth(creature.health);
            creatureMessage.setGreed(creature.greed);
            simulateCreaturesRequest.setCreaturemessage(creatureMessage);

            client.send(simulateCreaturesRequest);
          }
        );
      }
    );
  }
}
