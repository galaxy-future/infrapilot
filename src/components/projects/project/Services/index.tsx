"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Table, Button, Space, Badge, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ExclamationOutlined,
  RedoOutlined
} from '@ant-design/icons';

import { getServiceList } from "@/api/service";
import { deploy } from "@/api/deployment";
import { ServiceStateEnum } from "@/lib/enums/service";
import { ServiceStateMap } from "@/lib/maps/service";
import useModalPay from "@/hooks/useModalPay";


interface DataType {
  key: string;
  service_name: string;
  creator_name: number;
  create_at: string;
  service_detail: object | any;
  status: number;
  exception_msg: string;
}

export default function Services(props: any) {
  const router = useRouter();
  const { query } = useRouter();
  const [ serviceList, setServiceList ] = useState([]);
  const [ projectId, setProjectId ] = useState(query.projectId);
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
      title: "服务名称",
      width: 250,
      ellipsis: true,
      render: (v, record: any) =>
        <Link href={ `/projects/project/${ query.projectId }/service/${ record.service_id }?tab=detail` }>
          { v || '-' }
        </Link>
    },
    {
      dataIndex: "creator_name",
      title: "创建者",
      width: 150,
      ellipsis: true,
      render: v => v || '-'
    },
    {
      dataIndex: "create_at",
      title: "创建时间",
      width: 170,
      ellipsis: true,
      render: v => v || '-'
    },
    // {
    //   dataIndex: "instance_type",
    //   title: "部署类型",
    //   width: 100,
    //   render: (v, record) => record.service_detail.instance_type
    // },
    {
      dataIndex: "status",
      title: "部署状态",
      width: 150,
      render: (_, record) =>
        <Badge className="run_state"
               status={ ServiceStateMap[record.status]?.color || 'default' }
               text={
                 <>
                   { ServiceStateMap[record.status]?.label || '-' }
                   {
                     record.status === ServiceStateEnum.ERROR &&
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
                       {/*          onClick={  } />*/ }
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
                  size="small" type="link"
                  onClick={ () => router.push(`/projects/project/${ query.projectId }/service/${ record.service_id }?tab=detail`) }>
            查看
          </Button>
          <Button className="no_padding"
                  size="small" type="link"
                  onClick={ () => router.push(`/projects/project/${ query.projectId }/service/${ record.service_id }?tab=detail#modify`) }>
            修改
          </Button>
          {
            (record.status === 1 || record.status === 6) &&
            <Button className="no_padding"
                    size="small" type="link"
                    onClick={ async () => {
                      ModalPay(await deploy({ service_id: record.service_id }));
                      
                      router.push({
                        pathname: `/projects/project/${ query.projectId }/service/${ record.service_id }`,
                        query: {
                          tab: "deployment",
                        },
                      });
                    } }>
              部署
            </Button>
          }
          {
            (record.status !== 1 && record.status !== 6) &&
            <Button className="no_padding"
                    size="small" type="link"
                    onClick={ () => {
                      router.push({
                        pathname: `/projects/project/${ query.projectId }/service/${ record.service_id }`,
                        query: {
                          tab: "deployment",
                        },
                      });
                    } }>
              部署详情
            </Button>
          }
        </Space>
      ),
    },
  ];
  
  const getData = () => {
    getServiceList({
      project_id: projectId,
      page: pagination.current,
      page_size: pagination.pageSize,
    })
      .then((res) => {
        if (res.code !== 200) return;
        
        if (res.data) {
          pagination.current = res.data.page;
          pagination.pageSize = res.data.page_size;
          pagination.total = res.data.total;
          setServiceList(
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
    <>
      <Button
        type="primary"
        style={ { marginBottom: 15 } }
        onClick={ () =>
          router.push({
            pathname: `/projects/project/${ query.projectId }/service/create`,
            query: {
              status: "create",
              tab: "detail",
            },
          })
        }
      >
        创建服务
      </Button>
      <Table columns={ columns } pagination={ pagination }
             dataSource={ serviceList } scroll={ { x: 0 } } />
    </>
  );
}