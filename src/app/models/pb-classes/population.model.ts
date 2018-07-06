import {PBClass} from "./pb-class.model";
import {PopulationMessage} from "../../pb/evolve_pb";
import {PBSerializable} from "./pb-serializable.interface";

export class Population extends PBClass<PopulationMessage> implements PopulationMessage.AsObject, PBSerializable<PopulationMessage, Population> {
  public static readonly CARRYING_CAPACITY: number = 64;

  // PopulationMessage.AsObject Variables
  public size: number;
  public carryingcapacity: number;

  // Population Variables
  // None currently

  constructor(populationMessage: PopulationMessage = new PopulationMessage()) {
    super(populationMessage);
    this.carryingcapacity = Population.CARRYING_CAPACITY;
  }

  public sateFromMessage(populationMessage: PopulationMessage): Population {
    return Object.assign(this, populationMessage.toObject()); // Copy every value from the second parameter into the first parameter.
  }

  public toMessage(): PopulationMessage {
    const populationMessage: PopulationMessage = new PopulationMessage();
    populationMessage.setSize(this.size);
    populationMessage.setCarryingcapacity(this.carryingcapacity);
    return populationMessage;
  }
}
