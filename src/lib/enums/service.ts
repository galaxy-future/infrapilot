export enum ServiceStateEnum {
  Default = 0,
  INIT = 1,
  DEPLOYING = 2,
  RUNNING = 3,
  // CHANGING = 4,
  ERROR = 5,
  STOPPED = 6,
  STOPPING = 7,
  // RESTARTING = 8,
  PAUSED = 9,
  PAUSING = 10,
  RESUMING = 11,
  UPDATING = 12
}

export enum ServiceAccessEnum {
  Internal = 'internal',
  External = 'external'
}

export enum ServiceEnvTypeEnum {
  Customize,
  Config,
  System
}