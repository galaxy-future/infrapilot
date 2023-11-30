export enum UnitStateEnum {
  INIT = 1,
  COMPILING = 2,
  AVAILABLE = 3,
  NO_AVAILABLE = 4
}

export enum UnitTypeEnum {
  K8S = 'k8s',
  ECS = 'ecs'
}

export enum UnitProcessorEnum {
  CPU = 'cpu',
  GPU = 'gpu'
}

export enum UnitGPUTypeEnum {
  Low = 'ecs.gn6i-c4g1.xlarge',
  High = 'ecs.gn6v-c8g1.2xlarge'
}

export enum UnitHealthEnum {
  HTTP = 'http',
  TCP = 'tcp'
}

export enum UnitBuildFormEnum {
  External = 1,
  Internal = 0
}

export enum UnitBuildEnum {
  Image = 'image',
  Git = 'git'
}

export enum UnitImageEnum {
  Demo = 'demo',
  Public = 'public',
  Model = 'common-gpu'
}

export enum UnitProtocolEnum {
  TCP = 'tcp',
  UDP = 'udp'
}

export enum UnitVolumeTypeEnum {
  NAS = 'nas'
}