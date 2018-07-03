import {Component, OnInit} from "@angular/core";
import {Creature} from "../../models/pb-classes/creature.model";
import {Util} from "../../util";
import {GenerationType} from "../../enums/generation-type.enum";
import {ControlType} from "../../enums/control-type.enum";
import {CreatureRpcService} from "../../services/rpc/creature-rpc.service";
import {ManualStep} from "../../enums/manual-step.enum";

@Component({
  selector: "evolve-ui-evolve",
  templateUrl: "./evolve.component.html",
  styleUrls: ["./evolve.component.scss"]
})
export class EvolveComponent implements OnInit {
  public static readonly QUANTITY_STARTING_CREATURES: number = 64;
  public static readonly MAXIMUM_CHILDREN_ALLOWED_PER_GENERATION: number = 3;
  public static readonly MAXIMUM_CREATURES_ALLOWED_PER_GENERATION: number = 150;
  public static readonly CONTINUOUS_INSTANT_GENERATION_INTERVAL_DURATION: number = 1000;

  // MODEL CONTROLS
  public creatures: Array<Creature>;
  public gridifiedCreatures: Array<Array<Creature>>;

  // VIEW CONTROLS
  public creaturesCreated: boolean;
  public generationType: GenerationType;
  public controlType: ControlType;
  public manualStep: ManualStep;

  // GLOBAL DATA
  public generationCounter: number;

  constructor(private creatureRpcService: CreatureRpcService) {
    // MODEL CONTROLS
    this.creatures = [];
    this.gridifiedCreatures = [];

    // VIEW CONTROLS
    this.creaturesCreated = false;
    this.generationType = GenerationType.NOT_SET;
    this.controlType = ControlType.NOT_SET;
    this.manualStep = ManualStep.NOT_SET;

    // GLOBAL DATA
    this.generationCounter = 0;
  }

  public ngOnInit(): void {
  }

  private updateCreaturesArrays(creatures: Array<Creature>): void {
    this.gridifiedCreatures = this.gridifyCreatures(creatures);
    this.creatures = creatures;
  }

  private gridifyCreatures(creatures: Array<Creature>): Array<Array<Creature>> {
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

  private sortCreaturesBasedOnFitnessValue(creatures: Array<Creature>): Array<Creature> {
    return creatures.sort(
      (creatureOne: Creature, creatureTwo: Creature): number => {
        return creatureOne.fitnessvalue > creatureTwo.fitnessvalue ? Util.MORE_FIT : Util.LESS_FIT;
      }
    );
  }

  private getNextUnsimulatedCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.simulatedthisgeneration === false;
      }
    );
  }

  private getNextNonNaturallySelectedCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.naturallyselectedthisgeneration === false;
      }
    );
  }

  private getNextNonKilledFailedCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.outcome === "FAILURE";
      }
    );
  }

  private getAllNonKilledFailedCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.outcome === "FAILURE";
      }
    );
  }

  private getNextNonReproducedSuccessfulCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.outcome === "SUCCESS";
      }
    );
  }

  private getAllNonReproducedSuccessfulCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.outcome === "SUCCESS";
      }
    );
  }

  ///////////////////////////////////////////////// CREATURE GENERATION /////////////////////////////////////////////////

  public generateInitialCreatures(): void {
    this.updateCreaturesArrays([]);

    this.creatureRpcService.generateCreatures(EvolveComponent.QUANTITY_STARTING_CREATURES).subscribe(
      (creatures: Array<Creature>): void => {
        this.updateCreaturesArrays(creatures);
      },
      (error: Error): void => {
        console.error(error);
      },
      (): void => {
        this.creaturesCreated = true;
      }
    );
  }

  ///////////////////////////////////////////////// CONFIGURE GENERATION TYPE /////////////////////////////////////////////////

  public setGenerationTypeToSingle(): void {
    this.generationType = GenerationType.SINGLE;
  }

  public setGenerationTypeToContinuous(): void {
    this.generationType = GenerationType.CONTINUOUS;
  }

  ///////////////////////////////////////////////// CONFIGURE CONTROL TYPE /////////////////////////////////////////////////

  public setControlTypeToManual(): void {
    this.controlType = ControlType.MANUAL;
    this.manualStep = ManualStep.SIMULATING;
  }

  public setControlTypeToFull(): void {
    this.controlType = ControlType.FULL;
    this.manualStep = ManualStep.SIMULATING;
  }

  public setControlTypeToInstant(): void {
    this.controlType = ControlType.INSTANT;
    this.manualStep = ManualStep.SIMULATING;
  }

  ///////////////////////////////////////////////// SIMULATE /////////////////////////////////////////////////

  public simulateNextCreature(): void {
    const nextUnsimulatedCreatureIndex: number = this.getNextUnsimulatedCreatureIndex(this.creatures);

    if (nextUnsimulatedCreatureIndex !== -1) {
      this.creatureRpcService.simulateCreature(this.creatures[nextUnsimulatedCreatureIndex]).subscribe(
        (simulatedCreature: Creature): void => {
          this.creatures[nextUnsimulatedCreatureIndex] = simulatedCreature;

          this.updateCreaturesArrays(
            this.sortCreaturesBasedOnFitnessValue(
              this.creatures.slice(
                0,
                nextUnsimulatedCreatureIndex + 1
              )
            ).concat(
              this.creatures.slice(
                nextUnsimulatedCreatureIndex + 1,
                this.creatures.length
              )
            )
          );

          if (nextUnsimulatedCreatureIndex === this.creatures.length - 1) {
            this.manualStep = ManualStep.NATURALLY_SELECTING;
          }
        }
      );
    } else {
      console.error("No unsimulated creatures remain, somehow!");
      this.manualStep = ManualStep.NATURALLY_SELECTING;
    }
  }

  public simulateAllRemainingCreatures(): void {
    const nextUnsimulatedCreatureIndex: number = this.getNextUnsimulatedCreatureIndex(this.creatures);

    if (nextUnsimulatedCreatureIndex !== -1) {
      this.creatureRpcService.simulateCreature(this.creatures[nextUnsimulatedCreatureIndex]).subscribe(
        (simulatedCreature: Creature): void => {
          this.creatures[nextUnsimulatedCreatureIndex] = simulatedCreature;

          this.updateCreaturesArrays(
            this.sortCreaturesBasedOnFitnessValue(
              this.creatures.slice(
                0,
                nextUnsimulatedCreatureIndex + 1
              )
            ).concat(
              this.creatures.slice(
                nextUnsimulatedCreatureIndex + 1,
                this.creatures.length
              )
            )
          );

          if (nextUnsimulatedCreatureIndex !== this.creatures.length - 1) {
            this.simulateAllRemainingCreatures();
          } else {
            this.manualStep = ManualStep.NATURALLY_SELECTING;
          }
        }
      );
    } else {
      console.error("No unsimulated creatures remain, somehow!");
      this.manualStep = ManualStep.NATURALLY_SELECTING;
    }
  }

  public simulateAllRemainingCreaturesInstantly(): void {
    const nextUnsimulatedCreatureIndex: number = this.getNextUnsimulatedCreatureIndex(this.creatures);

    if (nextUnsimulatedCreatureIndex !== -1) {
      this.creatureRpcService.simulateCreatures(this.creatures.slice(nextUnsimulatedCreatureIndex, this.creatures.length)).subscribe(
        (simulatedCreatures: Array<Creature>): void => {
          this.creatures = this.creatures.slice(0, nextUnsimulatedCreatureIndex).concat(simulatedCreatures);
          this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

          this.manualStep = ManualStep.NATURALLY_SELECTING;
        }
      );
    } else {
      console.error("No unsimulated creatures remain, somehow!");
      this.manualStep = ManualStep.NATURALLY_SELECTING;
    }
  }

  public simulateAllCreatures(): void {
    this.creatureRpcService.simulateCreatures(this.creatures).subscribe(
      (simulatedCreatures: Array<Creature>): void => {
        this.creatures = simulatedCreatures;
        this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

        this.manualStep = ManualStep.NATURALLY_SELECTING;
      }
    );
  }

  ///////////////////////////////////////////////// NATURALLY SELECT /////////////////////////////////////////////////

  public naturallySelectNextCreature(): void {
    const nextNonNaturallySelectedCreatureIndex: number = this.getNextNonNaturallySelectedCreatureIndex(this.creatures);

    if (nextNonNaturallySelectedCreatureIndex !== -1) {
      this.creatureRpcService.naturallySelectCreature(this.creatures[nextNonNaturallySelectedCreatureIndex]).subscribe(
        (naturallySelectdCreature: Creature): void => {
          this.creatures[nextNonNaturallySelectedCreatureIndex] = naturallySelectdCreature;

          this.updateCreaturesArrays(
            this.sortCreaturesBasedOnFitnessValue(
              this.creatures.slice(
                0,
                nextNonNaturallySelectedCreatureIndex + 1
              )
            ).concat(
              this.creatures.slice(
                nextNonNaturallySelectedCreatureIndex + 1,
                this.creatures.length
              )
            )
          );

          if (nextNonNaturallySelectedCreatureIndex === this.creatures.length - 1) {
            this.manualStep = ManualStep.KILLING;
          }
        }
      );
    } else {
      console.error("No non-naturally-selected creatures remain, somehow!");
      this.manualStep = ManualStep.KILLING;
    }
  }

  public naturallySelectAllRemainingCreatures(): void {
    const nextNonNaturallySelectedCreatureIndex: number = this.getNextNonNaturallySelectedCreatureIndex(this.creatures);

    if (nextNonNaturallySelectedCreatureIndex !== -1) {
      this.creatureRpcService.naturallySelectCreature(this.creatures[nextNonNaturallySelectedCreatureIndex]).subscribe(
        (naturallySelectdCreature: Creature): void => {
          this.creatures[nextNonNaturallySelectedCreatureIndex] = naturallySelectdCreature;

          this.updateCreaturesArrays(
            this.sortCreaturesBasedOnFitnessValue(
              this.creatures.slice(
                0,
                nextNonNaturallySelectedCreatureIndex + 1
              )
            ).concat(
              this.creatures.slice(
                nextNonNaturallySelectedCreatureIndex + 1,
                this.creatures.length
              )
            )
          );

          if (nextNonNaturallySelectedCreatureIndex !== this.creatures.length - 1) {
            this.naturallySelectAllRemainingCreatures();
          } else {
            this.manualStep = ManualStep.KILLING;
          }
        }
      );
    } else {
      console.error("No non-naturally-selected creatures remain, somehow!");
      this.manualStep = ManualStep.KILLING;
    }
  }

  public naturallySelectAllRemainingCreaturesInstantly(): void {
    const nextNonNaturallySelectedCreatureIndex: number = this.getNextNonNaturallySelectedCreatureIndex(this.creatures);

    if (nextNonNaturallySelectedCreatureIndex !== -1) {
      this.creatureRpcService.naturallySelectCreatures(this.creatures.slice(nextNonNaturallySelectedCreatureIndex, this.creatures.length)).subscribe(
        (naturallySelectdCreatures: Array<Creature>): void => {
          this.creatures = this.creatures.slice(0, nextNonNaturallySelectedCreatureIndex).concat(naturallySelectdCreatures);
          this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

          this.manualStep = ManualStep.KILLING;
        }
      );
    } else {
      console.error("No non-naturally-selected creatures remain, somehow!");
      this.manualStep = ManualStep.KILLING;
    }
  }

  public naturallySelectAllCreatures(): void {
    this.creatureRpcService.naturallySelectCreatures(this.creatures).subscribe(
      (naturallySelectdCreatures: Array<Creature>): void => {
        this.creatures = naturallySelectdCreatures;
        this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

        this.manualStep = ManualStep.KILLING;
      }
    );
  }

  ///////////////////////////////////////////////// KILL /////////////////////////////////////////////////

  public killNextFailedCreature(): void {
    const nextNonKilledFailedCreatureIndex: number = this.getNextNonKilledFailedCreatureIndex(this.creatures);

    if (nextNonKilledFailedCreatureIndex !== -1) {
      this.creatureRpcService.killFailedCreature(this.creatures[nextNonKilledFailedCreatureIndex]).subscribe(
        (): void => {
          this.creatures.splice(nextNonKilledFailedCreatureIndex, 1);
          this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

          if (this.getNextNonKilledFailedCreatureIndex(this.creatures) === -1) {
            this.manualStep = ManualStep.REPRODUCING;
          }
        }
      );
    } else {
      console.error("No non-killed creatures remain, somehow!");
      this.manualStep = ManualStep.REPRODUCING;
    }
  }

  public killAllRemainingFailedCreatures(): void {
    const nextNonKilledFailedCreatureIndex: number = this.getNextNonKilledFailedCreatureIndex(this.creatures);

    if (nextNonKilledFailedCreatureIndex !== -1) {
      this.creatureRpcService.killFailedCreature(this.creatures[nextNonKilledFailedCreatureIndex]).subscribe(
        (): void => {
          this.creatures.splice(nextNonKilledFailedCreatureIndex, 1);
          this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

          if (this.getNextNonKilledFailedCreatureIndex(this.creatures) !== -1) {
            this.killAllRemainingFailedCreatures();
          } else {
            this.manualStep = ManualStep.REPRODUCING;
          }
        }
      );
    } else {
      console.error("No non-killed creatures remain, somehow!");
      this.manualStep = ManualStep.REPRODUCING;
    }
  }

  public killAllRemainingFailedCreaturesInstantly(): void {
    const allNonKilledFailedCreatures: Array<Creature> = this.getAllNonKilledFailedCreatures(this.creatures);

    if (allNonKilledFailedCreatures.length > 0) {
      this.creatureRpcService.killFailedCreatures(allNonKilledFailedCreatures).subscribe(
        (): void => {
          this.creatures = this.getAllNonReproducedSuccessfulCreatures(this.creatures);
          this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

          this.manualStep = ManualStep.REPRODUCING;
        }
      );
    } else {
      console.error("No non-killed creatures remain, somehow!");
      this.manualStep = ManualStep.REPRODUCING;
    }
  }

  public killAllFailedCreatures(): void {
    const allNonKilledFailedCreatures: Array<Creature> = this.getAllNonKilledFailedCreatures(this.creatures);

    this.creatureRpcService.killFailedCreatures(allNonKilledFailedCreatures).subscribe(
      (): void => {
        this.creatures = this.getAllNonReproducedSuccessfulCreatures(this.creatures);
        this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

        this.manualStep = ManualStep.REPRODUCING;
      }
    );
  }

  ///////////////////////////////////////////////// REPRODUCE /////////////////////////////////////////////////

  public reproduceNextSuccessfulCreature(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.ADVANCING_GENERATION;
  }

  public reproduceAllRemainingSuccessfulCreatures(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.ADVANCING_GENERATION;
  }

  public reproduceAllRemainingSuccessfulCreaturesInstantly(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.ADVANCING_GENERATION;
  }

  public reproduceAllSuccessfulCreatures(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.ADVANCING_GENERATION;
  }

  ///////////////////////////////////////////////// ADVANCE GENERATION /////////////////////////////////////////////////

  public advanceGeneration(): void {
    // TODO: Implement.

    this.generationType = GenerationType.NOT_SET;
    this.controlType = ControlType.NOT_SET;
    this.manualStep = ManualStep.NOT_SET;
  }

  ///////////////////////////////////////////////// OLD SHIT /////////////////////////////////////////////////

  public olddoOneManualGeneration(): void {
    // this.generationType = GenerationType.SINGLE;
    // this.controlType = ControlType.MANUAL;
  }

  public oldapplyNaturalSelection(): void {
    // this.creatures.forEach(
    //   (creature: Creature, i: number): void => {
    //     const chanceOfDeath = i / (this.creatures.length - 1);
    //
    //     if (Math.random() < chanceOfDeath) {
    //       creature.fail();
    //     } else {
    //       creature.succeed();
    //     }
    //   }
    // );
    //
    // if (this.generationType === GenerationType.SINGLE) {
    //   this.controlType = ControlType.INSTANT;
    // }
  }


  public oldapplyReproduction(): void {
    // const newCreatures: Array<Creature> = [];
    // this.creatures.forEach(
    //   (creature: Creature): void => {
    //     if (creature.result.outcome === Outcome.SUCCESS) {
    //       const quantityChildren: number = Math.floor((Math.random() * (EvolveComponent.MAXIMUM_CHILDREN_ALLOWED_PER_GENERATION + (this.creatures.length < 50 ? 1 : 0))) + 1);
    //       for (let i: number = 0; i < quantityChildren; i++) {
    //         if (newCreatures.length < EvolveComponent.MAXIMUM_CREATURES_ALLOWED_PER_GENERATION) {
    //           newCreatures.push(creature.reproduce());
    //         } else {
    //           console.warn("Could not reproduce for \"" + creature.name + "\", we are at carrying capacity.");
    //         }
    //       }
    //     } else if (creature.result.outcome === Outcome.FAILURE) {
    //     // This creature dies by not reproducing.
    //     } else {
    //       console.error("Unrecognized creature result outcome \"" + creature.result.outcome + "\" encountered on creature \"" + creature.name + "\".");
    //     }
    //   }
    // );
    //
    // this.creatures = newCreatures;
    //
    // if (this.generationType === GenerationType.SINGLE || this.generationType === GenerationType.CONTINUOUS) {
    //   this.controlType = ControlType.ADVANCE_GENERATION;
    // }
  }

  public olddoOneFullGeneration(): void {
    // this.generationType = GenerationType.CONTINUOUS;
    //
    // this.creatures.forEach(
    //   (creature: Creature): void => {
    //     creature.simulate();
    //   }
    // );
    //
    // this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures);
    //
    // this.applyNaturalSelection();
    //
    // this.controlType = ControlType.INSTANT;
  }

  public olddoOneFullGenerationInstantly(): void {
    // this.creatures.forEach(
    //   (creature: Creature): void => {
    //     creature.simulate();
    //   }
    // );
    //
    // this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures);
    //
    // this.applyNaturalSelection();
    //
    // this.applyReproduction();
    //
    // this.advanceGeneration();
    //
    // this.generationType = GenerationType.NOT_SET;
  }

  public oldstartContinuousInstantGeneration(): void {
    // this.generationType = GenerationType.CONTINUOUS;
    //
    // if (!this.continuousInstantGenerationSignalledToStop) {
    //   this.creatures.forEach(
    //     (creature: Creature): void => {
    //       creature.simulate();
    //     }
    //   );
    //
    //   this.creatures = this.sortCreaturesBasedOnFitnessValue(this.creatures);
    //
    //   this.applyNaturalSelection();
    //
    //   this.applyReproduction();
    //
    //   this.advanceGeneration();
    // } else {
    //   this.continuousInstantGenerationSignalledToStop = false;
    //   this.generationType = GenerationType.NOT_SET;
    // }
  }

  public oldadvanceGeneration(): void {
    // if (this.generationType === GenerationType.SINGLE || this.generationType === GenerationType.CONTINUOUS || this.generationType === GenerationType.ONE_FULL_INSTANT) {
    //   this.controlType = ControlType.NOT_SET;
    //   this.generationType = GenerationType.NOT_SET;
    // }
    //
    // this.creatures.forEach(
    //   (creature: Creature): void => {
    //     creature.color = Creature.UNSET_COLOR;
    //     creature.borderColor = Creature.UNSET_BORDER_COLOR;
    //     creature.backgroundColor = Creature.UNSET_BACKGROUND_COLOR;
    //   }
    // );
    //
    // this.generationCounter++;
    // this.simulatedCreaturesThisGeneration = 0;
  }
}
