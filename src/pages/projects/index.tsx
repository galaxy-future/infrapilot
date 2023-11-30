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
  Form, Input,
  type TableProps, Table,
  Row, Col,
  Space, Button
} from 'antd';
import {
  SearchOutlined
} from '@ant-design/icons';

import { RoleTypeEnum, RoleTypeDict } from '@/lib/interfaces/team';
import { StoreType } from '@/store';
import { getProjectList } from '@/api/project';
import ModalAdd from '@/components/projects/_modal/ModalAdd';
import Style from './index.module.css';

type FormInterfaceType = {
  project_name: string;
};
type TableItemType = {
  key: string;
  project_id: string;
  project_name: string;
  owner_name: string;
  permission: RoleTypeEnum;
  create_at: string;
};

const tableColumn = (prop: any): TableProps<TableItemType>['columns'] => [
  {
    dataIndex: 'project_name',
    title: '项目名称',
    width: 350,
    ellipsis: true,
    render: (value: any, record: TableItemType, index: number) =>
      <Button className="no_padding" type="link"
              onClick={ () => prop.router.push(`/projects/project/${ record.project_id }`) }>
        { value }
      </Button>
  },
  {
    dataIndex: 'owner_name',
    title: '创建者',
    width: 200,
    ellipsis: true
  },
  // {
  //   dataIndex: 'permission',
  //   title: '权限',
  //   width: 100,
  //   render: (value: any, record: TableItemType, index: number) =>
  //     <>{ RoleTypeDict.find(v => v.value === value)?.label || '-' }</>
  // },
  {
    dataIndex: 'create_at',
    title: '创建时间',
    width: 200
  },
  {
    title: '操作',
    width: 150,
    render: (v: any, record: TableItemType, index: number) =>
      <Space size="small">
        <Button className="no_padding" type="link"
                onClick={ () => prop.router.push(`/projects/project/${ record.project_id }`) }>
          查看
        </Button>
      </Space>
  }
];

const requestProjectList = async (prop: any) =>
  await getProjectList({
    team_id: prop.team.id,
    ...prop.stateForm,
    page: prop.statePagination.current,
    page_size: prop.statePagination.pageSize
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      prop.setStateList(
        response.data.list
          ? response.data.list.map((v: TableItemType) => ({ ...v, key: v.project_id }))
          : []
      );
    })
    .catch(e => console.log(e));

export default function Projects(prop: any): ReactNode {
  const router = useRouter();
  const { team } = useSelector((state: StoreType) => state);
  const [ form ] = Form.useForm();
  const [ stateForm, setStateForm ] = useState<FormInterfaceType>({
    project_name: ''
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
      statePagination.pageSize !== pageSize && (page = 1);
      
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
    if (team.id === team.person.id) {
      router.push(`/projects/project/${ team.person.project.id }`);
    } else {
      requestProjectList(propData);
    }
  }, [ team.id, stateForm ]);
  useEffect(() => {
    requestProjectList(propData);
  }, [
    statePagination.current,
    statePagination.pageSize
  ]);
  
  return <>
    <Card>
      <Typography.Title className="page_title"
                        level={ 2 }>
        全部项目
      </Typography.Title>
      <Row className="page_margin"
           justify="space-between">
        <Col>
          <Button type="primary"
                  onClick={ () => setStateModalAdd(true) }>
            创建项目
          </Button>
        </Col>
        {/*<Col>*/ }
        {/*  <Form form={ form } initialValues={ stateForm }*/ }
        {/*        onValuesChange={ (changedValues: any, values: FormInterfaceType) => setStateForm(values) }>*/ }
        {/*    <Form.Item className="no_margin"*/ }
        {/*               name="project_name">*/ }
        {/*      <Input suffix={ <SearchOutlined /> } maxLength={ 50 }*/ }
        {/*             placeholder="搜索" allowClear />*/ }
        {/*    </Form.Item>*/ }
        {/*  </Form>*/ }
        {/*</Col>*/ }
      </Row>
      <Table className="page_margin"
             columns={ tableColumn(propData) }
             dataSource={ stateList } pagination={ statePagination } />
    </Card>
    <ModalAdd stateOpen={ stateModalAdd } setStateOpen={ setStateModalAdd }
              updateData={ () => requestProjectList(propData) } />
  </>;
}