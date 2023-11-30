import { ServiceAccessEnum, ServiceEnvTypeEnum } from '@/lib/enums/service';

export interface ServiceStatus {
  label: string;
  value: any;
  color?: string;
}

export const ServiceAccessDict: ServiceStatus[] = [
  {
    label: '服务内部',
    value: ServiceAccessEnum.Internal
  },
  {
    label: '服务之间',
    value: ServiceAccessEnum.External
  }
];

export const ServiceEnvTypeDict: ServiceStatus[] = [
  {
    label: '自定义',
    value: ServiceEnvTypeEnum.Customize
  },
  {
    label: '引入配置项',
    value: ServiceEnvTypeEnum.Config
  },
  {
    label: '系统变量',
    value: ServiceEnvTypeEnum.System
  }
];