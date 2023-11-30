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
  type TableProps, Table,
  Form, Input, Badge,
  Row, Col, Space, Button,
  message
} from 'antd';
import {
  SearchOutlined
} from '@ant-design/icons';

import { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import { UnitStateEnum } from '@/lib/enums/unit';
import { UnitBuildDist } from '@/lib/interfaces/unit';
import { UnitStatusMap } from '@/lib/maps/unit';
import { getUnitList, rebuildUnit } from '@/api/unit';
import Style from './index.module.css';

type FormInterfaceType = {
  unit_name: string;
  status: UnitStateEnum | undefined;
};
type TableItemType = {
  key: string;
  unit_basic: {
    unit_id: string;
    unit_name: string;
    namespace: string;
    description: string;
    pre_id: string;
    level: 0 | 1;
    creator: string;
    creator_name: string;
    create_at: string;
    build_source: string;
    git_url: string;
    status: UnitStateEnum;
    exception_msg: string;
  };
  versions: {
    version: number;
    unit_version: string;
    image: {
      host: string;
      project: string;
      name: string;
      version: string;
      url: string;
    }
  }[];
};

const tableColumn = (prop: any): TableProps<TableItemType>['columns'] => [
  {
    title: 'Unit名称',
    width: 150,
    ellipsis: true,
    render: (value: any, record: TableItemType, index: number) =>
      <Button className="no_padding" type="link"
              onClick={ () => prop.router.push(`/units/unit/${ record.unit_basic.unit_id }`) }>
        { record.unit_basic.unit_name }
      </Button>
  },
  {
    title: '创建者',
    width: 150,
    ellipsis: true,
    render: (value: any, record: TableItemType, index: number) =>
      record.unit_basic.creator_name
  },
  {
    title: '类型',
    width: 100,
    render: (value: any, record: TableItemType, index: number) =>
      record.unit_basic.build_source
        ? (UnitBuildDist.find(v => v.value === record.unit_basic.build_source)?.label || '-')
        : '-'
  },
  {
    title: '详情',
    width: 200,
    ellipsis: true,
    render: (value: any, record: TableItemType, index: number) =>
      <>
        {
          record.unit_basic.git_url ||
          (record.versions.length > 0 && `${ record.versions[0].image.name }/${ record.versions[0].image.version }`)
        }
      </>
  },
  {
    title: '状态',
    width: 150,
    render: (value: any, record: TableItemType, index: number) =>
      <Badge className="run_state"
             status={ (UnitStatusMap[record.unit_basic.status as UnitStateEnum]?.value as any) || 'default' }
             text={ UnitStatusMap[record.unit_basic.status as UnitStateEnum]?.label || '-' } />
  },
  {
    title: '操作',
    width: 150,
    render: (v: any, record: TableItemType, index: number) =>
      <Space size="small">
        <Button className="no_padding" type="link"
                onClick={ () => prop.router.push(`/units/unit/${ record.unit_basic.unit_id }`) }>
          查看
        </Button>
      </Space>
  }
];
const submit = async (prop: any): Promise<any> =>
  prop.form.validateFields()
    .then(async () => {
      getList(prop);
    })
    .catch(e => showFormError(e));
const getList = async (prop: any) =>
  await getUnitList({
    pre_id: prop.team.id,
    level: -1,
    with_public: true,
    ...prop.stateForm,
    page: prop.statePagination.current,
    page_size: prop.statePagination.pageSize
  })
    .then((response: any) => {
      const {
        setStateList,
        statePagination, setStatePagination
      } = prop;
      
      if (response.code !== 200) return;
      
      setStatePagination({
        ...statePagination,
        total: response.data.total
      });
      setStateList(
        response.data.list
          ? response.data.list.map(v => ({ ...v, key: v.unit_basic.unit_id }))
          : []
      );
    })
    .catch(e => console.log(e));
const rebuild = async (prop: any, item: any) =>
  await rebuildUnit({
    unit_id: item.unit_basic.unit_id
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      getList(prop);
      message.success('正在重试');
    })
    .catch(e => console.error(e));

export default function Projects(prop: any): ReactNode {
  const router = useRouter();
  const { team } = useSelector((state: StoreType) => state);
  const [ form ] = Form.useForm<FormInterfaceType>();
  const [ stateForm, setStateForm ] = useState<FormInterfaceType>({
    unit_name: '',
    status: undefined
  });
  const [ statePagination, setStatePagination ] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number, range: [ number, number ]) => `总数：${ total }条`,
    onChange: (page: number, pageSize: number) => {
      statePagination.pageSize !== pageSize &&
      (page = 1);
      
      setStatePagination({
        ...statePagination,
        current: page,
        pageSize
      });
    }
  });
  const [ stateList, setStateList ] = useState<TableItemType[]>([]);
  const propData = {
    router, team, form,
    stateForm, setStateForm,
    statePagination, setStatePagination,
    stateList, setStateList
  };
  
  useEffect(() => {
    submit(propData);
  }, [
    statePagination.current,
    statePagination.pageSize
  ]);
  
  return <>
    <Row justify="end">
      <Col>
        <Form form={ form } initialValues={ stateForm }
              onValuesChange={ (changedValues: any, values: FormInterfaceType) => setStateForm(values) }>
          {
            false &&
            <Form.Item className="no_margin"
                       name="unit_name">
              <Input suffix={ <SearchOutlined /> } maxLength={ 50 }
                     placeholder="搜索" allowClear />
            </Form.Item>
          }
        </Form>
      </Col>
    </Row>
    <Table columns={ tableColumn(propData) } pagination={ statePagination }
           dataSource={ stateList } scroll={ { x: 0 } } />
  </>;
}