import { ServiceStatus } from '@/lib/interfaces/service';
import { ServiceStateEnum } from '@/lib/enums/service';

export const ServiceStateMap: { [key in ServiceStateEnum]: ServiceStatus } = {
  [ServiceStateEnum.Default]: {
    label: '未部署',
    value: 'init',
    color: 'default'
  },
  [ServiceStateEnum.INIT]: {
    label: '未部署',
    value: 'init',
    color: 'default'
  },
  [ServiceStateEnum.DEPLOYING]: {
    label: '部署中',
    value: 'deploying',
    color: 'processing'
  },
  [ServiceStateEnum.RUNNING]: {
    label: '运行中',
    value: 'running',
    color: 'success'
  },
  [ServiceStateEnum.ERROR]: {
    label: '错误',
    value: 'error',
    color: 'error'
  },
  [ServiceStateEnum.STOPPED]: {
    label: '已停止',
    value: 'stopped',
    color: 'error'
  },
  [ServiceStateEnum.STOPPING]: {
    label: '停止中',
    value: 'stopping',
    color: 'processing'
  },
  [ServiceStateEnum.PAUSED]: {
    label: '已暂停',
    value: 'paused',
    color: 'warning'
  },
  [ServiceStateEnum.PAUSING]: {
    label: '暂停中',
    value: 'pausing',
    color: 'processing'
  },
  [ServiceStateEnum.RESUMING]: {
    label: '恢复中',
    value: 'resuming',
    color: 'processing'
  },
  [ServiceStateEnum.UPDATING]: {
    label: '更新中',
    value: 'updating',
    color: 'processing'
  },
};