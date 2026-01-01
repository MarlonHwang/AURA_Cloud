export class SamplerCommands {
    async loadSample(file: string): Promise<string> {
        return `Sample loaded: ${file}`;
    }
}
