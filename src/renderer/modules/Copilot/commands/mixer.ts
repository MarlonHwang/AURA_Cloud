export class MixerCommands {
    async setVolume(trackId: string, level: number): Promise<string> {
        return `Track ${trackId} volume set to ${level}`;
    }
}
