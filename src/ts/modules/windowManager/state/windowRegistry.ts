type WindowRegistryEntry = {
  key: number;
  id: string;
  name: string;
  type: string;
  app: WindowManagerApp;
};

type Subscriber = () => void;
type WindowManagerApp =
  | foundry.applications.api.ApplicationV2
  | foundry.appv1.api.Application;

class WindowRegistry {
  #entries = new Map<number, WindowRegistryEntry>();
  #appToKey = new WeakMap<WindowManagerApp, number>();
  #nextKey = 1;
  #subscribers = new Set<Subscriber>();

  upsert(app: WindowManagerApp): void {
    const key = this.#appToKey.get(app) ?? this.#nextKey++;
    this.#appToKey.set(app, key);

    const nextEntry: WindowRegistryEntry = {
      key,
      id: String(app.id ?? ""),
      name: this.#resolveAppName(app),
      type: app.constructor.name,
      app,
    };

    const prevEntry = this.#entries.get(key);
    const changed =
      !prevEntry ||
      prevEntry.id !== nextEntry.id ||
      prevEntry.name !== nextEntry.name ||
      prevEntry.type !== nextEntry.type ||
      prevEntry.app !== nextEntry.app;

    if (!changed) return;

    this.#entries.set(key, nextEntry);
    this.#notify();
  }

  remove(app: WindowManagerApp): void {
    const key = this.#appToKey.get(app);
    if (key === undefined) return;
    this.#entries.delete(key);
    this.#notify();
  }

  list(): WindowRegistryEntry[] {
    return Array.from(this.#entries.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  subscribe(subscriber: Subscriber): () => void {
    this.#subscribers.add(subscriber);
    return () => {
      this.#subscribers.delete(subscriber);
    };
  }

  #resolveAppName(app: WindowManagerApp): string {
    return String(app.title ?? app.id ?? app.constructor.name);
  }

  #notify(): void {
    for (const subscriber of this.#subscribers) {
      subscriber();
    }
  }
}

export const windowRegistry = new WindowRegistry();
export type { WindowRegistryEntry, WindowManagerApp };
