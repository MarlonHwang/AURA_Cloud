export class SequencerCommands {
    async addNote(track: string, step: number): Promise<string> {
        return `Note added to ${track} at step ${step}`;
    }
}
