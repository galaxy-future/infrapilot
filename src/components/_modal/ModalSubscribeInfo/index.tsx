import {
  type ReactNode,
  useEffect, useState
} from 'react';
import {
  useSelector, useDispatch
} from 'react-redux';
import {
  type DescriptionsProps, Descriptions,
  Space, Button,
  Modal, message
} from 'antd';
import DayJS from 'dayjs';

import { type StoreType, asyncThunk } from '@/store';
import Style from './index.module.css';

const descriptionList = (prop: any): DescriptionsProps['items'] => [
  {
    key: '1',
    label: '过期时间',
    span: 24,
    children: prop.platform.subscribe.expire
      ? DayJS(prop.platform.subscribe.expire * 1000).format('YYYY.MM.DD HH:mm:ss')
      : '-'
  },
  {
    key: '3',
    label: '人员',
    span: 12,
    children: `${ prop.platform.subscribe.person.count } / ${ prop.platform.subscribe.person.total }`
  },
  {
    key: '2',
    label: '应用',
    span: 12,
    children: `${ prop.platform.subscribe.app.count } / ${ prop.platform.subscribe.app.total }`
  }
];
const clickOk = async (prop: any) => {
  const { setStateOpen, okFN } = prop;
  setStateOpen(false);
  okFN();
};
const clickCancel = (prop: any) => {
  const { setStateOpen, setStateInfo } = prop;
  
  setStateOpen(false);
  setStateInfo(null);
};


export default function ModalSubscribeInfo(prop: any): ReactNode {
  const {
    stateOpen, setStateOpen,
    okFN
  } = prop;
  const { platform } = useSelector((state: StoreType) => state);
  const storeDispatch = useDispatch();
  const [ stateInfo, setStateInfo ] = useState<any>(null);
  const propData = {
    ...prop,
    platform,
    stateOpen, setStateOpen,
    stateInfo, setStateInfo
  };
  
  useEffect(() => {
    if (!stateOpen) return;
    storeDispatch(asyncThunk.thunkSubscribe() as any);
  }, [ stateOpen ]);
  
  return <Modal title="订阅信息" footer={ null }
                open={ stateOpen } onCancel={ () => clickCancel(propData) }>
    <Descriptions className={ Style.description }
                  items={ descriptionList(propData) }
                  colon={ false } column={ 24 } />
    <Space className="page_margin" size="small">
      <Button type="primary"
              onClick={ () => clickOk(propData) }>
        续订
      </Button>
      <Button onClick={ () => clickCancel(propData) }>
        取消
      </Button>
    </Space>
  </Modal>;
}