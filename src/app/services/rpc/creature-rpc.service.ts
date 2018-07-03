import {Injectable} from "@angular/core";
import {RpcService} from "./rpc.service";
import {CreatureService} from "../../pb/evolve_pb_service";
import {CreatureMessage, GenerateCreatureRpcRequest, GenerateCreatureRpcResponse, GenerateCreaturesRpcRequest, GenerateCreaturesRpcResponse, KillFailedCreatureRpcRequest, KillFailedCreatureRpcResponse, KillFailedCreaturesRpcRequest, KillFailedCreaturesRpcResponse, NaturallySelectCreatureRpcRequest, NaturallySelectCreatureRpcResponse, NaturallySelectCreaturesRpcRequest, NaturallySelectCreaturesRpcResponse, ReproduceCreatureRpcRequest, ReproduceCreatureRpcResponse, ReproduceCreaturesRpcRequest, ReproduceCreaturesRpcResponse, ReproduceSuccessfulCreatureRpcRequest, ReproduceSuccessfulCreatureRpcResponse, ReproduceSuccessfulCreaturesRpcRequest, ReproduceSuccessfulCreaturesRpcResponse, SimulateCreatureRpcRequest, SimulateCreatureRpcResponse, SimulateCreaturesRpcRequest, SimulateCreaturesRpcResponse} from "../../pb/evolve_pb";
import {Creature} from "../../models/pb-classes/creature.model";
import {Observable, Observer} from "rxjs";

@Injectable({
  providedIn: "root"
})
export class CreatureRpcService {
  constructor(private rpcService: RpcService) {
  }

  public generateCreature(): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const generateCreatureRpcRequest: GenerateCreatureRpcRequest = new GenerateCreatureRpcRequest();

        this.rpcService.unary(
          CreatureService.GenerateCreatureRpc,
          generateCreatureRpcRequest,
          (response: GenerateCreatureRpcResponse): void => {
            const creature: Creature = new Creature(response.getCreaturemessage());

            observer.next(creature);
            observer.complete();
          }
        );
      }
    );
  }

  public generateCreatures(quantity: number): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        const generateCreaturesRpcRequest: GenerateCreaturesRpcRequest = new GenerateCreaturesRpcRequest();
        generateCreaturesRpcRequest.setQuantity(quantity);

        this.rpcService.unary(
          CreatureService.GenerateCreaturesRpc,
          generateCreaturesRpcRequest,
          (response: GenerateCreaturesRpcResponse): void => {
            const creatures: Array<Creature> = [];
            response.getCreaturemessagesList().forEach(
              (creatureMessage: CreatureMessage): void => {
                creatures.push(new Creature(creatureMessage));
              }
            );

            observer.next(creatures);
            observer.complete();
          }
        );
      }
    );
  }

  public simulateCreature(creature: Creature): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const simulateCreatureRpcRequest: SimulateCreatureRpcRequest = new SimulateCreatureRpcRequest();
        simulateCreatureRpcRequest.setCreaturemessage(creature.toMessage());

        this.rpcService.unary(
          CreatureService.SimulateCreatureRpc,
          simulateCreatureRpcRequest,
          (response: SimulateCreatureRpcResponse): void => {
            const creature: Creature = new Creature(response.getCreaturemessage());

            observer.next(creature);
            observer.complete();
          }
        );
      }
    );
  }

  public simulateCreatures(creatures: Array<Creature>): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        const simulateCreaturesRpcRequest: SimulateCreaturesRpcRequest = new SimulateCreaturesRpcRequest();
        const creatureMessages: Array<CreatureMessage> = [];
        creatures.forEach(
          (creature: Creature): void => {
            creatureMessages.push(creature.toMessage());
          }
        );
        simulateCreaturesRpcRequest.setCreaturemessagesList(creatureMessages);

        this.rpcService.unary(
          CreatureService.SimulateCreaturesRpc,
          simulateCreaturesRpcRequest,
          (response: SimulateCreaturesRpcResponse): void => {
            const creatures: Array<Creature> = [];
            response.getCreaturemessagesList().forEach(
              (creatureMessage: CreatureMessage): void => {
                creatures.push(new Creature(creatureMessage));
              }
            );

            observer.next(creatures);
            observer.complete();
          }
        );
      }
    );
  }

  public naturallySelectCreature(creature: Creature): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const naturallySelectCreatureRpcRequest: NaturallySelectCreatureRpcRequest = new NaturallySelectCreatureRpcRequest();
        naturallySelectCreatureRpcRequest.setCreaturemessage(creature.toMessage());

        this.rpcService.unary(
          CreatureService.NaturallySelectCreatureRpc,
          naturallySelectCreatureRpcRequest,
          (response: NaturallySelectCreatureRpcResponse): void => {
            const creature: Creature = new Creature(response.getCreaturemessage());

            observer.next(creature);
            observer.complete();
          }
        );
      }
    );
  }

  public naturallySelectCreatures(creatures: Array<Creature>): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        const naturallySelectCreaturesRpcRequest: NaturallySelectCreaturesRpcRequest = new NaturallySelectCreaturesRpcRequest();
        const creatureMessages: Array<CreatureMessage> = [];
        creatures.forEach(
          (creature: Creature): void => {
            creatureMessages.push(creature.toMessage());
          }
        );
        naturallySelectCreaturesRpcRequest.setCreaturemessagesList(creatureMessages);

        this.rpcService.unary(
          CreatureService.NaturallySelectCreaturesRpc,
          naturallySelectCreaturesRpcRequest,
          (response: NaturallySelectCreaturesRpcResponse): void => {
            const creatures: Array<Creature> = [];
            response.getCreaturemessagesList().forEach(
              (creatureMessage: CreatureMessage): void => {
                creatures.push(new Creature(creatureMessage));
              }
            );

            observer.next(creatures);
            observer.complete();
          }
        );
      }
    );
  }

  public killFailedCreature(failedCreature: Creature): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const killFailedCreatureRpcRequest: KillFailedCreatureRpcRequest = new KillFailedCreatureRpcRequest();
        killFailedCreatureRpcRequest.setCreaturemessage(failedCreature.toMessage());

        this.rpcService.unary(
          CreatureService.KillFailedCreatureRpc,
          killFailedCreatureRpcRequest,
          (response: KillFailedCreatureRpcResponse): void => {
            observer.next();
            observer.complete();
          }
        );
      }
    );
  }

  public killFailedCreatures(failedCreatures: Array<Creature>): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        const killFailedCreaturesRpcRequest: KillFailedCreaturesRpcRequest = new KillFailedCreaturesRpcRequest();
        const failedCreatureMessages: Array<CreatureMessage> = [];
        failedCreatures.forEach(
          (failedCreature: Creature): void => {
            failedCreatureMessages.push(failedCreature.toMessage());
          }
        );
        killFailedCreaturesRpcRequest.setCreaturemessagesList(failedCreatureMessages);

        this.rpcService.unary(
          CreatureService.KillFailedCreaturesRpc,
          killFailedCreaturesRpcRequest,
          (response: KillFailedCreaturesRpcResponse): void => {
            observer.next();
            observer.complete();
          }
        );
      }
    );
  }

  public reproduceSuccessfulCreature(successfulCreature: Creature): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        const reproduceSuccessfulCreatureRpcRequest: ReproduceSuccessfulCreatureRpcRequest = new ReproduceSuccessfulCreatureRpcRequest();
        reproduceSuccessfulCreatureRpcRequest.setCreaturemessage(successfulCreature.toMessage());

        this.rpcService.unary(
          CreatureService.ReproduceSuccessfulCreatureRpc,
          reproduceSuccessfulCreatureRpcRequest,
          (response: ReproduceSuccessfulCreatureRpcResponse): void => {
            const creature: Creature = new Creature(response.getCreaturemessage());

            observer.next(creature);
            observer.complete();
          }
        );
      }
    );
  }

  public reproduceSuccessfulCreatures(successfulCreatures: Array<Creature>): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        const reproduceSuccessfulCreaturesRpcRequest: ReproduceSuccessfulCreaturesRpcRequest = new ReproduceSuccessfulCreaturesRpcRequest();
        const creatureMessages: Array<CreatureMessage> = [];
        successfulCreatures.forEach(
          (successfulCreature: Creature): void => {
            creatureMessages.push(successfulCreature.toMessage());
          }
        );
        reproduceSuccessfulCreaturesRpcRequest.setCreaturemessagesList(creatureMessages);

        this.rpcService.unary(
          CreatureService.ReproduceSuccessfulCreaturesRpc,
          reproduceSuccessfulCreaturesRpcRequest,
          (response: ReproduceSuccessfulCreaturesRpcResponse): void => {
            const creatures: Array<Creature> = [];
            response.getCreaturemessagesList().forEach(
              (creatureMessage: CreatureMessage): void => {
                creatures.push(new Creature(creatureMessage));
              }
            );

            observer.next(creatures);
            observer.complete();
          }
        );
      }
    );
  }
}
