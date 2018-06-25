import {Injectable} from "@angular/core";
import {RpcService} from "./rpc.service";
import {CreatureService} from "../../pb/evolve_pb_service";
import {CreatureMessage, GenerateCreatureRpcRequest, GenerateCreatureRpcResponse, GenerateCreaturesRpcRequest, GenerateCreaturesRpcResponse, SimulateCreatureRpcRequest, SimulateCreatureRpcResponse, SimulateCreaturesRpcRequest, SimulateCreaturesRpcResponse} from "../../pb/evolve_pb";
import {Creature} from "../../models/creature.model";
import {Observable, Observer} from "rxjs";

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
        // TODO: Is this the best way to assign all values?
        const creatureMessage: CreatureMessage = new CreatureMessage();
        creatureMessage.setName(creature.name);
        creatureMessage.setGeneration(creature.generation);
        creatureMessage.setSpeed(creature.speed);
        creatureMessage.setStamina(creature.stamina);
        creatureMessage.setHealth(creature.health);
        creatureMessage.setGreed(creature.greed);
        simulateCreatureRpcRequest.setCreaturemessage(creatureMessage);

        this.rpcService.unary(
          CreatureService.SimulateCreatureRpc,
          simulateCreatureRpcRequest,
          (response: SimulateCreatureRpcResponse): void => {
            console.log(response.getCreaturemessage().getSimulatedthisgeneration());
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
            // TODO: Is this the best way to assign all values?
            const creatureMessage: CreatureMessage = new CreatureMessage();
            creatureMessage.setName(creature.name);
            creatureMessage.setGeneration(creature.generation);
            creatureMessage.setSpeed(creature.speed);
            creatureMessage.setStamina(creature.stamina);
            creatureMessage.setHealth(creature.health);
            creatureMessage.setGreed(creature.greed);
            creatureMessage.setFitnessvalue(creature.fitnessValue);
            creatureMessage.setSimulatedthisgeneration(creature.simulatedThisGeneration);
            creatureMessages.push(creatureMessage);
          }
        );
        simulateCreaturesRpcRequest.setCreaturemessagesList(creatureMessages);

        this.rpcService.unary(
          CreatureService.SimulateCreaturesRpc,
          simulateCreaturesRpcRequest,
          (response: SimulateCreaturesRpcResponse): void => {
            const creatures: Array<Creature> = [];
            console.log(response);
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
