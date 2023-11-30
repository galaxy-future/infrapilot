import { useEffect, useState } from 'react';
import { Tabs, Form, Select, Empty } from 'antd';
import { useRouter } from 'next/router';

import { getDeploymentInfo } from '@/api/deployment';
import Style from './index.module.css';

const grafana = () => {
    let path: string = 'http://172.16.16.181/grafana/d/';
    
    switch (process.env.ENV_MODE) {
      case 'platform':
        path = '/grafana/d/';
        break;
      case 'production':
        path = `${ location.protocol }//${ location.hostname }/grafana/d/`
        break;
      case 'development':
      default:
        break;
    }
    
    return path;
  },
  grafanaParam = '?kiosk=tv&kiosk&orgId=1&from=now-5m&to=now&refresh=10s&var-ip=.*',
  items = [
    {
      key: '1',
      label: '决策指标',
      path: 'A4W6J59nz/decision-ck',
    },
    {
      key: '2',
      label: '业务指标',
      path: 'OG7Xx597z/business-ck',
    },
    {
      key: '3',
      label: '物理指标',
      path: '6Gbrx59nk/basics-k8s-ck',
    },
  ];
let setTime: NodeJS.Timeout | null = null;

export default function Monitor() {
  const { query } = useRouter();
  const [ serverInfo, setServerInfo ] = useState<any>(null);
  const [ unitList, setUnitList ] = useState<any[]>([]);
  const [ data, setData ] = useState({
    serverID: '',
    namespaceID: '',
    deploymentID: ''
  });
  const [ form ] = Form.useForm();
  
  const getDeploymentList = () => {
    if (!query.serviceId || setTime) return;
    
    getDeploymentInfo({ service_id: query.serviceId })
      .then((res) => setServerInfo(res.data))
      .catch(e => console.log(e));
    
    setTime = setTimeout(() => {
      setTime = null;
    }, 30000);
  };
  const changeServer = () => {
    if (!serverInfo) return;
    
    setUnitList(
      serverInfo.deployments?.map((v: any) => ({
        label: v.unit_name,
        value: v.deployment_id,
      })) || []
    );
    
    setData({
      serverID: serverInfo?.deploy_service_id || '',
      namespaceID: serverInfo?.namespace_id || '',
      deploymentID: '',
    });
  };
  const changeUnit = () => {
    setData({
      serverID: data.serverID,
      namespaceID: data.namespaceID,
      deploymentID: form.getFieldValue('unit'),
    });
  };
  
  useEffect(() => {
    getDeploymentList();
    
    return () => {
      if (setTime) {
        clearTimeout(setTime);
        setTime = null;
      }
    };
  }, [ query.serviceId ]);
  useEffect(() => {
    form.setFieldsValue({
      server: serverInfo ? query.serviceId || serverInfo[0].value : undefined,
    });
    changeServer();
  }, [ serverInfo ]);
  useEffect(() => {
    form.setFieldsValue({
      unit: unitList.length > 0 ? unitList[0].value : undefined,
    });
    changeUnit();
  }, [ unitList ]);
  
  return <div className={ Style.page }>
    <Form className={ Style.form }
          name="form" form={ form } layout="inline">
      <Form.Item label="Unit" name="unit">
        <Select className={ Style.select }
                options={ unitList } onChange={ changeUnit } />
      </Form.Item>
    </Form>
    {
      serverInfo && unitList.length > 0
        ? <Tabs type="card" size="middle"
                defaultActiveKey="1"
                items={ items.map((v) => ({
                  ...v,
                  children: <iframe className={ Style.iframe }
                                    src={
                                      grafana() + v.path + grafanaParam +
                                      `&var-service_name=${ data.serverID }&var-running_env_name=${ data.namespaceID }&var-logic_cluster_name=${ data.deploymentID }`
                                    } />
                })) } />
        : <Empty />
    }
  </div>;
}