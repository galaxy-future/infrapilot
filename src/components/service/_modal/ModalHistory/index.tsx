import {
  type ReactNode, useEffect,
  useState
} from 'react';
import {
  type TableProps, Table,
  Space, Button,
  Modal
} from 'antd';
import DayJS from 'dayjs';

import {
  getVersionList
} from '@/api/service';
import ModalHistoryDetail from '@/components/service/_modal/ModalHistoryDetail';
import Style from './index.module.css';

interface TableItemType {
  key: string;
  version: string;
  create_at: string;
}

const tableColumn = (prop: any): TableProps<TableItemType>['columns'] => [
  {
    dataIndex: 'version',
    title: '服务版本',
    width: 180,
    render: (v: string, record: any) =>
      <Button className="no_padding ellipsis" size="small" type="link"
              onClick={ () => clickDetail(prop, record) }>
        { v }
      </Button>
  },
  {
    dataIndex: 'create_at',
    title: '发布时间',
    width: 160,
    render: v => v
      ? DayJS(v * 1000).format('YYYY.MM.DD HH:mm:ss')
      : '-'
  },
  {
    title: '操作',
    width: 50,
    ellipsis: true,
    render: v =>
      <Space>
        <Button className="no_padding" size="small" type="link"
                onClick={ () => clickDetail(prop, v) }>
          查看
        </Button>
      </Space>
  }
];
const clickCancel = (prop: any) => {
  const {
    setStateOpen, setStateList,
    setStateModalData
  } = prop;
  
  setStateOpen(false);
  setStateList([]);
  setStateModalData({
    id: '',
    version: ''
  });
};
const clickDetail = async (prop: any, item: any) => {
  const {
    setStateModal,
    stateModalData, setStateModalData
  } = prop;
  
  setStateModal(true);
  setStateModalData({
    ...stateModalData,
    version: item.version
  });
};
const requestVersionList = async (prop: any) =>
  await getVersionList({
    service_id: prop.stateModalData.id
  })
    .then(response => {
      if (response.code !== 200) return;
      prop.setStateList(response.data.map(v => ({
        ...v,
        key: v.version
      })));
    })
    .catch(e => console.log(e));

export default function ModalHistory(prop: any): ReactNode {
  const {
    detail,
    stateOpen, setStateOpen
  } = prop;
  const [ stateList, setStateList ] = useState<any[]>([]);
  const [ stateModal, setStateModal ] = useState<boolean>(false);
  const [ stateModalData, setStateModalData ] = useState({
    id: '',
    version: ''
  });
  const propData = {
    ...prop,
    stateList, setStateList,
    stateModal, setStateModal,
    stateModalData, setStateModalData
  };
  
  useEffect(() => {
    if (!stateOpen) return;
    
    setStateModalData({
      id: detail.service_id,
      version: ''
    });
  }, [ stateOpen ]);
  useEffect(() => {
    if (!stateModalData.id) return;
    
    requestVersionList(propData);
  }, [ stateModalData.id ]);
  
  return <>
    <Modal title="历史版本" footer={ null }
           open={ stateOpen } onCancel={ () => clickCancel(propData) }>
      <Table className={ Style.table } size="small"
             columns={ tableColumn(propData) } dataSource={ stateList }
             scroll={ { y: 200 } } pagination={ false } />
    </Modal>
    <ModalHistoryDetail data={ stateModalData }
                        stateOpen={ stateModal } setStateOpen={ setStateModal } />
  </>;
}