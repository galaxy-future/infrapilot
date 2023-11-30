import { UnitBuildEnum, UnitGPUTypeEnum, UnitImageEnum, UnitBuildFormEnum } from '@/lib/enums/unit';

export interface UnitStatusInterface {
  label: string;
  value: any;
}

export const UnitBuildForm = [
  {
    label: '后端',
    value: UnitBuildFormEnum.Internal
  },
  {
    label: '外部依赖',
    value: UnitBuildFormEnum.External
  }
];


export const UnitBuildDist = [
  {
    label: '镜像',
    value: UnitBuildEnum.Image
  },
  {
    label: 'Git',
    value: UnitBuildEnum.Git
  }
];

export const UnitGPUDist = [
  {
    label: '低配',
    value: UnitGPUTypeEnum.Low
  },
  {
    label: '高配',
    value: UnitGPUTypeEnum.High
  }
];

export const UnitImageDist = [
  {
    label: '公共镜像',
    value: UnitImageEnum.Demo
  },
  {
    label: '自定义镜像',
    value: UnitImageEnum.Public
  },
  {
    label: '大模型镜像',
    value: UnitImageEnum.Model,
    disabled: true
  }
];