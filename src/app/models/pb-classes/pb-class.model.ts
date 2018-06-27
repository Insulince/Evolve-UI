import {Message} from "google-protobuf";
import {PBSerializable} from "./pb-serializable.interface";

export abstract class PBClass<M extends Message> implements PBSerializable<M, PBClass<M>> {
  protected constructor(message: M) {
    this.sateFromMessage(message);
  }

  abstract sateFromMessage(message);
  abstract toMessage();
}
