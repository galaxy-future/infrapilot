import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import { Badge, Button, Space, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ExclamationOutlined,
  RedoOutlined
} from '@ant-design/icons';

import { ServiceStateEnum } from "@/lib/enums/service";
import { ServiceStateMap } from "@/lib/maps/service";
import { getDeploymentList, deploy, stop } from "@/api/deployment";
import useModalPay from "@/hooks/useModalPay";

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

export default function Deployments() {
  const router = useRouter();
  const { query } = useRouter();
  const [ projectId, setProjectId ] = useState(query.projectId);
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
        pageSize,
      });
    },
  });
  
  const ModalPay = useModalPay();
  
  const columns: ColumnsType<DataType> = [
    {
      dataIndex: "service_name",
      title: "部署名称",
      width: 150,
      ellipsis: true,
      render: (_, record: any) => (
        <Link href={ `/projects/project/${ query.projectId }/service/${ record.service_id }?tab=deployment` }>
          { record.service_name }
        </Link>
      )
    },
    {
      dataIndex: "operator",
      title: "操作者",
      width: 150,
      ellipsis: true,
      render: v => v || '-'
    },
    {
      dataIndex: "operate_time",
      title: "操作时间",
      width: 170,
      render: v => v || '-'
    },
    {
      dataIndex: "instance_type",
      title: "部署类型",
      width: 100,
      render: v => v || '-'
    },
    {
      dataIndex: "status",
      title: "部署状态",
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
                       {/*<Tooltip placement="bottom"*/ }
                       {/*         title="重试">*/ }
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
      title: "操作",
      width: 180,
      render: (_, record: any) => (
        <Space>
          <Button className="no_padding"
                  size="small"
                  type="link"
                  onClick={ async () => {
                    router.push({
                      pathname: `/projects/project/${ query.projectId }/service/${ record.service_id }`,
                      query: {
                        tab: "monitor",
                      },
                    });
                  } }
          >
            监控
          </Button>
          <Button className="no_padding"
                  size="small"
                  type="link"
                  disabled={ record.service_status !== 6 }
                  onClick={ async () => {
                    ModalPay(await deploy({ service_id: record.service_id }));
                    
                    router.push({
                      pathname: `/projects/project/${ query.projectId }/service/${ record.service_id }`,
                      query: {
                        tab: "deployment",
                      },
                    });
                  } }
          >
            部署
          </Button>
          <Button className="no_padding"
                  size="small" type="link"
                  disabled={
                    record.service_status !== 3 &&
                    record.service_status !== 5 &&
                    record.service_status !== 9
                  }
                  onClick={ async () => {
                    stop({ service_id: record.service_id });
                    
                    router.push({
                      pathname: `/projects/project/${ query.projectId }/service/${ record.service_id }`,
                      query: {
                        tab: "deployment",
                      },
                    });
                  } }
          >
            停止
          </Button>
        </Space>
      ),
    },
  ];
  
  const getData = () => {
    getDeploymentList({
      project_id: query.projectId,
      page: pagination.current,
      page_size: pagination.pageSize,
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
    setProjectId(query.projectId);
  }, [ query.projectId ]);
  
  useEffect(() => {
    projectId && getData();
  }, [ pagination ]);
  
  return (
    <Table columns={ columns } pagination={ pagination }
           dataSource={ deploymentList } scroll={ { x: 0 } } />
  );
}