import {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  useRouter
} from 'next/router';
import {
  Card, Typography,
  Row, Col, Space,
  Form, Input, Button,
  type TableProps, Table
} from 'antd';
import {
  SearchOutlined
} from '@ant-design/icons';
import DayJS from 'dayjs';

import { StoreType } from '@/store';
import {
  getDependencyList
} from '@/api/dependency';
import Style from './index.module.css';

type FormInterfaceType = {
  config_map_name: string;
};
type TableItemType = {
  key: string;
  id: string;
  name: string;
  creator: string;
  create_at: string;
};

let flagGetList: boolean = false;

const tableColumn = (prop: any): TableProps<TableItemType>['columns'] => [
  {
    dataIndex: 'name',
    title: '依赖名称',
    width: 350,
    ellipsis: true,
    render: (v: any, record: TableItemType, index: number) =>
      <Button className="no_padding" type="link"
              onClick={ () => prop.router.push(`/dependencies/dependency/${ record.id }`) }>
        { v || '-' }
      </Button>
  },
  {
    dataIndex: 'creator_name',
    title: '创建者',
    width: 200,
    ellipsis: true,
    render: v => v || '-'
  },
  {
    dataIndex: 'create_at',
    title: '创建时间',
    width: 200,
    render: v => v
      ? DayJS(v).subtract(14, 'hour').format('YYYY.MM.DD HH:mm:ss')
      : '-'
  },
  {
    title: '操作',
    width: 150,
    render: (v: any, record: TableItemType, index: number) =>
      <Space size="small">
        <Button className="no_padding" type="link"
                onClick={ () => prop.router.push(`/dependencies/dependency/${ record.id }`) }>
          查看
        </Button>
        <Button className="no_padding" type="link"
                onClick={ () => prop.router.push(`/dependencies/dependency/${ record.id }#modify`) }>
          修改
        </Button>
      </Space>
  }
];

const requestDependencyList = async (prop: any) => {
  const {
    team,
    setStateForm, setStateList,
    statePagination, setStatePagination
  } = prop;
  
  if (flagGetList) return;
  flagGetList = true;
  
  await getDependencyList({
    team_id: team.id,
    page: statePagination.current,
    page_size: statePagination.pageSize
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      setStatePagination({
        ...statePagination,
        total: response.data.total
      });
      setStateList(
        response.data.list
          ? response.data.list.map((v: TableItemType) => ({ ...v, key: v.id }))
          : []
      );
    })
    .catch(e => console.log(e))
    .finally(() => {
      flagGetList = false;
    });
};


export default function Dependencies(): ReactNode {
  const router = useRouter();
  const { team } = useSelector((state: StoreType) => state);
  const [ form ] = Form.useForm();
  const [ stateForm, setStateForm ] = useState<FormInterfaceType>({
    config_map_name: ''
  });
  const [ stateList, setStateList ] = useState<TableItemType[]>([]);
  const [ statePagination, setStatePagination ] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number, range: [ number, number ]) => `总数：${ total }条`,
    onChange: (page: number, pageSize: number) => {
      if (flagGetList) return;
      
      statePagination.pageSize !== pageSize &&
      (page = 1);
      
      setStatePagination({
        ...statePagination,
        current: page,
        pageSize
      });
    }
  });
  const [ stateModalAdd, setStateModalAdd ] = useState<boolean>(false);
  const propData = {
    router, form, team,
    stateForm, setStateForm,
    stateList, setStateList,
    statePagination, setStatePagination,
    stateModalAdd, setStateModalAdd
  };
  
  useEffect(() => {
    requestDependencyList(propData);
  }, [
    statePagination.current,
    statePagination.pageSize
  ]);
  
  return <Card>
    <Typography.Title className="page_title"
                      level={ 2 }>
      外部依赖
    </Typography.Title>
    <Row className="page_margin"
         justify="space-between">
      <Col>
        <Button type="primary"
                onClick={ () => router.push('/dependencies/dependency/create') }>
          创建依赖
        </Button>
      </Col>
    </Row>
    <Table className="page_margin"
           columns={ tableColumn(propData) }
           dataSource={ stateList } pagination={ statePagination } />
  </Card>;
}