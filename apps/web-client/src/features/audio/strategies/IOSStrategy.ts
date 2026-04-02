// import type { AudioStrategy } from "@/features/audio/audio.types";

// export class IOSStrategy implements AudioStrategy {
//     readonly strategy = "ios-stream";

//     private internalPlayer = new Audio();
//     private dest: MediaStreamAudioDestinationNode | null = null;

//     connect(element: HTMLAudioElement, ctx: AudioContext) {
//         this.dest = ctx.createMediaStreamDestination();
//         element.srcObject = this.dest.stream;
//     }

//     async preparePlayback(): Promise<void> {
//         return;
//     }
// }