import {Injectable} from "@angular/core";
import {RpcService} from "./rpc.service";
import {CreatureService} from "../../pb/evolve_pb_service";
import {CreatureMessage, GenerateCreatureRpcRequest, GenerateCreatureRpcResponse, GenerateCreaturesRpcRequest, GenerateCreaturesRpcResponse, KillFailedCreatureRpcRequest, KillFailedCreatureRpcResponse, KillFailedCreaturesRpcRequest, KillFailedCreaturesRpcResponse, NaturallySelectCreatureRpcRequest, NaturallySelectCreatureRpcResponse, NaturallySelectCreaturesRpcRequest, NaturallySelectCreaturesRpcResponse, ReproduceSuccessfulCreatureRpcRequest, ReproduceSuccessfulCreatureRpcResponse, ReproduceSuccessfulCreaturesRpcRequest, ReproduceSuccessfulCreaturesRpcResponse, SimulateCreatureRpcRequest, SimulateCreatureRpcResponse, SimulateCreaturesRpcRequest, SimulateCreaturesRpcResponse} from "../../pb/evolve_pb";
import {Creature} from "../../models/pb-classes/creature.model";
import {Observable, Observer} from "rxjs";
import {Population} from "../../models/pb-classes/population.model";

@Injectable({
  providedIn: "root"
})
export class CreatureRpcService {
  constructor(private rpcService: RpcService) {
  }

  public generateCreature(): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        try {
          const generateCreatureRpcRequest: GenerateCreatureRpcRequest = new GenerateCreatureRpcRequest();

          this.rpcService.unary(
            CreatureService.GenerateCreatureRpc,
            generateCreatureRpcRequest,
            (response: GenerateCreatureRpcResponse): void => {
              try {
                const creature: Creature = new Creature(response.getCreaturemessage());

                observer.next(creature);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public generateCreatures(quantity: number): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        try {
          const generateCreaturesRpcRequest: GenerateCreaturesRpcRequest = new GenerateCreaturesRpcRequest();
          generateCreaturesRpcRequest.setQuantity(quantity);

          this.rpcService.unary(
            CreatureService.GenerateCreaturesRpc,
            generateCreaturesRpcRequest,
            (response: GenerateCreaturesRpcResponse): void => {
              try {
                const creatures: Array<Creature> = [];
                response.getCreaturemessagesList().forEach(
                  (creatureMessage: CreatureMessage): void => {
                    creatures.push(new Creature(creatureMessage));
                  }
                );

                observer.next(creatures);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public simulateCreature(creature: Creature): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        try {
          const simulateCreatureRpcRequest: SimulateCreatureRpcRequest = new SimulateCreatureRpcRequest();
          simulateCreatureRpcRequest.setCreaturemessage(creature.toMessage());

          this.rpcService.unary(
            CreatureService.SimulateCreatureRpc,
            simulateCreatureRpcRequest,
            (response: SimulateCreatureRpcResponse): void => {
              try {
                const creature: Creature = new Creature(response.getCreaturemessage());

                observer.next(creature);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public simulateCreatures(creatures: Array<Creature>): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        try {
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
              try {
                const creatures: Array<Creature> = [];
                response.getCreaturemessagesList().forEach(
                  (creatureMessage: CreatureMessage): void => {
                    creatures.push(new Creature(creatureMessage));
                  }
                );

                observer.next(creatures);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public naturallySelectCreature(creature: Creature, population: Population): Observable<Creature> {
    return Observable.create(
      (observer: Observer<Creature>): void => {
        try {
          const naturallySelectCreatureRpcRequest: NaturallySelectCreatureRpcRequest = new NaturallySelectCreatureRpcRequest();
          naturallySelectCreatureRpcRequest.setCreaturemessage(creature.toMessage());
          naturallySelectCreatureRpcRequest.setPopulationmessage(population.toMessage());

          this.rpcService.unary(
            CreatureService.NaturallySelectCreatureRpc,
            naturallySelectCreatureRpcRequest,
            (response: NaturallySelectCreatureRpcResponse): void => {
              try {
                const creature: Creature = new Creature(response.getCreaturemessage());

                observer.next(creature);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public naturallySelectCreatures(creatures: Array<Creature>, population: Population): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        try {
          const naturallySelectCreaturesRpcRequest: NaturallySelectCreaturesRpcRequest = new NaturallySelectCreaturesRpcRequest();
          const creatureMessages: Array<CreatureMessage> = [];
          creatures.forEach(
            (creature: Creature): void => {
              creatureMessages.push(creature.toMessage());
            }
          );
          naturallySelectCreaturesRpcRequest.setCreaturemessagesList(creatureMessages);
          naturallySelectCreaturesRpcRequest.setPopulationmessage(population.toMessage());

          this.rpcService.unary(
            CreatureService.NaturallySelectCreaturesRpc,
            naturallySelectCreaturesRpcRequest,
            (response: NaturallySelectCreaturesRpcResponse): void => {
              try {
                const creatures: Array<Creature> = [];
                response.getCreaturemessagesList().forEach(
                  (creatureMessage: CreatureMessage): void => {
                    creatures.push(new Creature(creatureMessage));
                  }
                );

                observer.next(creatures);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public killFailedCreature(failedCreature: Creature): Observable<void> {
    return Observable.create(
      (observer: Observer<void>): void => {
        try {
          const killFailedCreatureRpcRequest: KillFailedCreatureRpcRequest = new KillFailedCreatureRpcRequest();
          killFailedCreatureRpcRequest.setCreaturemessage(failedCreature.toMessage());

          this.rpcService.unary(
            CreatureService.KillFailedCreatureRpc,
            killFailedCreatureRpcRequest,
            (response: KillFailedCreatureRpcResponse): void => {
              try {
                observer.next(undefined);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public killFailedCreatures(failedCreatures: Array<Creature>): Observable<void> {
    return Observable.create(
      (observer: Observer<void>): void => {
        try {
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
              try {
                observer.next(undefined);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public reproduceSuccessfulCreature(successfulCreature: Creature): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        try {
          const reproduceSuccessfulCreatureRpcRequest: ReproduceSuccessfulCreatureRpcRequest = new ReproduceSuccessfulCreatureRpcRequest();
          reproduceSuccessfulCreatureRpcRequest.setCreaturemessage(successfulCreature.toMessage());

          this.rpcService.unary(
            CreatureService.ReproduceSuccessfulCreatureRpc,
            reproduceSuccessfulCreatureRpcRequest,
            (response: ReproduceSuccessfulCreatureRpcResponse): void => {
              try {
                const creatures: Array<Creature> = [];
                response.getCreaturemessagesList().forEach(
                  (creatureMessage: CreatureMessage): void => {
                    creatures.push(new Creature(creatureMessage));
                  }
                );

                observer.next(creatures);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }

  public reproduceSuccessfulCreatures(successfulCreatures: Array<Creature>): Observable<Array<Creature>> {
    return Observable.create(
      (observer: Observer<Array<Creature>>): void => {
        try {
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
              try {
                const creatures: Array<Creature> = [];
                response.getCreaturemessagesList().forEach(
                  (creatureMessage: CreatureMessage): void => {
                    creatures.push(new Creature(creatureMessage));
                  }
                );

                observer.next(creatures);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            }
          );
        } catch (error) {
          observer.error(error);
        }
      }
    );
  }
}
