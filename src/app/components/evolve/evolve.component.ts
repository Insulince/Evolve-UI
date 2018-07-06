import {Component, OnInit} from "@angular/core";
import {Creature} from "../../models/pb-classes/creature.model";
import {Util} from "../../util";
import {GenerationType} from "../../enums/generation-type.enum";
import {ControlType} from "../../enums/control-type.enum";
import {CreatureRpcService} from "../../services/rpc/creature-rpc.service";
import {ManualStep} from "../../enums/manual-step.enum";
import {Population} from "../../models/pb-classes/population.model";
import {Speed} from "../../enums/speed.enum";

@Component({
  selector: "evolve-ui-evolve",
  templateUrl: "./evolve.component.html",
  styleUrls: ["./evolve.component.scss"]
})
export class EvolveComponent implements OnInit {
  public static readonly QUANTITY_STARTING_CREATURES: number = 32;
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
    creatures.sort(
      (creatureOne: Creature, creatureTwo: Creature): number => {
        return creatureOne.fitnessvalue > creatureTwo.fitnessvalue ? Util.MORE_FIT : Util.LESS_FIT;
      }
    );

    creatures.forEach(
      (creature: Creature, i: number): void => {
        creature.fitnessindex = i;
      }
    );
    return creatures;
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
    this.automaticGeneration(this.automaticSpeed);
  }

  public setAutomaticSpeedToInstant(): void {
    this.automaticSpeed = Speed.INSTANT;
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
    this.continuousGeneration(this.continuousSpeed).then(
      (): void => {
        this.continuousGenerationStopped = false;
      }
    );
  }

  public setContinuousSpeedToInstant(): void {
    this.continuousSpeed = Speed.INSTANT;
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
        const nextUnsimulatedCreatureIndex: number = this.getNextUnsimulatedCreatureIndex(this.creatures);

        if (nextUnsimulatedCreatureIndex !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.simulateCreature(this.creatures[nextUnsimulatedCreatureIndex]).subscribe(
            (simulatedCreature: Creature): void => {
              this.awaitingResponse = false;

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
          reject();
        }
      }
    );
  }

  public simulateAllRemainingCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const nextUnsimulatedCreatureIndex: number = this.getNextUnsimulatedCreatureIndex(this.creatures);

        if (nextUnsimulatedCreatureIndex !== -1) {
          this.awaitingResponse = true;
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
                this.simulateAllRemainingCreatures().then(
                  (): void => {
                    resolve();
                  }
                );
              } else {
                this.manualStep = ManualStep.NATURALLY_SELECTING;
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              if (nextUnsimulatedCreatureIndex === this.creatures.length - 1) {
                this.awaitingResponse = false;
                resolve();
              }
            }
          );
        } else {
          console.error("No unsimulated creatures remain, somehow!");
          this.manualStep = ManualStep.NATURALLY_SELECTING;
          reject();
        }
      }
    );
  }

  public simulateAllRemainingCreaturesInstantly(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const nextUnsimulatedCreatureIndex: number = this.getNextUnsimulatedCreatureIndex(this.creatures);

        if (nextUnsimulatedCreatureIndex !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.simulateCreatures(this.creatures.slice(nextUnsimulatedCreatureIndex, this.creatures.length)).subscribe(
            (simulatedCreatures: Array<Creature>): void => {
              this.creatures = this.creatures.slice(0, nextUnsimulatedCreatureIndex).concat(simulatedCreatures);
              this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

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
            this.creatures = simulatedCreatures;
            this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

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
        const nextNonNaturallySelectedCreatureIndex: number = this.getNextNonNaturallySelectedCreatureIndex(this.creatures);

        const population: Population = new Population();
        population.size = this.creatures.length;

        if (nextNonNaturallySelectedCreatureIndex !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.naturallySelectCreature(this.creatures[nextNonNaturallySelectedCreatureIndex], population).subscribe(
            (naturallySelectdCreature: Creature): void => {
              this.creatures[nextNonNaturallySelectedCreatureIndex] = naturallySelectdCreature;

              this.updateCreaturesArrays(this.creatures);

              if (nextNonNaturallySelectedCreatureIndex === this.creatures.length - 1) {
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
          reject();
        }
      }
    );
  }

  public naturallySelectAllRemainingCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const nextNonNaturallySelectedCreatureIndex: number = this.getNextNonNaturallySelectedCreatureIndex(this.creatures);

        const population: Population = new Population();
        population.size = this.creatures.length;

        if (nextNonNaturallySelectedCreatureIndex !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.naturallySelectCreature(this.creatures[nextNonNaturallySelectedCreatureIndex], population).subscribe(
            (naturallySelectdCreature: Creature): void => {
              this.creatures[nextNonNaturallySelectedCreatureIndex] = naturallySelectdCreature;

              this.updateCreaturesArrays(this.creatures);

              if (nextNonNaturallySelectedCreatureIndex !== this.creatures.length - 1) {
                this.naturallySelectAllRemainingCreatures().then(
                  (): void => {
                    resolve();
                  }
                );
              } else {
                this.manualStep = ManualStep.KILLING;
              }
            },
            (error: Error): void => {
              console.error(error);
              this.awaitingResponse = false;
              reject();
            },
            (): void => {
              if (nextNonNaturallySelectedCreatureIndex === this.creatures.length - 1) {
                this.awaitingResponse = false;
                resolve();
              }
            }
          );
        } else {
          console.error("No non-naturally-selected creatures remain, somehow!");
          this.manualStep = ManualStep.KILLING;
          reject();
        }
      }
    );
  }

  public naturallySelectAllRemainingCreaturesInstantly(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const nextNonNaturallySelectedCreatureIndex: number = this.getNextNonNaturallySelectedCreatureIndex(this.creatures);

        const population: Population = new Population();
        population.size = this.creatures.length;

        if (nextNonNaturallySelectedCreatureIndex !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.naturallySelectCreatures(this.creatures.slice(nextNonNaturallySelectedCreatureIndex, this.creatures.length), population).subscribe(
            (naturallySelectdCreatures: Array<Creature>): void => {
              this.creatures = this.creatures.slice(0, nextNonNaturallySelectedCreatureIndex).concat(naturallySelectdCreatures);
              this.updateCreaturesArrays(this.creatures);

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
          (naturallySelectdCreatures: Array<Creature>): void => {
            this.creatures = naturallySelectdCreatures;
            this.updateCreaturesArrays(this.creatures);

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
        const nextFailedCreatureIndex: number = this.getNextFailedCreatureIndex(this.creatures);

        if (nextFailedCreatureIndex !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.killFailedCreature(this.creatures[nextFailedCreatureIndex]).subscribe(
            (): void => {
              this.creatures.splice(nextFailedCreatureIndex, 1);
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
          resolve();
        }
      }
    );
  }

  public killAllRemainingFailedCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const nextFailedCreatureIndex: number = this.getNextFailedCreatureIndex(this.creatures);

        if (nextFailedCreatureIndex !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.killFailedCreature(this.creatures[nextFailedCreatureIndex]).subscribe(
            (): void => {
              this.creatures.splice(nextFailedCreatureIndex, 1);
              this.updateCreaturesArrays(this.creatures);

              if (this.getNextFailedCreatureIndex(this.creatures) !== -1) {
                this.killAllRemainingFailedCreatures().then(
                  (): void => {
                    resolve();
                  }
                );
              } else {
                this.manualStep = ManualStep.REPRODUCING;
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
          resolve();
        }
      }
    );
  }

  public killAllRemainingFailedCreaturesInstantly(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const allFailedCreatures: Array<Creature> = this.getAllFailedCreatures(this.creatures);

        if (allFailedCreatures.length > 0) {
          this.awaitingResponse = true;
          this.creatureRpcService.killFailedCreatures(allFailedCreatures).subscribe(
            (): void => {
              this.creatures = this.getAllSuccessfulCreatures(this.creatures);
              this.updateCreaturesArrays(this.creatures);

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
          resolve();
        }
      }
    );
  }

  public killAllFailedCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        const allFailedCreatures: Array<Creature> = this.getAllFailedCreatures(this.creatures);

        this.awaitingResponse = true;
        this.creatureRpcService.killFailedCreatures(allFailedCreatures).subscribe(
          (): void => {
            this.creatures = this.getAllSuccessfulCreatures(this.creatures);
            this.updateCreaturesArrays(this.sortCreaturesBasedOnFitnessValue(this.creatures));

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
        if (this.getNextSuccessfulCreatureIndex(this.creatures) !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.reproduceSuccessfulCreature(this.creatures[0]).subscribe(
            (reproducedCreatureOffspring: Array<Creature>): void => {
              this.creatures.shift();
              this.creatures.push(...reproducedCreatureOffspring);

              this.updateCreaturesArrays(this.creatures);

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
          reject();
        }
      }
    );
  }

  public reproduceAllRemainingSuccessfulCreatures(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        if (this.getNextSuccessfulCreatureIndex(this.creatures) !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.reproduceSuccessfulCreature(this.creatures[0]).subscribe(
            (reproducedCreatureOffspring: Array<Creature>): void => {
              this.creatures.shift();
              this.creatures.push(...reproducedCreatureOffspring);

              this.updateCreaturesArrays(this.creatures);

              if (this.getNextSuccessfulCreatureIndex(this.creatures) !== -1) {
                this.reproduceAllRemainingSuccessfulCreatures().then(
                  (): void => {
                    resolve();
                  }
                );
              } else {
                this.manualStep = ManualStep.ADVANCING_GENERATION;
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
          reject();
        }
      }
    );
  }

  public reproduceAllRemainingSuccessfulCreaturesInstantly(): Promise<void> {
    return new Promise<void>(
      (resolve: Function, reject: Function): void => {
        if (this.getNextSuccessfulCreatureIndex(this.creatures) !== -1) {
          this.awaitingResponse = true;
          this.creatureRpcService.reproduceSuccessfulCreatures(this.getAllSuccessfulCreatures(this.creatures)).subscribe(
            (reproducedSuccessfulCreaturesOffspring: Array<Creature>): void => {
              this.creatures = this.creatures.slice(this.getAllSuccessfulCreatures(this.creatures).length).concat(reproducedSuccessfulCreaturesOffspring);
              this.updateCreaturesArrays(this.creatures);

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
          (reproducedSuccessfulCreaturesOffspring: Array<Creature>): void => {
            this.creatures = reproducedSuccessfulCreaturesOffspring;
            this.updateCreaturesArrays(this.creatures);

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
  }
}
