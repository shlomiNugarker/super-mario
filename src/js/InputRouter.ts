export default class InputRouter<T> {
  private receivers: Set<T>;

  constructor() {
    this.receivers = new Set<T>();
  }

  addReceiver(receiver: T): void {
    this.receivers.add(receiver);
  }

  dropReceiver(receiver: T): void {
    this.receivers.delete(receiver);
  }

  route(routeInput: (receiver: T) => void): void {
    for (const receiver of this.receivers) {
      routeInput(receiver);
    }
  }
}
