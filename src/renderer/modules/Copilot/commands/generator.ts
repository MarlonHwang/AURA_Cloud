export class GeneratorCommands {
    async generateBassline(style: string): Promise<string> {
        return `Generating ${style} bassline...`;
    }
}
