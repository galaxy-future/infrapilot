import {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  Badge, Button,
  type TableProps, Table,
  Tooltip, Typography,
  Space
} from 'antd';
import DayJS from 'dayjs';

import { UnitTypeEnum } from '@/lib/enums/unit';
import { InstanceStatusMap } from '@/lib/maps/deployment';
import { getPodList } from '@/api/deployment';
import ModalLogInstance from '@/components/service/_modal/ModalLogInstance';
import ModalDirectory from '@/components/service/_modal/ModalDirectory';
import Style from './index.module.css';

type DataType = {
  key: string;
  name: string;
  ip: string;
  status: string;
  spec: string;
  instance_type: UnitTypeEnum;
  create_at: string;
};

export default function InstanceList(props: any): ReactNode {
  const [ instanceList, setInstanceList ] = useState<DataType[]>([]);
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
  const [ isShowDirectory, setIsShowDirectory ] = useState<boolean>(false);
  const [ pod, setPod ] = useState<any>(null);
  
  const getList = async () =>
    await getPodList({
      deployment_ids: props.detail.deployments
                        ?.map((v: any) => v.deployment_id)
                        .join(',') || '',
      page: pagination.current,
      page_size: pagination.pageSize,
    })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        pagination.total = response.data.total;
        response.data.instances &&
        setInstanceList(
          response.data.instances.map((v: DataType) => ({
            ...v,
            key: v.name,
          }))
        );
      })
      .catch(e => console.log(e));
  
  const columns: TableProps<DataType>['columns'] = [
    {
      dataIndex: 'cluster_id',
      title: '集群ID',
      width: 150,
      ellipsis: true,
      render: v => v || '-'
    },
    {
      dataIndex: 'name',
      title: '实例名称',
      width: 150,
      ellipsis: true,
      render: (v: string, record: DataType, index: number) =>
        <Tooltip placement="right" title={ v || '-' }>
          <div className={ Style.text }>{ v || '-' }</div>
        </Tooltip>
    },
    {
      dataIndex: 'unit_name',
      title: 'Unit',
      width: 150,
      ellipsis: true,
      render: v => v || '-'
    },
    {
      dataIndex: 'ip',
      title: '实例IP',
      width: 150,
      ellipsis: true,
      render: v => v || '-'
    },
    {
      dataIndex: 'status',
      title: '状态',
      width: 150,
      render: v =>
        <Badge status={ InstanceStatusMap[v as keyof typeof InstanceStatusMap] as any || 'default' }
               text={ v || '-' } />
    },
    {
      dataIndex: 'spec',
      title: '实例规格',
      width: 150,
      render: v => v || '-'
    },
    {
      dataIndex: 'create_at',
      title: '创建时间',
      width: 170,
      render: v => v
        ? DayJS(v).format('YYYY.MM.DD HH:mm:ss')
        : '-'
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (v: any, record: DataType, index: number) =>
        <Space>
          {
            record.status === 'Running'
              ? <>
                <Button className="no_padding"
                        type="link" size="small"
                        disabled={ record.instance_type && record.instance_type !== UnitTypeEnum.K8S }
                        onClick={ () => showLogs(record) }>
                  日志
                </Button>
                <Button className="no_padding"
                        type="link" size="small"
                        disabled={ record.instance_type && record.instance_type !== UnitTypeEnum.K8S }
                        onClick={ () => showDirectory(record) }>
                  查看文件
                </Button>
                </>
              : '-'
          }
        </Space>
    }
  ];
  
  const showLogs = (item: any) => {
    setPod(item);
    setIsShowLog(true);
  };
  const showDirectory = (item: any) => {
    setPod(item);
    setIsShowDirectory(true);
  };
  
  useEffect(() => {
    if (!props.detail) return;
    getList();
  }, [ props.detail, pagination ]);
  
  return <>
    <Typography.Title className={ Style.title }
                      level={ 5 }>
      实例列表
    </Typography.Title>
    <Table className={ Style.table } scroll={ { x: 0 } }
           columns={ columns } dataSource={ instanceList }
           pagination={ pagination } bordered />
    <ModalLogInstance show={ isShowLog } pod={ pod }
                      onModalData={ ({ show }) => setIsShowLog(show) } />
    <ModalDirectory open={ isShowDirectory }
                    switchOpen={ setIsShowDirectory }
                    pod={ pod } detail={ props.detail } />
  </>;
};