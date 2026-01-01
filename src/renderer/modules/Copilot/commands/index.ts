import { TransportCommands } from './transport';
import { MixerCommands } from './mixer';
import { SequencerCommands } from './sequencer';

/**
 * Command Registry
 * 모든 하위 커맨드 모듈을 통합 관리
 */
export class CommandRegistry {
    public transport: TransportCommands;
    public mixer: MixerCommands;
    public sequencer: SequencerCommands;

    constructor() {
        this.transport = new TransportCommands();
        this.mixer = new MixerCommands();
        this.sequencer = new SequencerCommands();
    }
}

export const commands = new CommandRegistry();
