import { type CalcResult } from "./socket";

export interface ServerToClientEvents {
  auth: ({ id, url }: { id: string, url: string }) => void;
  authed: (success: boolean) => void;
  session: (code: string) => void;
  sessionUpdate: (data: {
    data: CalcResult | null,
    scramTemp: number | null,
    isPlaying: boolean,
    simTime: {
      time: number,
      at: number
    }
  }) => void;
  userList: (users: string[]) => void;
}

export interface ClientToServerEvents {
  calc: (id: string | null, scramTemp: number, ack: (res: CalcResult) => void) => void;
  joinSession: (id: string | null, code: string, ack: (res: {
    data: CalcResult,
    scramTemp: number,
    isPlaying: boolean,
    simTime: {
      time: number,
      at: number
    }
  }) => void) => void;
  newAuth: (id: string | null) => void;
  auth: ({ id, code }: { id: string, code?: string }) => void;
  session: (id: string | null, scramTemp: number, code: string | null, ack: ({
    code, data
  }: {
    code: string, data: CalcResult, startTime: number
  }) => void) => void;
  sessionUpdate: (id: string | null, code: string, data: {
    scramTemp: number | null,
    simTime: {
      time: number,
      at: number
    },
    isPlaying: boolean
  }) => void;
}