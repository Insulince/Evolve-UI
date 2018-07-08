import {Component, OnInit} from "@angular/core";
import {Creature} from "../../models/pb-classes/creature.model";
import {Util} from "../../util";
import {GenerationType} from "../../enums/generation-type.enum";
import {ControlType} from "../../enums/control-type.enum";
import {CreatureRpcService} from "../../services/rpc/creature-rpc.service";
import {ManualStep} from "../../enums/manual-step.enum";
import {Population} from "../../models/pb-classes/population.model";
import {Speed} from "../../enums/speed.enum";

// TODO: Refactor the way all of the "X_remaining_creatures" functions check how all creatures have completed. Running into weird errors with current implementation.
// TODO: Remove all "if index === -1" checks and implement some other mechanism.

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
  public automaticSpeed: Speed;
  public continuousSpeed: Speed;
  public awaitingResponse: boolean;
  public continuousGenerationStopped: boolean;

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
    this.automaticSpeed = Speed.NOT_SET;
    this.continuousSpeed = Speed.NOT_SET;
    this.awaitingResponse = false;
    this.continuousGenerationStopped = false;

    // GLOBAL DATA
    this.generationCounter = 0;
  }

  public ngOnInit(): void {
  }

  ///////////////////////////////////////////////// CREATURE MANIPULATION /////////////////////////////////////////////////

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
    // TODO: Consider the case where a creature has not been simulated yet. Should these be sorted differently?
    creatures.sort(
      (creatureOne: Creature, creatureTwo: Creature): number => {
        return creatureOne.fitnessvalue >= creatureTwo.fitnessvalue ? Util.MORE_FIT : Util.LESS_FIT;
      }
    );

    creatures.forEach(
      (creature: Creature, i: number): void => {
        creature.fitnessindex = i;
      }
    );

    return creatures;
  }

  // creatures = The array of ALL creatures EXCEPT the creature to be inserted, SORTED in order of fitness value WITH unsimulated creatures at the end.
  // creature = The creature to be inserted.
  private insertCreatureBasedOnFitnessValue(creatures: Array<Creature>, creature: Creature): Array<Creature> {
    const simulatedCreatures: Array<Creature> = this.getAllSimulatedCreatures(creatures); // Get only the simulated creatures.

    const notInserted: boolean = simulatedCreatures.every( // Iterate over every creature until false or end of array.
      (simulatedCreature: Creature, i: number): boolean => {
        if (!simulatedCreature.naturallyselectedthisgeneration && creature.naturallyselectedthisgeneration) {
          simulatedCreatures.splice(i, 0, creature); // Insert the insertion creature at this index.
          return false; // Stop iterating.
        } else { // Otherwise...
          if (simulatedCreature.fitnessvalue < creature.fitnessvalue) { // If this simulated creatures fitness value is less than the insertion creature...
            simulatedCreatures.splice(i, 0, creature); // Insert the insertion creature at this index.
            return false; // Stop iterating.
          } else {
            return true; // Then this is not where we want to insert this creature, continue iteration.
          }
        }
      }
    );

    if (notInserted === true) { // In the event that the creature was never inserted (due to it having the LOWEST fitness value)...
      simulatedCreatures.push(creature); // Push it to the end, for it has the lowest fitness value.
    }

    creatures = simulatedCreatures.concat(this.getAllUnsimulatedCreatures(creatures));

    creatures.forEach(
      (creature: Creature, i: number): void => {
        creature.fitnessindex = i;
      }
    );

    return creatures;
  }

  private getNextSimulatedCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.simulatedthisgeneration === true;
      }
    );
  }

  private getAllSimulatedCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.simulatedthisgeneration === true;
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

  private getAllUnsimulatedCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.simulatedthisgeneration === false;
      }
    );
  }

  private getNextNaturallySelectedCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.naturallyselectedthisgeneration === true;
      }
    );
  }

  private getAllNaturallySelectedCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.naturallyselectedthisgeneration === true;
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

  private getAllNonNaturallySelectedCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.naturallyselectedthisgeneration === false;
      }
    );
  }

  private getNextFailedCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.outcome === "FAILURE";
      }
    );
  }

  private getAllFailedCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.outcome === "FAILURE";
      }
    );
  }

  private getNextSuccessfulCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.outcome === "SUCCESS";
      }
    );
  }

  private getAllSuccessfulCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.outcome === "SUCCESS";
      }
    );
  }

  // TODO: This is an abuse of a property that happens to be true for offspring. Make this more stable.
  private getNextOffspringCreatureIndex(creatures: Array<Creature>): number {
    return creatures.findIndex(
      (creature: Creature): boolean => {
        return creature.naturallyselectedthisgeneration === false;
      }
    );
  }

  // TODO: This is an abuse of a property that happens to be true for offspring. Make this more stable.
  private getAllOffspringCreatures(creatures: Array<Creature>): Array<Creature> {
    return creatures.filter(
      (creature: Creature): boolean => {
        return creature.naturallyselectedthisgeneration === false;
      }
    );
  }

  ///////////////////////////////////////////////// CREATURE GENERATION /////////////////////////////////////////////////

  public generateInitialCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        this.updateCreaturesArrays([]);

        this.awaitingResponse = true;
        this.creatureRpcService.generateCreatures(EvolveComponent.QUANTITY_STARTING_CREATURES).subscribe(
          (creatures: Array<Creature>): void => {
            this.updateCreaturesArrays(creatures);
          },
          (error: Error): void => {
            console.error(error);
            this.awaitingResponse = false;
            reject();
          },
          (): void => {
            this.creaturesCreated = true;
            this.awaitingResponse = false;
            resolve();
          }
        );
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

  public setControlTypeToAutomatic(): void {
    this.controlType = ControlType.AUTOMATIC;
  }

  ///////////////////////////////////////////////// SPEED /////////////////////////////////////////////////

  public setAutomaticSpeedToRealTime(): void {
    this.automaticSpeed = Speed.REAL_TIME;
    this.manualStep = ManualStep.SIMULATING;
    this.automaticGeneration(this.automaticSpeed);
  }

  public setAutomaticSpeedToInstant(): void {
    this.automaticSpeed = Speed.INSTANT;
    this.manualStep = ManualStep.SIMULATING;
    this.automaticGeneration(this.automaticSpeed);
  }

  public automaticGeneration(speed: Speed): void {
    switch (speed) {
      case Speed.REAL_TIME: {
        this.simulateAllRemainingCreatures().then(
          (): void => {
            this.naturallySelectAllRemainingCreatures().then(
              (): void => {
                this.killAllRemainingFailedCreatures().then(
                  (): void => {
                    this.reproduceAllRemainingSuccessfulCreatures().then(
                      (): void => {
                        // Nothing to do at this point. Included for completeness.
                      }
                    );
                  }
                );
              }
            );
          }
        );
        break;
      }
      case Speed.INSTANT: {
        this.simulateAllRemainingCreaturesInstantly().then(
          (): void => {
            this.naturallySelectAllRemainingCreaturesInstantly().then(
              (): void => {
                this.killAllRemainingFailedCreaturesInstantly().then(
                  (): void => {
                    this.reproduceAllRemainingSuccessfulCreaturesInstantly().then(
                      (): void => {
                        // Nothing to do at this point. Included for completeness.
                      }
                    );
                  }
                );
              }
            );
          }
        );
        break;
      }
      default: {
        console.error(`Unrecognized speed encountered: ${speed}.`);
        break;
      }
    }
  }

  public setContinuousSpeedToRealTime(): void {
    this.continuousSpeed = Speed.REAL_TIME;
    this.manualStep = ManualStep.SIMULATING;
    this.continuousGeneration(this.continuousSpeed).then(
      (): void => {
        this.continuousGenerationStopped = false;
      }
    );
  }

  public setContinuousSpeedToInstant(): void {
    this.continuousSpeed = Speed.INSTANT;
    this.manualStep = ManualStep.SIMULATING;
    this.continuousGeneration(this.continuousSpeed).then(
      (): void => {
        this.continuousGenerationStopped = false;
      }
    );
  }

  // TODO: This method of recursive promise resolutions has a limitation of the maximum call stack size, whatever it may be. Find a way to alleviate this problem, else you will run out of space eventually.
  public continuousGeneration(speed: Speed): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        if (this.continuousGenerationStopped === false) {
          switch (speed) {
            case Speed.REAL_TIME: {
              this.simulateAllRemainingCreatures().then(
                (): void => {
                  this.naturallySelectAllRemainingCreatures().then(
                    (): void => {
                      this.killAllRemainingFailedCreatures().then(
                        (): void => {
                          this.reproduceAllRemainingSuccessfulCreatures().then(
                            (): void => {
                              this.advanceGeneration();
                              this.generationType = GenerationType.CONTINUOUS;
                              this.manualStep = ManualStep.SIMULATING;
                              this.continuousGeneration(speed).then(
                                (): void => {
                                  resolve();
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
              break;
            }
            case Speed.INSTANT: {
              this.simulateAllRemainingCreaturesInstantly().then(
                (): void => {
                  this.naturallySelectAllRemainingCreaturesInstantly().then(
                    (): void => {
                      this.killAllRemainingFailedCreaturesInstantly().then(
                        (): void => {
                          this.reproduceAllRemainingSuccessfulCreaturesInstantly().then(
                            (): void => {
                              this.advanceGeneration();
                              this.generationType = GenerationType.CONTINUOUS;
                              this.manualStep = ManualStep.SIMULATING;
                              this.continuousGeneration(speed).then(
                                (): void => {
                                  resolve();
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
              break;
            }
            default: {
              console.error(`Unrecognized speed encountered: ${speed}.`);
              reject();
              break;
            }
          }
        } else {
          this.generationType = GenerationType.NOT_SET;
          this.controlType = ControlType.NOT_SET;
          this.manualStep = ManualStep.NOT_SET;
          this.automaticSpeed = Speed.NOT_SET;
          this.continuousSpeed = Speed.NOT_SET;
          resolve();
        }
      }
    );
  }

  public stopContinuousGeneration(): void {
    this.continuousGenerationStopped = true;
  }

  ///////////////////////////////////////////////// SIMULATE /////////////////////////////////////////////////

  public simulateNextCreature(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const unsimulatedCreatureIndex: number = this.getNextUnsimulatedCreatureIndex(this.creatures);
        if (unsimulatedCreatureIndex !== -1) {
          const unsimulatedCreature: Creature = this.creatures[unsimulatedCreatureIndex];
          this.awaitingResponse = true;
          this.creatureRpcService.simulateCreature(unsimulatedCreature).subscribe(
            (simulatedCreature: Creature): void => {
              this.creatures.splice(unsimulatedCreatureIndex, 1);

              this.updateCreaturesArrays(this.insertCreatureBasedOnFitnessValue(this.creatures, simulatedCreature));

              if (this.getNextUnsimulatedCreatureIndex(this.creatures) === -1) {
                this.manualStep = ManualStep.NATURALLY_SELECTING;
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              this.awaitingResponse = false;
              resolve();
            }
          );
        } else {
          console.error("No unsimulated creatures remain, somehow!");
          this.manualStep = ManualStep.NATURALLY_SELECTING;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public simulateAllRemainingCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const unsimulatedCreatureIndex: number = this.getNextUnsimulatedCreatureIndex(this.creatures);
        if (unsimulatedCreatureIndex !== -1) {
          const unsimulatedCreature: Creature = this.creatures[unsimulatedCreatureIndex];
          this.awaitingResponse = true;
          this.creatureRpcService.simulateCreature(unsimulatedCreature).subscribe(
            (simulatedCreature: Creature): void => {
              this.creatures.splice(unsimulatedCreatureIndex, 1);

              this.updateCreaturesArrays(this.insertCreatureBasedOnFitnessValue(this.creatures, simulatedCreature));

              if (this.getNextUnsimulatedCreatureIndex(this.creatures) === -1) {
                this.manualStep = ManualStep.NATURALLY_SELECTING;
              } else {
                this.simulateAllRemainingCreatures().then(
                  (): void => {
                    resolve();
                  }
                );
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              if (this.getNextUnsimulatedCreatureIndex(this.creatures) === -1) {
                this.awaitingResponse = false;
                resolve();
              }
            }
          );
        } else {
          console.error("No unsimulated creatures remain, somehow!");
          this.manualStep = ManualStep.NATURALLY_SELECTING;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public simulateAllRemainingCreaturesInstantly(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const simulatedCreatures: Array<Creature> = this.getAllSimulatedCreatures(this.creatures);
        const unsimulatedCreatures: Array<Creature> = this.getAllUnsimulatedCreatures(this.creatures);

        if (unsimulatedCreatures.length > 0) {
          this.awaitingResponse = true;
          this.creatureRpcService.simulateCreatures(unsimulatedCreatures).subscribe(
            (newlySimulatedCreatures: Array<Creature>): void => {
              this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(simulatedCreatures.concat(newlySimulatedCreatures)));

              this.manualStep = ManualStep.NATURALLY_SELECTING;
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              this.awaitingResponse = false;
              resolve();
            }
          );
        } else {
          console.error("No unsimulated creatures remain, somehow!");
          this.manualStep = ManualStep.NATURALLY_SELECTING;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public simulateAllCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        this.awaitingResponse = true;
        this.creatureRpcService.simulateCreatures(this.creatures).subscribe(
          (simulatedCreatures: Array<Creature>): void => {
            this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(simulatedCreatures));

            this.manualStep = ManualStep.NATURALLY_SELECTING;
          },
          (error: Error): void => {
            console.error(error);
            this.awaitingResponse = false;
            reject();
          },
          (): void => {
            this.awaitingResponse = false;
            resolve();
          }
        );
      }
    );
  }

  ///////////////////////////////////////////////// NATURALLY SELECT /////////////////////////////////////////////////

  public naturallySelectNextCreature(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const nonNaturallySelectedCreatureIndex: number = this.getNextNonNaturallySelectedCreatureIndex(this.creatures);
        if (nonNaturallySelectedCreatureIndex !== -1) {
          const nonNaturallySelectedCreature: Creature = this.creatures[nonNaturallySelectedCreatureIndex];
          const population: Population = new Population();
          population.size = this.creatures.length;
          this.awaitingResponse = true;
          this.creatureRpcService.naturallySelectCreature(nonNaturallySelectedCreature, population).subscribe(
            (naturallySelectedCreature: Creature): void => {
              this.creatures.splice(nonNaturallySelectedCreatureIndex, 1);

              this.updateCreaturesArrays(this.insertCreatureBasedOnFitnessValue(this.creatures, naturallySelectedCreature));

              if (this.getNextNonNaturallySelectedCreatureIndex(this.creatures) === -1) {
                this.manualStep = ManualStep.KILLING;
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              this.awaitingResponse = false;
              resolve();
            }
          );
        } else {
          console.error("No non-naturally-selected creatures remain, somehow!");
          this.manualStep = ManualStep.KILLING;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public naturallySelectAllRemainingCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const nonNaturallySelectedCreatureIndex: number = this.getNextNonNaturallySelectedCreatureIndex(this.creatures);
        if (nonNaturallySelectedCreatureIndex !== -1) {
          const nonNaturallySelectedCreature: Creature = this.creatures[nonNaturallySelectedCreatureIndex];
          const population: Population = new Population();
          population.size = this.creatures.length;
          this.awaitingResponse = true;
          this.creatureRpcService.naturallySelectCreature(nonNaturallySelectedCreature, population).subscribe(
            (naturallySelectdCreature: Creature): void => {
              this.creatures.splice(nonNaturallySelectedCreatureIndex, 1);

              this.updateCreaturesArrays(this.insertCreatureBasedOnFitnessValue(this.creatures, naturallySelectdCreature));

              if (this.getNextNonNaturallySelectedCreatureIndex(this.creatures) === -1) {
                this.manualStep = ManualStep.KILLING;
              } else {
                this.naturallySelectAllRemainingCreatures().then(
                  (): void => {
                    resolve();
                  }
                );
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              if (this.getNextNonNaturallySelectedCreatureIndex(this.creatures) === -1) {
                this.awaitingResponse = false;
                resolve();
              }
            }
          );
        } else {
          console.error("No non-naturally-selected creatures remain, somehow!");
          this.manualStep = ManualStep.KILLING;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public naturallySelectAllRemainingCreaturesInstantly(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const naturallySelectedCreatures: Array<Creature> = this.getAllNaturallySelectedCreatures(this.creatures);
        const nonNaturallySelectedCreatures: Array<Creature> = this.getAllNonNaturallySelectedCreatures(this.creatures);

        const population: Population = new Population();
        population.size = this.creatures.length;

        if (nonNaturallySelectedCreatures.length > 0) {
          this.awaitingResponse = true;
          this.creatureRpcService.naturallySelectCreatures(nonNaturallySelectedCreatures, population).subscribe(
            (newlyNaturallySelectdCreatures: Array<Creature>): void => {
              this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(naturallySelectedCreatures.concat(newlyNaturallySelectdCreatures)));

              this.manualStep = ManualStep.KILLING;
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              this.awaitingResponse = false;
              resolve();
            }
          );
        } else {
          console.error("No non-naturally-selected creatures remain, somehow!");
          this.manualStep = ManualStep.KILLING;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public naturallySelectAllCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const population: Population = new Population();
        population.size = this.creatures.length;

        this.awaitingResponse = true;
        this.creatureRpcService.naturallySelectCreatures(this.creatures, population).subscribe(
          (naturallySelectedCreatures: Array<Creature>): void => {
            this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(naturallySelectedCreatures));

            this.manualStep = ManualStep.KILLING;
          },
          (error: Error): void => {
            console.error(error);
            this.awaitingResponse = false;
            reject();
          },
          (): void => {
            this.awaitingResponse = false;
            resolve();
          }
        );
      }
    );
  }

  ///////////////////////////////////////////////// KILL FAILED /////////////////////////////////////////////////

  public killNextFailedCreature(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const failedCreatureIndex: number = this.getNextFailedCreatureIndex(this.creatures);
        if (failedCreatureIndex !== -1) {
          const failedCreature: Creature = this.creatures[failedCreatureIndex];
          this.awaitingResponse = true;
          this.creatureRpcService.killFailedCreature(failedCreature).subscribe(
            (): void => {
              this.creatures.splice(failedCreatureIndex, 1);

              this.updateCreaturesArrays(this.creatures);

              if (this.getNextFailedCreatureIndex(this.creatures) === -1) {
                this.manualStep = ManualStep.REPRODUCING;
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              this.awaitingResponse = false;
              resolve();
            }
          );
        } else {
          this.manualStep = ManualStep.REPRODUCING;
          this.awaitingResponse = false;
          resolve();
        }
      }
    );
  }

  public killAllRemainingFailedCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const failedCreatureIndex: number = this.getNextFailedCreatureIndex(this.creatures);
        if (failedCreatureIndex !== -1) {
          const failedCreature: Creature = this.creatures[failedCreatureIndex];
          this.awaitingResponse = true;
          this.creatureRpcService.killFailedCreature(failedCreature).subscribe(
            (): void => {
              this.creatures.splice(failedCreatureIndex, 1);

              this.updateCreaturesArrays(this.creatures);

              if (this.getNextFailedCreatureIndex(this.creatures) === -1) {
                this.manualStep = ManualStep.REPRODUCING;
              } else {
                this.killAllRemainingFailedCreatures().then(
                  (): void => {
                    resolve();
                  }
                );
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              if (this.getNextFailedCreatureIndex(this.creatures) === -1) {
                this.awaitingResponse = false;
                resolve();
              }
            }
          );
        } else {
          this.manualStep = ManualStep.REPRODUCING;
          this.awaitingResponse = false;
          resolve();
        }
      }
    );
  }

  public killAllRemainingFailedCreaturesInstantly(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const successfulCreatures: Array<Creature> = this.getAllSuccessfulCreatures(this.creatures);
        const failedCreatures: Array<Creature> = this.getAllFailedCreatures(this.creatures);

        if (failedCreatures.length > 0) {
          this.awaitingResponse = true;
          this.creatureRpcService.killFailedCreatures(failedCreatures).subscribe(
            (): void => {
              this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(successfulCreatures));

              this.manualStep = ManualStep.REPRODUCING;
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              this.awaitingResponse = false;
              resolve();
            }
          );
        } else {
          this.manualStep = ManualStep.REPRODUCING;
          this.awaitingResponse = false;
          resolve();
        }
      }
    );
  }

  public killAllFailedCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const successfulCreatures: Array<Creature> = this.getAllSuccessfulCreatures(this.creatures);
        const failedCreatures: Array<Creature> = this.getAllFailedCreatures(this.creatures);

        this.awaitingResponse = true;
        this.creatureRpcService.killFailedCreatures(failedCreatures).subscribe(
          (): void => {
            this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(successfulCreatures));

            this.manualStep = ManualStep.REPRODUCING;
          },
          (error: Error): void => {
            console.error(error);
            this.awaitingResponse = false;
            reject();
          },
          (): void => {
            this.awaitingResponse = false;
            resolve();
          }
        );
      }
    );
  }

  ///////////////////////////////////////////////// REPRODUCE SUCCESSFUL /////////////////////////////////////////////////

  public reproduceNextSuccessfulCreature(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const successfulCreatureIndex: number = this.getNextSuccessfulCreatureIndex(this.creatures);
        if (successfulCreatureIndex !== -1) {
          const succeessfulCreature: Creature = this.creatures[successfulCreatureIndex];
          this.awaitingResponse = true;
          this.creatureRpcService.reproduceSuccessfulCreature(succeessfulCreature).subscribe(
            (offspring: Array<Creature>): void => {
              this.creatures.splice(successfulCreatureIndex, 1);

              this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures.concat(offspring)));

              if (this.getNextSuccessfulCreatureIndex(this.creatures) === -1) {
                this.manualStep = ManualStep.ADVANCING_GENERATION;
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              this.awaitingResponse = false;
              resolve();
            }
          );
        } else {
          console.error("No non-naturally-selected creatures remain, somehow!");
          this.manualStep = ManualStep.ADVANCING_GENERATION;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public reproduceAllRemainingSuccessfulCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const successfulCreatureIndex: number = this.getNextSuccessfulCreatureIndex(this.creatures);
        if (successfulCreatureIndex !== -1) {
          const successfulCreature: Creature = this.creatures[successfulCreatureIndex];
          this.awaitingResponse = true;
          this.creatureRpcService.reproduceSuccessfulCreature(successfulCreature).subscribe(
            (offspring: Array<Creature>): void => {
              this.creatures.splice(successfulCreatureIndex, 1);

              this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures.concat(offspring)));

              if (this.getNextSuccessfulCreatureIndex(this.creatures) === -1) {
                this.manualStep = ManualStep.ADVANCING_GENERATION;
              } else {
                this.reproduceAllRemainingSuccessfulCreatures().then(
                  (): void => {
                    resolve();
                  }
                );
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              if (this.getNextSuccessfulCreatureIndex(this.creatures) === -1) {
                this.awaitingResponse = false;
                resolve();
              }
            }
          );
        } else {
          console.error("No non-naturally-selected creatures remain, somehow!");
          this.manualStep = ManualStep.ADVANCING_GENERATION;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public reproduceAllRemainingSuccessfulCreaturesInstantly(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const offspring: Array<Creature> = this.getAllOffspringCreatures(this.creatures);
        const successfulCreatures: Array<Creature> = this.getAllSuccessfulCreatures(this.creatures);

        if (successfulCreatures.length > 0) {
          this.awaitingResponse = true;
          this.creatureRpcService.reproduceSuccessfulCreatures(successfulCreatures).subscribe(
            (newOffspring: Array<Creature>): void => {
              this.updateCreaturesArrays(offspring.concat(newOffspring));

              this.manualStep = ManualStep.ADVANCING_GENERATION;
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              this.awaitingResponse = false;
              resolve();
            }
          );
        } else {
          console.error("No non-naturally-selected creatures remain, somehow!");
          this.manualStep = ManualStep.ADVANCING_GENERATION;
          this.awaitingResponse = false;
          reject();
        }
      }
    );
  }

  public reproduceAllSuccessfulCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        this.awaitingResponse = true;
        this.creatureRpcService.reproduceSuccessfulCreatures(this.creatures).subscribe(
          (offspring: Array<Creature>): void => {
            this.updateCreaturesArrays(offspring);

            this.manualStep = ManualStep.ADVANCING_GENERATION;
          },
          (error: Error): void => {
            console.error(error);
            this.awaitingResponse = false;
            reject();
          },
          (): void => {
            this.awaitingResponse = false;
            resolve();
          }
        );
      }
    );
  }

  ///////////////////////////////////////////////// ADVANCE GENERATION /////////////////////////////////////////////////

  public advanceGeneration(): void {
    this.generationCounter++;

    this.generationType = GenerationType.NOT_SET;
    this.controlType = ControlType.NOT_SET;
    this.manualStep = ManualStep.NOT_SET;
    this.automaticSpeed = Speed.NOT_SET;

    // TODO: This feels hacky.
    this.creatures.forEach(
      (creature: Creature): void => {
        creature.mutatedthisgeneration = false;
        creature.color = Creature.UNSET_COLOR;
        creature.borderColor = Creature.UNSET_BORDER_COLOR;
        creature.backgroundColor = Creature.UNSET_BACKGROUND_COLOR;
      }
    );
  }
}
