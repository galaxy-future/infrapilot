import {
  type ReactNode,
  useState, useEffect
} from 'react';
import { useRouter } from 'next/router';
import {
  type TabsProps, Tabs,
  Card, Typography,
} from 'antd';

import UnitMine from '@/components/unit/Mine';
import UnitPublic from '@/components/unit/Public';
import Style from './index.module.css';

const tabItem = (prop: any): TabsProps['items'] => [
  {
    key: 'mine',
    label: '自定义Unit',
    children: <UnitMine />
  },
  {
    key: 'public',
    label: '系统Unit',
    children: <UnitPublic />
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

export default function Units(prop: any): ReactNode {
  const router = useRouter();
  const [ stateTab, setStateTab ] = useState<string>((router.query.tab as string) || 'mine');
  const propData = {
    router,
    stateTab, setStateTab
  };
  
  return <Card>
    <Typography.Title className="page_title"
                      level={ 2 }>
      Unit
    </Typography.Title>
    <Tabs activeKey={ stateTab } items={ tabItem(propData) }
          onChange={ k => changeTab(propData, k) } />
  </Card>;
}