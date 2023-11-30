import {
  type ReactNode,
  useState, useEffect
} from 'react';
import { useRouter } from 'next/router';
import {
  Badge,
  type TableProps, Table,
  Typography, Space, Button
} from 'antd';
import DayJS from 'dayjs';

import { getServicePipeline } from '@/api/deployment';
import { PipelineStatusMap, PipelineTypeMap } from '@/lib/maps/pipeline';
import { PipelineTypeEnum } from '@/lib/enums/pipeline';
import ModalHistoryDetail from '@/components/service/_modal/ModalHistoryDetail';
import ModalLogPipeline from '@/components/service/_modal/ModalLogPipeline';
import Style from './index.module.css';

type DataType = {
  key: string;
  pipeline_id: string;
  new_version: string;
  status: number;
  type: number;
  create_at: string;
};

export default function PipelineList(props: any): ReactNode {
  const { query } = useRouter();
  const [ pipeline, setPipeline ] = useState<DataType[]>([]);
  const [ pagination, setPagination ] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number, range: [ number, number ]) => `总数：${ total }条`,
    onChange: (page: number, pageSize: number) => {
      pagination.pageSize !== pageSize && (page = 1);
      
      setPagination({
        ...pagination,
        current: page,
        pageSize,
      });
    },
  });
  const [ isShowLog, setIsShowLog ] = useState<boolean>(false);
  const [ log, setLog ] = useState<any>(null);
  const [ isShowHistory, setIsShowHistory ] = useState<boolean>(false);
  const [ history, setHistory ] = useState({
    id: '',
    version: ''
  });
  
  const getList = async () =>
    await getServicePipeline({
      service_id: query.serviceId,
      page: pagination.current,
      page_size: pagination.pageSize,
    })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        pagination.total = response.data.pager.total;
        response.data.service_logs &&
        setPipeline(
          response.data.service_logs.map((v: DataType) => ({
            ...v,
            key: v.pipeline_id,
          }))
        );
      })
      .catch(e => console.log(e));
  
  const columns: TableProps<DataType>['columns'] = [
    {
      dataIndex: 'pipeline_id',
      title: '流水线ID',
      width: 150,
      ellipsis: true,
      render: v => v || '-'
    },
    {
      dataIndex: 'new_version',
      title: '服务版本',
      width: 150,
      ellipsis: true,
      render: v =>
        <Button className="no_padding ellipsis" size="small" type="link"
                onClick={ () => showHistory(v) }>
          { v }
        </Button>
    },
    {
      dataIndex: 'status',
      title: '状态',
      width: 100,
      render: s =>
        <Badge status={ (PipelineStatusMap[s as keyof typeof PipelineStatusMap]?.value as any) || 'default' }
               text={ (PipelineStatusMap[s as keyof typeof PipelineStatusMap]?.label as any) || '-' } />
    },
    {
      dataIndex: 'create_at',
      title: '触发时间',
      width: 170,
      render: v => v
        ? DayJS(v * 1000).format('YYYY.MM.DD HH:mm:ss')
        : '-'
    },
    {
      dataIndex: 'type',
      title: '部署类型',
      width: 100,
      render: type => PipelineTypeMap[type as PipelineTypeEnum] || '-'
    },
    {
      dataIndex: 'creator_name',
      title: '操作者',
      width: 100,
      ellipsis: true,
      render: v => v || '系统'
    },
    {
      title: '操作',
      width: 100,
      ellipsis: true,
      render: (v: any, record: DataType, index: number) =>
        <Space>
          <Button className="no_padding"
                  type="link" size="small"
                  onClick={ () => showLogs(record) }>
            查看
          </Button>
        </Space>
    }
  ];
  const showLogs = (item: any) => {
    setLog(item);
    setIsShowLog(true);
  };
  const showHistory = async (version: string) => {
    setIsShowHistory(true);
    setHistory({
      ...history,
      version
    });
  };
  
  useEffect(() => {
    if (!props.detail) return;
    getList();
    
    setHistory({
      id: props.detail.service_id,
      version: ''
    });
  }, [ props.detail, pagination ]);
  
  return <>
    <Typography.Title className={ Style.title }
                      level={ 5 }>
      变更列表
    </Typography.Title>
    <Table className={ Style.table }
           columns={ columns } dataSource={ pipeline }
           pagination={ pagination } bordered />
    <ModalLogPipeline show={ isShowLog } log={ log } detail={ props.detail }
                      onModalData={ ({ show }) => setIsShowLog(show) } />
    <ModalHistoryDetail data={ history }
                        stateOpen={ isShowHistory } setStateOpen={ setIsShowHistory } />
  </>;
}