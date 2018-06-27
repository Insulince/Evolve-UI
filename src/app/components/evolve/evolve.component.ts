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
  public static readonly QUANTITY_STARTING_CREATURES: number = 25;
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
  public simulatedCreaturesThisGeneration: number;

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
    this.simulatedCreaturesThisGeneration = 0;
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
    // if (this.simulatedCreaturesThisGeneration !== this.creatures.length) {
    //   this.creatureRpcService.simulateCreature(this.creatures[this.simulatedCreaturesThisGeneration]).subscribe(
    //     (simulatedCreature: Creature): void => {
    //       this.creatures[this.simulatedCreaturesThisGeneration] = simulatedCreature;
    //       this.simulatedCreaturesThisGeneration++;
    //
    //       this.updateCreaturesArrays(
    //         this.sortCreaturesBasedOnFitnessValue(
    //           this.creatures.slice(
    //             0,
    //             this.simulatedCreaturesThisGeneration
    //           )
    //         ).concat(
    //           this.creatures.slice(
    //             this.simulatedCreaturesThisGeneration,
    //             this.creatures.length
    //           )
    //         )
    //       );
    //
    //       if (this.simulatedCreaturesThisGeneration === this.creatures.length) {
    //         this.controlType = ControlType.FULL;
    //       }
    //     }
    //   );
    // }

    this.manualStep = ManualStep.NATURALLY_SELECTING;
  }

  public simulateAllRemainingCreatures(): void {
    this.creatureRpcService.simulateCreatures(this.creatures).subscribe(
      (simulatedCreatures: Array<Creature>) => {
        this.manualStep = ManualStep.NATURALLY_SELECTING;
      }
    );

    // if (this.simulatedCreaturesThisGeneration !== this.creatures.length) {
    //   this.creatureRpcService.simulateCreature(this.creatures[this.simulatedCreaturesThisGeneration]).toPromise().then(
    //     (simulatedCreature: Creature): void => {
    //       this.creatures[this.simulatedCreaturesThisGeneration] = simulatedCreature;
    //       this.simulatedCreaturesThisGeneration++;
    //
    //       this.updateCreaturesArrays(
    //         this.sortCreaturesBasedOnFitnessValue(
    //           this.creatures.slice(
    //             0,
    //             this.simulatedCreaturesThisGeneration
    //           )
    //         ).concat(
    //           this.creatures.slice(
    //             this.simulatedCreaturesThisGeneration,
    //             this.creatures.length
    //           )
    //         )
    //       );
    //
    //
    //       if (this.simulatedCreaturesThisGeneration !== this.creatures.length) {
    //         this.simulateAllRemainingCreatures();
    //       } else {
    //         this.controlType = ControlType.FULL;
    //       }
    //     }
    //   );
    // }
  }

  public simulateAllRemainingCreaturesInstantly(): void {
    // const alreadySimulatedCreatues: Array<Creature> = [];
    // const notYetSimulatedCreatures: Array<Creature> = [];
    // this.creatures.forEach(
    //   (creature: Creature): void => {
    //     if (creature.simulatedThisGeneration) {
    //       alreadySimulatedCreatues.push(creature);
    //     } else {
    //       notYetSimulatedCreatures.push(creature);
    //     }
    //   }
    // );
    //
    // this.creatureRpcService.simulateCreatures(notYetSimulatedCreatures).subscribe(
    //   (simulatedCreatures: Array<Creature>): void => {
    //     simulatedCreatures = simulatedCreatures.concat(alreadySimulatedCreatues);
    //     simulatedCreatures = this.sortCreaturesBasedOnFitnessValue(simulatedCreatures);
    //     this.updateCreaturesArrays(simulatedCreatures);
    //
    //     this.controlType = ControlType.FULL;
    //   }
    // );

    this.manualStep = ManualStep.NATURALLY_SELECTING;
  }

  public simulateAllCreatures(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.NATURALLY_SELECTING;
  }

  ///////////////////////////////////////////////// NATURALLY SELECT /////////////////////////////////////////////////

  public naturallySelectNextCreature(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.REPRODUCING;
  }

  public naturallySelectAllRemainingCreatures(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.REPRODUCING;
  }

  public naturallySelectAllRemainingCreaturesInstantly(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.REPRODUCING;
  }

  public naturallySelectAllCreatures(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.REPRODUCING;
  }

  ///////////////////////////////////////////////// REPRODUCE /////////////////////////////////////////////////

  public reproduceNextCreature(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.ADVANCING_GENERATION;
  }

  public reproduceAllRemainingCreatures(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.ADVANCING_GENERATION;
  }

  public reproduceAllRemainingCreaturesInstantly(): void {
    // TODO: Implement.

    this.manualStep = ManualStep.ADVANCING_GENERATION;
  }

  public reproduceAllCreatures(): void {
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
