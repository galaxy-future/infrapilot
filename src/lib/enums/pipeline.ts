export enum PipelineStateEnum {
  INIT = 1,
  EXECUTING = 2,
  PARTIAL_SUCCESS = 3,
  SUCCESS = 4,
  FAILURE = 5,
}

export enum PipelineTypeEnum {
  DEPLOY = 0,
  STOP = 1,
  PAUSE = 2,
  CONTINUE = 3,
  UPDATE = 4,
  ROLLBACK = 5,
  AUTO_PAUSE = 6,
  SCALE_UP = 7,
  SCALE_DOWN = 8,
  SPEC_DETECT = 9
}