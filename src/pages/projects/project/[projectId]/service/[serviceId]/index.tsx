import {
  type ReactNode,
  useEffect, useState
} from 'react';
import { useRouter } from 'next/router';
import {
  type TabsProps, Tabs,
  Card, Typography,
  Row, Col, Space,
  Tag, Badge, Button,
  message
} from 'antd';

import { getServiceById } from '@/api/service';
import {
  getDeploymentInfo,
  deploy, resume,
  pause, stop
} from '@/api/deployment';
import { ServiceStateEnum } from '@/lib/enums/service';
import { ServiceStateMap } from '@/lib/maps/service';
import useModalPay from '@/hooks/useModalPay';
import Detail from '@/components/service/Detail';
import Deployment from '@/components/service/Deployment';
import Monitor from '@/components/service/Monitor';
import ModalVersion from '@/components/service/_modal/ModalVersion';

const items = (prop: any): TabsProps['items'] => [
  {
    key: 'detail',
    label: '配置',
    children: <Detail detail={ prop.stateDetail }
                      updateDetail={ () => getDetail(prop) } />
  },
  {
    key: 'deployment',
    label: '部署',
    children: <Deployment deployment={ prop.stateDeployment } />
  },
  {
    key: 'monitor',
    label: '监控',
    children: <Monitor />
  }
];
const changeTab = (prop: any, key: string) => {
  const {
    router,
    setStateTab
  } = prop;
  
  router.push({
    query: {
      ...router.query,
      tab: key
    }
  });
  setStateTab(key);
};
const getDetail = async (prop: any) =>
  await getServiceById({
    service_id: prop.router.query.serviceId
  })
    .then(response => {
      if (response.code !== 200) return;
      prop.setStateDetail(response.data);
    })
    .catch(e => console.log(e));
const getDeployment = (prop: any, time: number = 3000) => {
  const request = async () =>
    await getDeploymentInfo({
      service_id: prop.router.query.serviceId,
    })
      .then(response => {
        if (response.code !== 200) return;
        
        console.log('部署信息', time);
        prop.setStateDeployment(response.data);
        
        if ((response.data.service_status === ServiceStateEnum.DEPLOYING ||
             response.data.service_status === ServiceStateEnum.STOPPING ||
             response.data.service_status === ServiceStateEnum.PAUSING ||
             response.data.service_status === ServiceStateEnum.RESUMING ||
             response.data.service_status === ServiceStateEnum.UPDATING) &&
            time !== 3000) {
          getDeployment(prop);
        } else if ((response.data.service_status === ServiceStateEnum.INIT ||
                    response.data.service_status === ServiceStateEnum.RUNNING ||
                    response.data.service_status === ServiceStateEnum.ERROR ||
                    response.data.service_status === ServiceStateEnum.STOPPED ||
                    response.data.service_status === ServiceStateEnum.PAUSED) &&
                   time !== 10000) {
          getDeployment(prop, 10000);
        }
      })
      .catch(e => console.log(e));
  
  setTime && clearInterval(setTime);
  setTime = setInterval(() => {
    request();
  }, time);
  request();
};
const deployService = async (prop: any) =>
  await deploy({
    service_id: prop.router.query.serviceId
  })
    .then(response => {
      prop.modalPay(response);
      
      if (response.code !== 200) return;
      getDeployment(prop);
      message.loading('正在部署');
    })
    .catch(e => console.log(e));
const resumeService = async (prop: any) =>
  await resume({
    service_id: prop.router.query.serviceId
  })
    .then(response => {
      prop.modalPay(response);
      
      if (response.code !== 200) return;
      getDeployment(prop);
      message.loading('正在恢复');
    })
    .catch(e => console.log(e));
const pauseService = async (prop: any) =>
  await pause({
    service_id: prop.router.query.serviceId
  })
    .then(response => {
      if (response.code !== 200) return;
      getDeployment(prop);
      message.loading('正在暂停');
    })
    .catch(e => console.log(e));
const stopService = async (prop: any) =>
  await stop({
    service_id: prop.router.query.serviceId
  })
    .then(response => {
      if (response.code !== 200) return;
      getDeployment(prop);
      message.loading('正在停止');
    })
    .catch(e => console.log(e));
let setTime: NodeJS.Timeout | null = null;

export default function Service(): ReactNode {
  const router = useRouter();
  const modalPay = useModalPay();
  const [ stateTab, setStateTab ] = useState<string>((router.query.tab as string) || 'deployment');
  const [ stateDetail, setStateDetail ] = useState<any>(null);
  const [ stateDeployment, setStateDeployment ] = useState<any>(null);
  const [ stateModalVersion, setStateModalVersion ] = useState<boolean>(false);
  const propData = {
    router, modalPay,
    stateTab, setStateTab,
    stateDetail, setStateDetail,
    stateDeployment, setStateDeployment,
    stateModalVersion, setStateModalVersion
  };
  
  useEffect(() => {
    if (router.query.serviceId === 'create') return;
    
    getDetail(propData);
    getDeployment(propData);
    
    return () => {
      setTime && clearInterval(setTime);
    };
  }, [ router.query.serviceId ]);
  
  return <>
    <Card>
      <Row justify="space-between">
        <Col>
          <Space className="align_bottom"
                 size="middle">
            <Typography.Title className="page_title"
                              level={ 2 }>
              {
                router.query.serviceId === 'create'
                  ? '创建服务'
                  : (stateDetail?.service_name || '服务名称')
              }
            </Typography.Title>
            {
              (router.query.serviceId !== 'create' && stateDeployment) &&
              <Tag color={ ServiceStateMap[stateDeployment.service_status].color }>
                <Badge status={ ServiceStateMap[stateDeployment.service_status].color }
                       text={ ServiceStateMap[stateDeployment.service_status].label } />
              </Tag>
            }
          </Space>
        </Col>
        {
          (router.query.serviceId !== 'create' && stateDeployment) &&
          <Col>
            <Space>
              <Button type="primary"
                      disabled={
          stateDeployment.service_status !== ServiceStateEnum.INIT &&
          stateDeployment.service_status !== ServiceStateEnum.STOPPED &&
          stateDeployment.service_status !== ServiceStateEnum.RUNNING &&
          stateDeployment.service_status !== ServiceStateEnum.ERROR
                      }
                      onClick={ () => deployService(propData) }>
                {
                  stateDeployment.service_status !== ServiceStateEnum.RUNNING &&
                  stateDeployment.service_status !== ServiceStateEnum.ERROR
                    ? '部署'
                    : '重新部署'
                }
              </Button>
              <Button disabled={ stateDeployment.service_status !== ServiceStateEnum.RUNNING }
                      onClick={ () => pauseService(propData) }>
                暂停
              </Button>
              <Button disabled={
          stateDeployment.service_status !== ServiceStateEnum.RUNNING &&
          stateDeployment.service_status !== ServiceStateEnum.ERROR
              }
                      onClick={ () => setStateModalVersion(true) }>
                回滚
              </Button>
              <Button disabled={ stateDeployment.service_status !== ServiceStateEnum.PAUSED }
                      onClick={ () => resumeService(propData) }>
                恢复
              </Button>
              <Button disabled={
          stateDeployment.service_status !== ServiceStateEnum.RUNNING &&
          stateDeployment.service_status !== ServiceStateEnum.PAUSED &&
          stateDeployment.service_status !== ServiceStateEnum.ERROR
              }
                      onClick={ () => stopService(propData) } danger>
                停止
              </Button>
            </Space>
          </Col>
        }
      </Row>
      {
        router.query.serviceId !== 'create'
          ? <Tabs activeKey={ stateTab } items={ items(propData) }
                  onChange={ k => changeTab(propData, k) } />
          : <Detail detail={ stateDetail }
                    updateDetail={ () => getDetail(propData) } />
      }
    </Card>
    <ModalVersion detail={ stateDetail }
                  stateOpen={ stateModalVersion } setStateOpen={ setStateModalVersion }
                  updateData={ () => getDeployment(propData) } />
  </>;
}