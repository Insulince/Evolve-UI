import {Outcome} from "../enums/outcome.enum";

export class Result {
  public fitnessValue: number;
  public outcome: string;

  constructor() {
    this.fitnessValue = 0;
    this.outcome = Outcome.UNSET;
  }
}
