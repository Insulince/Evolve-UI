import {Result} from "./result.model";
import {Outcome} from "../enums/outcome.enum";
import {Util} from "../util";

export class Creature {
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

  public name: string;
  public generation: number;

  public speed: number; // Rate of advancement.
  public stamina: number; // Amount it can advance before becoming "tired".
  public health: number; // Amount of damage it can sustain.
  public greed: number; // How likely it is to continue running whilst tired. Doing so will harm itself.

  public simulatedThisGeneration: boolean;

  public result: Result;
  public outcome: string;

  public color: string;
  public borderColor: string;
  public backgroundColor: string;

  constructor(name: string, isOriginal: boolean) {
    this.name = name;
    this.result = new Result();
    this.generation = 0;
    this.outcome = "unset";

    this.speed = 0;
    this.stamina = 0;
    this.health = 0;
    this.greed = 0;

    this.simulatedThisGeneration = false;

    this.color = Creature.UNSET_COLOR;
    this.borderColor = Creature.UNSET_BORDER_COLOR;
    this.backgroundColor = Creature.UNSET_BACKGROUND_COLOR;

    if (isOriginal) {
      this.generateRandomCharacteristics();
    }
  }

  public getName(): string {
    return this.name + "-" + this.generation;
  }

  public reproduce(): Creature {
    const offspring = new Creature(this.name, false);
    offspring.generation = this.generation + 1;

    offspring.speed = this.speed;
    offspring.stamina = this.stamina;
    offspring.health = this.health;
    offspring.greed = this.greed;

    while (Math.random() < Creature.CHANCE_OF_MUTATION) {
      let validMutation: boolean = true;

      const delta: number = Math.random() * Creature.MAXIMUM_MUTATION_DELTA_AMOUNT * (Math.random() < 0.5 ? 1 : -1);
      if (delta !== 0) {
        switch (Math.floor(Math.random() * 4)) {
          case 0:
            offspring.speed = this.speed + delta;
            if (offspring.speed > 1) {
              offspring.speed = this.speed;
              validMutation = false;
            } else if (offspring.speed < 0) {
              offspring.speed = this.speed;
              validMutation = false;
            }
            break;
          case 1:
            offspring.stamina = this.stamina + delta;
            if (offspring.stamina > 1) {
              offspring.stamina = this.stamina;
              validMutation = false;
            } else if (offspring.stamina < 0) {
              offspring.stamina = this.stamina;
              validMutation = false;
            }
            break;
          case 2:
            offspring.health = this.health + delta;
            if (offspring.health > 1) {
              offspring.health = this.health;
              validMutation = false;
            } else if (offspring.health < 0) {
              offspring.health = this.health;
              validMutation = false;
            }
            break;
          case 3:
            offspring.greed = this.greed + delta;
            if (offspring.greed > 1) {
              offspring.greed = this.greed;
              validMutation = false;
            } else if (offspring.greed < 0) {
              offspring.greed = this.greed;
              validMutation = false;
            }
            break;
        }
      } else {
        validMutation = false;
      }

      if (validMutation) {
        offspring.name = Util.mutateName(offspring.name);
        offspring.generation = 0;
        offspring.color = Creature.MUTATION_COLOR;
        offspring.borderColor = Creature.MUTATION_BORDER_COLOR;
        offspring.backgroundColor = Creature.MUTATION_BACKGROUND_COLOR;
      }
    }

    return offspring;
  }

  private generateRandomCharacteristics(): void {
    this.speed = Math.random();
    this.stamina = Math.random();
    this.health = Math.random();
    this.greed = Math.random();
  }

  public simulate(): void {
    this.result.fitnessValue = this.speed + this.stamina + this.health + this.greed;
    this.simulatedThisGeneration = true;
  }

  public succeed(): void {
    this.result.outcome = Outcome.SUCCESS;
    this.color = Creature.SUCCESS_COLOR;
    this.borderColor = Creature.SUCCESS_BORDER_COLOR;
    this.backgroundColor = Creature.SUCCESS_BACKGROUND_COLOR;
  }

  public fail(): void {
    this.result.outcome = Outcome.FAILURE;
    this.color = Creature.FAILURE_COLOR;
    this.borderColor = Creature.FAILURE_BORDER_COLOR;
    this.backgroundColor = Creature.FAILURE_BACKGROUND_COLOR;
  }
}