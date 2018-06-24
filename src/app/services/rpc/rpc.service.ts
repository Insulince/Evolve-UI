import {Injectable} from "@angular/core";
import {grpc} from "grpc-web-client";
import {UnaryOutput} from "grpc-web-client/dist/unary";
import {MethodDefinition, UnaryMethodDefinition} from "grpc-web-client/dist/service";
import {Code} from "grpc-web-client/dist/Code";
import Request = grpc.Request;
import ProtobufMessage = grpc.ProtobufMessage;
import Metadata = grpc.Metadata;
import Client = grpc.Client;

@Injectable({
  providedIn: "root"
})
export class RpcService {
  private static readonly host: string = "http://localhost:8080";

  constructor() {
  }

  public unary(
    method: UnaryMethodDefinition<ProtobufMessage, ProtobufMessage>,
    request: ProtobufMessage,
    onEnd: (output: UnaryOutput<ProtobufMessage>) => void,
  ): Request {
    return grpc.unary(
      method,
      {
        request: request,
        host: RpcService.host,
        onEnd: onEnd
      }
    );
  }

  public invoke(
    method: MethodDefinition<ProtobufMessage, ProtobufMessage>,
    request: ProtobufMessage,
    onMessage: (message: ProtobufMessage) => void,
    onEnd: (code: Code, message: string, trailers: Metadata) => void = (): void => {
    }
  ): Request {
    return grpc.invoke(
      method,
      {
        request: request,
        host: RpcService.host,
        onMessage: onMessage,
        onEnd: onEnd
      }
    );
  }

  public client(
    method: MethodDefinition<ProtobufMessage, ProtobufMessage>,
    onMessage: (callback: (message: ProtobufMessage) => void) => void,
    onEnd: (callback: (code: Code, message: string, trailers: Metadata) => void) => void = (): void => {
    },
  ): Client<ProtobufMessage, ProtobufMessage> {
    const client: Client<ProtobufMessage, ProtobufMessage> = grpc.client(
      method,
      {
        host: RpcService.host,
        transport: grpc.WebsocketTransportFactory
      }
    );
    client.onMessage = onMessage;
    client.onEnd = onEnd;

    return client;
  }
}
