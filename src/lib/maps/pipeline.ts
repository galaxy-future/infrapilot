import { DeploymentStateInterface } from '@/lib/interfaces/deployment';
import { PipelineStateEnum, PipelineTypeEnum } from '@/lib/enums/pipeline';

export const PipelineStatusMap: { [key in PipelineStateEnum]: DeploymentStateInterface } = {
  [PipelineStateEnum.INIT]: {
    label: '初始化',
    value: 'warning'
  },
  [PipelineStateEnum.EXECUTING]: {
    label: '执行中',
    value: 'processing'
  },
  [PipelineStateEnum.PARTIAL_SUCCESS]: {
    label: '部分成功',
    value: 'warning'
  },
  [PipelineStateEnum.SUCCESS]: {
    label: '成功',
    value: 'success'
  },
  [PipelineStateEnum.FAILURE]: {
    label: '失败',
    value: 'error'
  }
};

export const PipelineTypeMap: { [key in PipelineTypeEnum]: string } = {
  [PipelineTypeEnum.DEPLOY]: '部署',
  [PipelineTypeEnum.STOP]: '停止',
  [PipelineTypeEnum.PAUSE]: '暂停',
  [PipelineTypeEnum.CONTINUE]: '继续',
  [PipelineTypeEnum.UPDATE]: '更新',
  [PipelineTypeEnum.ROLLBACK]: '回滚',
  [PipelineTypeEnum.AUTO_PAUSE]: '自动暂停',
  [PipelineTypeEnum.SCALE_UP]: '扩容',
  [PipelineTypeEnum.SCALE_DOWN]: '缩容',
  [PipelineTypeEnum.SPEC_DETECT]: '规格压测'
};