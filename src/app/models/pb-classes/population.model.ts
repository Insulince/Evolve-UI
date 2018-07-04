import {PBClass} from "./pb-class.model";
import {PopulationMessage} from "../../pb/evolve_pb";
import {PBSerializable} from "./pb-serializable.interface";

export class Population extends PBClass<PopulationMessage> implements PopulationMessage.AsObject, PBSerializable<PopulationMessage, Population> {
  // PopulationMessage.AsObject Variables
  public size: number;

  // Population Variables
  // None currently

  constructor(populationMessage: PopulationMessage = new PopulationMessage()) {
    super(populationMessage);
  }

  public sateFromMessage(populationMessage: PopulationMessage): Population {
    return Object.assign(this, populationMessage.toObject()); // Copy every value from the second parameter into the first parameter.
  }

  public toMessage(): PopulationMessage {
    const populationMessage: PopulationMessage = new PopulationMessage();
    populationMessage.setSize(this.size);
    return populationMessage;
  }
}
