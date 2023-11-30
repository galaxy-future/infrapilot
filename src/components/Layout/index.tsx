import React, {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  useRouter
} from 'next/router';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import {
  Layout
} from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';

import type { StoreType } from '@/store';
import Tip from '@/components/Layout/Tip';
import Top from '@/components/Layout/Top';
import Personal from '@/components/Layout/Personal';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import Menu from '@/components/Layout/Menu';
import Footer from '@/components/Layout/Footer';
import Style from './index.module.css';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode;
};
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function PublicLayout(prop: AppPropsWithLayout): ReactNode {
  const router = useRouter();
  const { platform, team } = useSelector((state: StoreType) => state);
  const [ stateShowSider, setStateShowSider ] = useState<boolean>(false);
  const [ stateShowBreadcrumb, setStateShowBreadcrumb ] = useState<boolean>(false);
  
  useEffect(() => {
    setStateShowBreadcrumb(
      !platform.router.find(v => v.href === router.pathname) &&
      !(router.pathname === '/projects/project/[projectId]' && team.id === team.person.id)
    );
  }, [ router.pathname ]);
  
  return <Layout className={ Style.layout }>
    <Layout.Header className={ Style.header }>
      <Top />
      <Tip />
    </Layout.Header>
    <Layout className={ Style.content }>
      <Layout.Sider className={ Style.sider } width={ 220 }
                    collapsible={ true } collapsedWidth={ 70 }
                    trigger={ stateShowSider ? <MenuUnfoldOutlined /> : <MenuFoldOutlined /> }
                    onCollapse={ (collapsed, type) => setStateShowSider(collapsed) }>
        {
          !stateShowSider &&
          <Personal />
        }
        <Menu />
      </Layout.Sider>
      <Layout>
        {
          stateShowBreadcrumb
            ? <Layout.Header className={ Style.breadcrumb }>
              <Breadcrumb />
            </Layout.Header>
            : <></>
        }
        <Layout.Content>
          <div className={ Style.box_content }>
            <div className={ Style.container + ' ' + (stateShowBreadcrumb ? Style.has_breadcrumb : '') }>
              <prop.Component { ...prop.pageProps } />
            </div>
            <Footer />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  </Layout>;
}