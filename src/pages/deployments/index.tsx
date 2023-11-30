import {
  type ReactNode,
  useEffect, useState
} from 'react';
import {
  useSelector
} from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Card, Typography,
  Badge, Button, Space,
  Table, Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ExclamationOutlined,
  RedoOutlined
} from '@ant-design/icons';

import type { StoreType } from '@/store';
import { ServiceStateEnum } from '@/lib/enums/service';
import { ServiceStateMap } from '@/lib/maps/service';
import {
  getTeamDeploymentList,
  deploy, resume, stop
} from '@/api/deployment';
import useModalPay from '@/hooks/useModalPay';

interface DataType {
  key: string;
  service_name: string;
  operator: string;
  operate_time: string;
  instance_type: string;
  service_detail: object | any;
  status: number;
  exception_msg: string;
}

export default function Deployments(): ReactNode {
  const router = useRouter();
  const { team } = useSelector((state: StoreType) => state);
  const [ deploymentList, setDeploymentList ] = useState([]);
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
        pageSize
      });
    }
  });
  
  const ModalPay = useModalPay();
  
  const columns: ColumnsType<DataType> = [
    {
      dataIndex: 'service_name',
      title: '服务名称',
      width: 240,
      ellipsis: true,
      render: (_, record: any) =>
        <Link href={ `/projects/project/${ record.pre_id }/service/${ record.service_id }?tab=deployment` }>
          { record.service_name }
        </Link>
    },
    {
      dataIndex: 'pre_name',
      title: '项目名称',
      width: 140,
      ellipsis: true,
      render: (_, record: any) => record.level === 1 ? (_ || '-') : '-'
    },
    {
      dataIndex: 'operator',
      title: '操作者',
      width: 100,
      ellipsis: true,
      render: v => v || '-'
    },
    {
      dataIndex: 'operate_time',
      title: '操作时间',
      width: 170,
      render: v => v || '-'
    },
    // {
    //   dataIndex: 'instance_type',
    //   title: '部署类型',
    //   width: 100,
    //   render: v => v || '-'
    // },
    {
      dataIndex: 'status',
      title: '部署状态',
      width: 150,
      render: (_, record: any) =>
        <Badge className="run_state"
               status={ ServiceStateMap[record.service_status]?.color || 'default' }
               text={
                 <>
                   { ServiceStateMap[record.service_status]?.label || '-' }
                   {
                     record.service_status === ServiceStateEnum.ERROR &&
                     <>
                       <Tooltip placement="left" overlayClassName="tooltip_code"
                                title={ record.exception_msg }>
                         <Button type="text" size="small" shape="circle"
                                 icon={ <ExclamationOutlined /> } danger />
                       </Tooltip>
                       {/*<Tooltip placement='bottom'*/ }
                       {/*         title='重试'>*/ }
                       {/*  <Button type='text' size='small' shape='circle'*/ }
                       {/*          icon={ <RedoOutlined rotate={ 180 } /> }*/ }
                       {/*          onClick={} />*/ }
                       {/*</Tooltip>*/ }
                     </>
                   }
                 </>
               } />
    },
    {
      title: '操作',
      width: 200,
      render: (v: any, record: any, index: number) =>
        <Space>
          <Button className="no_padding" size="small" type="link"
                  onClick={ async () => {
                    router.push({
                      pathname: `/projects/project/${ record.pre_id }/service/${ record.service_id }`,
                      query: {
                        tab: 'monitor',
                      },
                    });
                  } }>
            监控
          </Button>
          <Button className="no_padding" size="small" type="link"
                  disabled={ record.service_status !== ServiceStateEnum.STOPPED }
                  onClick={ async () => {
                    ModalPay(await deploy({ service_id: record.service_id }));
                    
                    router.push({
                      pathname: `/projects/project/${ record.pre_id }/service/${ record.service_id }`,
                      query: {
                        tab: 'deployment',
                      },
                    });
                  } }>
            部署
          </Button>
          <Button className="no_padding" size="small" type="link"
                  disabled={ record.service_status !== ServiceStateEnum.PAUSED }
                  onClick={ async () => {
                    ModalPay(await resume({ service_id: record.service_id }));
                    
                    router.push({
                      pathname: `/projects/project/${ record.pre_id }/service/${ record.service_id }`,
                      query: {
                        tab: 'deployment',
                      },
                    });
                  } }>
            恢复
          </Button>
          <Button className="no_padding" size="small" type="link"
                  disabled={
                    record.service_status !== ServiceStateEnum.RUNNING &&
                    record.service_status !== ServiceStateEnum.ERROR &&
                    record.service_status !== ServiceStateEnum.PAUSED
                  }
                  onClick={ async () => {
                    stop({ service_id: record.service_id });
                    
                    router.push({
                      pathname: `/projects/project/${ record.pre_id }/service/${ record.service_id }`,
                      query: {
                        tab: 'deployment',
                      },
                    });
                  } }>
            停止
          </Button>
        </Space>
    }
  ];
  
  const getData = () => {
    getTeamDeploymentList({
      team_id: team.id,
      page: pagination.current,
      page_size: pagination.pageSize
    })
      .then((res) => {
        if (res.code !== 200) return;
        
        if (res.data) {
          pagination.current = res.data.page;
          pagination.pageSize = res.data.page_size;
          pagination.total = res.data.total;
          setDeploymentList(
            res.data.services.map((s: any) => ({ ...s, key: s.service_id }))
          );
        }
      })
      .catch(e => console.log(e));
  };
  
  useEffect(() => {
    getData();
  }, [ pagination ]);
  
  return <Card>
    <Typography.Title className="page_title"
                      level={ 2 }>
      部署
    </Typography.Title>
    <Table className="page_margin"
           columns={ columns } pagination={ pagination }
           dataSource={ deploymentList } scroll={ { x: 0 } } />
  </Card>;
}