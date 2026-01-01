export class EffectsCommands {
    async addEffect(type: string): Promise<string> {
        return `Effect added: ${type}`;
    }
}
