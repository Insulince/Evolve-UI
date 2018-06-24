import {Component, OnInit} from "@angular/core";
import {Creature} from "../../models/creature.model";
import {Util} from "../../util";
import {ControlMode} from "../../enums/control-mode.enum";
import {ManualStep} from "../../enums/manual-step.enum";
import {Outcome} from "../../enums/outcome.enum";
import {CreatureRpcService} from "../../services/rpc/creature-rpc.service";
import {map, reduce, tap} from "rxjs/internal/operators";

@Component({
  selector: "evolve-ui-evolve",
  templateUrl: "./evolve.component.html",
  styleUrls: ["./evolve.component.scss"]
})
export class EvolveComponent implements OnInit {
  public static readonly QUANTITY_STARTING_CREATURES: number = 120;
  public static readonly MAXIMUM_CHILDREN_ALLOWED_PER_GENERATION: number = 3;
  public static readonly MAXIMUM_CREATURES_ALLOWED_PER_GENERATION: number = 150;
  public static readonly CONTINUOUS_INSTANT_GENERATION_INTERVAL_DURATION: number = 1000;

  public creatures: Array<Creature>;
  public gridifiedCreatures: Array<Array<Creature>>;
  public generationCounter: number;
  public controlMode: ControlMode;
  public manualStep: ManualStep;
  public simulating: boolean;
  public naturallySelecting: boolean;
  public reproducing: boolean;
  public creaturesCreated: boolean;
  public continuousInstantGenerationSignalledToStop: boolean;
  public simulatedCreaturesThisGeneration: number;

  constructor(private creatureRpcService: CreatureRpcService) {
    this.creatures = [];
    this.gridifiedCreatures = [];
    this.generationCounter = 0;
    this.simulating = false;
    this.naturallySelecting = false;
    this.reproducing = false;
    this.controlMode = ControlMode.NOT_SET;
    this.manualStep = ManualStep.NOT_SET;
    this.creaturesCreated = false;
    this.continuousInstantGenerationSignalledToStop = false;
    this.simulatedCreaturesThisGeneration = 0;
  }

  ngOnInit(): void {
  }

  public createInitialCreatures(): void {
    this.creatures = [];

    this.creatureRpcService.generateCreatures(EvolveComponent.QUANTITY_STARTING_CREATURES).pipe(
      reduce(
        (creatureAccumulator: Array<Creature>, currentCreature: Creature): Array<Creature> => {
          creatureAccumulator.push(currentCreature);
          return creatureAccumulator;
        },
        []
      ),
      tap(
        (creatures: Array<Creature>): void => {
          this.creatures = creatures;
        }
      ),
      map(
        (creatures: Array<Creature>): Array<Array<Creature>> => {
          const gridifiedCreatures: Array<Array<Creature>> = [];
          let rowOfCreatures: Array<Creature> = [];

          creatures.forEach(
            (creature: Creature, index: number): void => {
              rowOfCreatures.push(creature);

              if ((index + 1) % 4 === 0) {
                gridifiedCreatures.push(rowOfCreatures);
                rowOfCreatures = [];
              }
            }
          );

          if (rowOfCreatures.length > 0) {
            gridifiedCreatures.push(rowOfCreatures);
          }

          return gridifiedCreatures;
        }
      )
    ).subscribe(
      (gridifiedCreatures: Array<Array<Creature>>): void => {
        this.gridifiedCreatures = gridifiedCreatures;
      },
      (error: Error): void => {
        console.error(error);
      },
      (): void => {
        this.creaturesCreated = true;
      }
    );
  }

  public doOneManualGeneration(): void {
    this.controlMode = ControlMode.MANUAL;
    this.manualStep = ManualStep.SIMULATING_CREATURES;
  }

  public simulateNextCreature(): void {
    this.simulating = true;

    if (this.simulatedCreaturesThisGeneration !== this.creatures.length) {
      this.creatureRpcService.simulateCreature(this.creatures[this.simulatedCreaturesThisGeneration]).subscribe(
        (simulatedCreature: Creature): void => {
          this.creatures[this.simulatedCreaturesThisGeneration] = simulatedCreature;
          this.simulatedCreaturesThisGeneration++;

          this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures.slice(0, this.simulatedCreaturesThisGeneration)).concat(this.creatures.slice(this.simulatedCreaturesThisGeneration, this.creatures.length));

          this.simulating = false;
        }
      );
    } else {
      this.manualStep = ManualStep.NATURALLY_SELECTING;
      this.simulating = false;
    }
  }

  public simulateAllRemainingCreatures(): void {
    this.simulating = true;

    this.creatures.forEach(
      (creature: Creature): void => {
        if (creature.simulatedThisGeneration === false) {
          creature.simulate();
        }
      }
    );

    this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures);

    this.simulating = false;
    this.manualStep = ManualStep.NATURALLY_SELECTING;
  }

  public simulateAllRemainingCreaturesInstantly(): void {
    this.simulating = true;

    this.creatureRpcService.simulateCreatures(this.creatures).subscribe(
      (): void => {

      }
    );

    this.creatures.forEach(
      (creature: Creature): void => {
        if (creature.simulatedThisGeneration === false) {
          creature.simulate();
        }
      }
    );

    this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures);

    this.simulating = false;
    this.manualStep = ManualStep.NATURALLY_SELECTING;
  }

  public applyNaturalSelection(): void {
    this.naturallySelecting = true;

    this.creatures.forEach(
      (creature: Creature, i: number): void => {
        const chanceOfDeath = i / (this.creatures.length - 1);

        if (Math.random() < chanceOfDeath) {
          creature.fail();
        } else {
          creature.succeed();
        }
      }
    );

    if (this.controlMode === ControlMode.MANUAL) {
      this.manualStep = ManualStep.REPRODUCING;
    }

    this.naturallySelecting = false;
  }


  public applyReproduction(): void {
    this.reproducing = true;

    const newCreatures: Array<Creature> = [];
    this.creatures.forEach(
      (creature: Creature): void => {
        if (creature.result.outcome === Outcome.SUCCESS) {
          const quantityChildren: number = Math.floor((Math.random() * (EvolveComponent.MAXIMUM_CHILDREN_ALLOWED_PER_GENERATION + (this.creatures.length < 50 ? 1 : 0))) + 1);
          for (let i: number = 0; i < quantityChildren; i++) {
            if (newCreatures.length < EvolveComponent.MAXIMUM_CREATURES_ALLOWED_PER_GENERATION) {
              newCreatures.push(creature.reproduce());
            } else {
              console.warn("Could not reproduce for \"" + creature.name + "\", we are at carrying capacity.");
            }
          }
        } else if (creature.result.outcome === Outcome.FAILURE) {
          // This creature dies by not reproducing.
        } else {
          console.error("Unrecognized creature result outcome \"" + creature.result.outcome + "\" encountered on creature \"" + creature.name + "\".");
        }
      }
    );

    this.creatures = newCreatures;

    if (this.controlMode === ControlMode.MANUAL || this.controlMode === ControlMode.ONE_FULL) {
      this.manualStep = ManualStep.ADVANCE_GENERATION;
    }

    this.reproducing = false;
  }

  public doOneFullGeneration(): void {
    this.controlMode = ControlMode.ONE_FULL;
    this.simulating = true;

    this.creatures.forEach(
      (creature: Creature): void => {
        creature.simulate();
      }
    );

    this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures);

    this.applyNaturalSelection();

    this.simulating = false;
    this.manualStep = ManualStep.REPRODUCING;
  }

  public doOneFullGenerationInstantly(): void {
    this.controlMode = ControlMode.ONE_FULL_INSTANT;
    this.simulating = true;

    this.creatures.forEach(
      (creature: Creature): void => {
        creature.simulate();
      }
    );

    this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures);

    this.applyNaturalSelection();

    this.applyReproduction();

    this.advanceGeneration();

    this.simulating = false;
    this.controlMode = ControlMode.NOT_SET;
  }

  public startContinuousInstantGeneration(): void {
    this.controlMode = ControlMode.CONTINUOUS;

    if (!this.continuousInstantGenerationSignalledToStop) {
      this.creatures.forEach(
        (creature: Creature): void => {
          creature.simulate();
        }
      );

      this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures);

      this.applyNaturalSelection();

      this.applyReproduction();

      this.advanceGeneration();
    } else {
      this.continuousInstantGenerationSignalledToStop = false;
      this.controlMode = ControlMode.NOT_SET;
    }
  }

  public stopContinuousInstantGeneration(): void {
    this.continuousInstantGenerationSignalledToStop = true;
  }

  public advanceGeneration(): void {
    if (this.controlMode === ControlMode.MANUAL || this.controlMode === ControlMode.ONE_FULL || this.controlMode === ControlMode.ONE_FULL_INSTANT) {
      this.manualStep = ManualStep.NOT_SET;
      this.controlMode = ControlMode.NOT_SET;
    }

    this.creatures.forEach(
      (creature: Creature): void => {
        creature.color = Creature.UNSET_COLOR;
        creature.borderColor = Creature.UNSET_BORDER_COLOR;
        creature.backgroundColor = Creature.UNSET_BACKGROUND_COLOR;
      }
    );

    this.generationCounter++;
    this.simulatedCreaturesThisGeneration = 0;
  }

  public sortCreaturesBasedOnFitnessValue(creatures: Array<Creature>): Array<Creature> {
    return creatures.sort(
      (creatureOne: Creature, creatureTwo: Creature): number => {
        return creatureOne.result.fitnessValue > creatureTwo.result.fitnessValue ? Util.MORE_FIT : Util.LESS_FIT;
      }
    );
  }
}
