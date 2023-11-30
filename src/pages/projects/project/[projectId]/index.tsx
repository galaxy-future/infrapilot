import {
  type ReactNode,
  useEffect, useState
} from 'react';
import {
  Typography,
  type TabsProps, Tabs,
  Card
} from 'antd';
import { useRouter } from 'next/router';

import { getProjectById } from '@/api/project';
import Services from '@/components/projects/project/Services';
import Deployments from '@/components/projects/project/Deployments';

const items = (prop: any): TabsProps['items'] => [
  {
    key: 'services',
    label: '服务',
    children: <Services />
  },
  {
    key: 'deployments',
    label: '部署',
    children: <Deployments />
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
  await getProjectById({
    project_id: prop.router.query.projectId
  })
    .then(response => {
      if (response.code !== 200) return;
      prop.setStateDetail(response.data);
    })
    .catch(e => console.log(e));

export default function Project(): ReactNode {
  const router = useRouter();
  const [ stateTab, setStateTab ] = useState<string>((router.query.tab as string) || 'services');
  const [ stateDetail, setStateDetail ] = useState<any>(null);
  const propData = {
    router,
    stateTab, setStateTab,
    stateDetail, setStateDetail
  };
  
  useEffect(() => {
    getDetail(propData);
  }, [ router.query.projectId ]);
  
  return (
    <Card>
      <Typography.Title className="page_title"
                        level={ 2 }>
        { stateDetail?.project_name || '项目名称' }
      </Typography.Title>
      <Tabs activeKey={ stateTab } items={ items(propData) }
            onChange={ k => changeTab(propData, k) } />
    </Card>
  );
}