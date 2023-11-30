import {
  type ReactNode,
  Fragment
} from 'react';
import Link from 'next/link';
import {
  type DescriptionsProps, Descriptions,
  Divider, Space,
  Badge, Tooltip, Button
} from 'antd';
import {
  ExclamationOutlined
} from '@ant-design/icons';

import { ServiceStateEnum } from '@/lib/enums/service';
import { ServiceStateMap } from '@/lib/maps/service';
import PipelineList from '@/components/service/Deployment/PipelineList';
import InstanceList from '@/components/service/Deployment/InstanceList';
import Style from './index.module.css';

const descriptionList = (prop: any): DescriptionsProps['items'] => [
  {
    label: '服务ID',
    span: 8,
    children: prop.deployment.service_id || '-'
  },
  {
    label: '服务名称',
    span: 8,
    children: prop.deployment.service_name || '-'
  },
  {
    label: '服务状态',
    span: 8,
    children:
      <Badge className="run_state"
             status={ ServiceStateMap[prop.deployment.service_status]?.color || 'default' }
             text={
               <>
                 { ServiceStateMap[prop.deployment.service_status]?.label || '-' }
                 {
                   prop.deployment.service_status === ServiceStateEnum.ERROR &&
                   <>
                     <Tooltip placement="left" overlayClassName="tooltip_code"
                              title={ prop.deployment.exception_msg }>
                       <Button type="text" size="small" shape="circle"
                               icon={ <ExclamationOutlined /> } danger />
                     </Tooltip>
                     {/*<Tooltip placement='bottom'*/ }
                     {/*         title='重试'>*/ }
                     {/*  <Button type='text' size='small' shape='circle'*/ }
                     {/*          icon={ <RedoOutlined rotate={ 180 } /> }*/ }
                     {/*          onClick={} />*/ }
                     {/*</Tooltip>*/ }
                   </>
                 }
               </>
             } />
  },
  {
    label: '服务类型',
    span: 8,
    children: '-'
  },
  {
    label: '创建时间',
    span: 8,
    children: prop.deployment.operate_time || '-'
  },
  {
    label: '操作者',
    span: 8,
    children: prop.deployment.operator || '-'
  },
  {
    label: '内部地址',
    span: 24,
    children: (
                prop.deployment.service_status === ServiceStateEnum.RUNNING ||
                prop.deployment.service_status === ServiceStateEnum.PAUSED
              ) && prop.deployment.internal_address?.host
      ? <Link href={ prop.deployment.internal_address?.host + (prop.deployment.internal_address?.port ? `:${ prop.deployment.internal_address?.port }` : '') }
              target="_blank">
        { prop.deployment.internal_address?.host + (prop.deployment.internal_address?.port ? `:${ prop.deployment.internal_address?.port }` : '') }
      </Link>
      : '-'
  },
  {
    label: '公网地址',
    span: 24,
    children: prop.deployment.address
      ? <Link href={ prop.deployment.address }
              target="_blank">
        { prop.deployment.address }
      </Link>
      : '-'
  },
  {
    label: 'Unit',
    span: 24,
    children: prop.deployment.units.length > 0
      ? <Space size="small">
        {
          prop.deployment.units.map(v =>
            <Link key={ v.unit_id } href={ `/units/unit/${ v.unit_id }` }
                  target="_blank">
              { v.unit_name }
            </Link>
          )
        }
      </Space>
      : '-'
  }
];

export default function Deployment(prop: any): ReactNode {
  const { deployment } = prop;
  
  return <>
    {
      deployment &&
      <Descriptions className={ Style.descriptions }
                    title="基础信息" size="small" items={ descriptionList(prop) }
                    column={ 24 } colon={ false } bordered />
    }
    <Divider />
    <PipelineList detail={ deployment } />
    <Divider />
    <InstanceList detail={ deployment } />
  </>;
}