import {Message} from "google-protobuf";
import {PBClass} from "./pb-class.model";

// PB-Class (C) implements Message.AsObject (M).
// C = rich class that contains all the data and all functions needed.
// M = base class that contains all the data needed.
// This interface ensures that a PBClass can convert between the two.

export interface PBSerializable<M extends Message, C extends PBClass<M>> {
  sateFromMessage(message: M): C; // Class Promotion: Given a base class instance, promote to a full-fledged rich class with all functionality.
  toMessage(): M; // Class Demotion: From the rich class, demote to the base class by stripping away everything but the data.
}
