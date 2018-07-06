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
  public speed: Speed;
  public awaitingResponse: boolean;

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
    this.speed = Speed.NOT_SET;
    this.awaitingResponse = false;

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

  public setSpeedToRealTime(): void {
    this.speed = Speed.REAL_TIME;
    this.automaticGeneration(this.speed);
  }

  public setSpeedToInstant(): void {
    this.speed = Speed.INSTANT;
    this.automaticGeneration(this.speed);
  }

  public automaticGeneration(speed: Speed): void {
    switch (speed) {
      case Speed.REAL_TIME:
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
      case Speed.INSTANT:
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
      default:
        console.error(`Unrecognized speed encountered: ${speed}.`);
        break;
    }
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
          console.error("No non-killed creatures remain, somehow!");
          this.manualStep = ManualStep.REPRODUCING;
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
          console.error("No non-killed creatures remain, somehow!");
          this.manualStep = ManualStep.REPRODUCING;
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
          console.error("No non-killed creatures remain, somehow!");
          this.manualStep = ManualStep.REPRODUCING;
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
    this.speed = Speed.NOT_SET;
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
    //   this.controlType = ControlType.AUTOMATIC;
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
    // this.controlType = ControlType.AUTOMATIC;
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
}
