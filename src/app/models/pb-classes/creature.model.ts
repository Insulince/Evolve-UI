import {CreatureMessage} from "../../pb/evolve_pb";
import {PBSerializable} from "./pb-serializable.interface";
import {PBClass} from "./pb-class.model";

export class Creature extends PBClass<CreatureMessage> implements CreatureMessage.AsObject, PBSerializable<CreatureMessage, Creature> {
  public static readonly CHANCE_OF_MUTATION: number = 0.1;
  public static readonly MAXIMUM_MUTATION_DELTA_AMOUNT: number = 0.1;
  public static readonly UNSET_COLOR: string = "#777777";
  public static readonly UNSET_BORDER_COLOR: string = "#777777";
  public static readonly UNSET_BACKGROUND_COLOR: string = "#f9f9f9";
  public static readonly MUTATION_COLOR: string = "#666600";
  public static readonly MUTATION_BORDER_COLOR: string = "#666600";
  public static readonly MUTATION_BACKGROUND_COLOR: string = "#ffff77";
  public static readonly SUCCESS_COLOR: string = "#009900";
  public static readonly SUCCESS_BORDER_COLOR: string = "#009900";
  public static readonly SUCCESS_BACKGROUND_COLOR: string = "#55dd55";
  public static readonly FAILURE_COLOR: string = "#990000";
  public static readonly FAILURE_BORDER_COLOR: string = "#990000";
  public static readonly FAILURE_BACKGROUND_COLOR: string = "#dd5555";

  // CreatureMessage.AsObject Variables
  public name: string;
  public generation: number;
  public speed: number;
  public health: number;
  public greed: number;
  public stamina: number;
  public chanceofmutation: number;
  public simulatedthisgeneration: boolean;
  public fitnessvalue: number;
  public outcome: string;
  public naturallyselectedthisgeneration: boolean;
  public fitnessindex: number;
  public mutatedthisgeneration: boolean;

  // Creature Variables
  public color: string;
  public borderColor: string;
  public backgroundColor: string;

  constructor(creatureMessage: CreatureMessage = new CreatureMessage()) {
    super(creatureMessage);

    switch (this.outcome) {
      case "UNSET":
        if (this.mutatedthisgeneration) {
          this.color = Creature.MUTATION_COLOR;
          this.borderColor = Creature.MUTATION_BORDER_COLOR;
          this.backgroundColor = Creature.MUTATION_BACKGROUND_COLOR;
        } else {
          this.color = Creature.UNSET_COLOR;
          this.borderColor = Creature.UNSET_BORDER_COLOR;
          this.backgroundColor = Creature.UNSET_BACKGROUND_COLOR;
        }
        break;
      case "SUCCESS":
        this.color = Creature.SUCCESS_COLOR;
        this.borderColor = Creature.SUCCESS_BORDER_COLOR;
        this.backgroundColor = Creature.SUCCESS_BACKGROUND_COLOR;
        break;
      case "FAILURE":
        this.color = Creature.FAILURE_COLOR;
        this.borderColor = Creature.FAILURE_BORDER_COLOR;
        this.backgroundColor = Creature.FAILURE_BACKGROUND_COLOR;
        break;
      default:
        console.error(`Unrecognized outcome deserialized from creatureMessage: "${this.outcome}".`);
        break;
    }
  }

  public sateFromMessage(creatureMessage: CreatureMessage): Creature {
    return Object.assign(this, creatureMessage.toObject()); // Copy every value from the second parameter into the first parameter.
  }

  public toMessage(): CreatureMessage {
    const creatureMessage: CreatureMessage = new CreatureMessage();
    creatureMessage.setName(this.name);
    creatureMessage.setGeneration(this.generation);
    creatureMessage.setSpeed(this.speed);
    creatureMessage.setStamina(this.stamina);
    creatureMessage.setHealth(this.health);
    creatureMessage.setGreed(this.greed);
    creatureMessage.setChanceofmutation(this.chanceofmutation);
    creatureMessage.setFitnessvalue(this.fitnessvalue);
    creatureMessage.setSimulatedthisgeneration(this.simulatedthisgeneration);
    creatureMessage.setOutcome(this.outcome);
    creatureMessage.setNaturallyselectedthisgeneration(this.naturallyselectedthisgeneration);
    creatureMessage.setFitnessindex(this.fitnessindex);
    creatureMessage.setMutatedthisgeneration(this.mutatedthisgeneration);
    return creatureMessage;
  }

  // public oldreproduce(): Creature {
  //   // const offspring = new Creature(this.name, false);
  //   const offspring: any = {};
  //   offspring.generation = this.generation + 1;
  //
  //   offspring.automaticSpeed = this.automaticSpeed;
  //   offspring.stamina = this.stamina;
  //   offspring.health = this.health;
  //   offspring.greed = this.greed;
  //
  //   while (Math.random() < Creature.CHANCE_OF_MUTATION) {
  //     let validMutation: boolean = true;
  //
  //     const delta: number = Math.random() * Creature.MAXIMUM_MUTATION_DELTA_AMOUNT * (Math.random() < 0.5 ? 1 : -1);
  //     if (delta !== 0) {
  //       switch (Math.floor(Math.random() * 4)) {
  //         case 0:
  //           offspring.automaticSpeed = this.automaticSpeed + delta;
  //           if (offspring.automaticSpeed > 1) {
  //             offspring.automaticSpeed = this.automaticSpeed;
  //             validMutation = false;
  //           } else if (offspring.automaticSpeed < 0) {
  //             offspring.automaticSpeed = this.automaticSpeed;
  //             validMutation = false;
  //           }
  //           break;
  //         case 1:
  //           offspring.stamina = this.stamina + delta;
  //           if (offspring.stamina > 1) {
  //             offspring.stamina = this.stamina;
  //             validMutation = false;
  //           } else if (offspring.stamina < 0) {
  //             offspring.stamina = this.stamina;
  //             validMutation = false;
  //           }
  //           break;
  //         case 2:
  //           offspring.health = this.health + delta;
  //           if (offspring.health > 1) {
  //             offspring.health = this.health;
  //             validMutation = false;
  //           } else if (offspring.health < 0) {
  //             offspring.health = this.health;
  //             validMutation = false;
  //           }
  //           break;
  //         case 3:
  //           offspring.greed = this.greed + delta;
  //           if (offspring.greed > 1) {
  //             offspring.greed = this.greed;
  //             validMutation = false;
  //           } else if (offspring.greed < 0) {
  //             offspring.greed = this.greed;
  //             validMutation = false;
  //           }
  //           break;
  //       }
  //     } else {
  //       validMutation = false;
  //     }
  //
  //     if (validMutation) {
  //       offspring.name = Util.mutateName(offspring.name);
  //       offspring.generation = 0;
  //       offspring.color = Creature.MUTATION_COLOR;
  //       offspring.borderColor = Creature.MUTATION_BORDER_COLOR;
  //       offspring.backgroundColor = Creature.MUTATION_BACKGROUND_COLOR;
  //     }
  //   }
  //
  //   return offspring;
  // }
}
