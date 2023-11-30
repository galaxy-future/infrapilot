import React, {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  Provider,
  useSelector, useDispatch
} from 'react-redux';
import {
  useRouter
} from 'next/router';
import Head from 'next/head'
import { ConfigProvider } from 'antd';
import Locale from 'antd/lib/locale/zh_CN';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { SSO } from '@/utils/public';
import { List } from '@/utils/platform';
import Store, { type StoreType, asyncThunk } from '@/store';
import { getUserTP } from '@/api/user';
import Layout from '@/components/Layout';
import '@/pages/globals.css';

let setTime: NodeJS.Timeout | null = null;

const Container = (props: any): ReactNode => {
  const { user, team } = useSelector((state: StoreType) => state);
  const storeDispatch = useDispatch();
  const router = useRouter();
  const [ active, setActive ] = useState<boolean>(false);
  const [ show, setShow ] = useState<boolean>(false);
  
  const handleSetTimeTask = () => {
    storeDispatch(asyncThunk.thunkSubscribe() as any);
    storeDispatch(asyncThunk.thunkGetBalance() as any);
  };
  
  useEffect(() => {
    storeDispatch({ type: 'user/getUserInfo' });
    storeDispatch({ type: 'team/getTeamInfo' });
  }, []);
  useEffect(() => {
    if (SSO.check()) {
      setActive(true);
    } else {
      SSO.login();
    }
  }, [ user.token ]);
  useEffect(() => {
    if (!active) return;
    
    Promise.all([
        getUserTP(),
        List.team()
      ])
      .then((data: any[]) => {
        data[0].code === 200 &&
        storeDispatch({
          type: 'team/setTeamPerson',
          payload: data[0].data
        });
        storeDispatch({
          type: 'team/setTeamInfo',
          payload: data[1]
        });
      })
      .finally(() => {
        setShow(true);
      });
  }, [ active ]);
  useEffect(() => {
    if (!show) return;
    
    console.log('/////-Store-Start');
    console.log('User：', user);
    console.log('Team：', team);
    console.log('/////-Store-End');
    
    handleSetTimeTask();
    setTime = setInterval(() => {
      handleSetTimeTask();
    }, 30000);
    
    return () => {
      setTime && clearInterval(setTime);
    };
  }, [ show ]);
  // useEffect(() => {
  //     router.pathname === '/' && router.push('/projects');
  // }, [ router.pathname ]);
  useEffect(() => {
    if (!show) return;
    
    console.log('切换团队', team.id, team.name);
  }, [ team.id ]);
  
  return <>
    {
      show
        ? <Layout { ...props } />
        : <></>
    }
  </>;
};

export default function App(props: any): ReactNode {
  const getLayout = props.Component.getLayout ?? ((page: ReactNode) => page);
  
  return getLayout(
    <ConfigProvider locale={ Locale }>
      <Provider store={ Store }>
        <Head>
          <meta name="viewport"
                content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />
          <title>星汉未来托管平台</title>
        </Head>
        <Container { ...props } />
      </Provider>
    </ConfigProvider>
  );
}