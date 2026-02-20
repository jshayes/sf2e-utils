export class HooksManager {
  private hooks: { hook: string; id: number }[] = [];

  public on(...args: Parameters<typeof Hooks.on>) {
    const id = Hooks.on(...args);
    this.hooks.push({ hook: args[0], id });
  }

  public once(...args: Parameters<typeof Hooks.on>) {
    const id = Hooks.on(...args);
    this.hooks.push({ hook: args[0], id });
  }

  public off() {
    this.hooks.forEach(({ hook, id }) => Hooks.off(hook, id));
    this.hooks = [];
  }
}
