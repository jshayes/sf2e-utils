import { WindowManagerApp } from "../applications/windowManagerApp";

export async function open(): Promise<void> {
  await new WindowManagerApp().render({ force: true });
}
