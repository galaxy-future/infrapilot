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
  Tooltip, Progress, message
} from 'antd';
import {
  SearchOutlined,
  ExclamationOutlined,
  RedoOutlined
} from '@ant-design/icons';

import { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import { UnitStateEnum } from '@/lib/enums/unit';
import { UnitBuildDist } from '@/lib/interfaces/unit';
import { UnitStatusMap } from '@/lib/maps/unit';
import {
  getUnitList, getUnitStatus,
  rebuildUnit
} from '@/api/unit';
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
type ProgressType = {
  key: string;
  id: string;
  state: UnitStateEnum;
  stage: 'clone' | 'build' | 'push';
  progress: number;
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
          (record.versions.length > 0 && `${ record.versions[0].image.name }`)
        }
      </>
  },
  {
    title: '状态',
    width: 150,
    render: (value: any, record: TableItemType, index: number) => {
      const {
          stateProgressList
        } = prop,
        item = stateProgressList.find(v => v.unit_id === record.unit_basic.unit_id);
      
      
      if (!item) return '-';
      
      return <>
        <Badge className="run_state"
               status={ (UnitStatusMap[item.status as UnitStateEnum]?.value as any) || 'default' }
               text={
                 <>
                   { UnitStatusMap[item.status as UnitStateEnum]?.label || '-' }
                   {
                     item.status === UnitStateEnum.NO_AVAILABLE &&
                     <>
                       <Tooltip placement="left" overlayClassName="tooltip_code"
                                title={ record.unit_basic.exception_msg }>
                         <Button type="text" size="small" shape="circle"
                                 icon={ <ExclamationOutlined /> } danger />
                       </Tooltip>
                       <Tooltip placement="bottom"
                                title="重试">
                         <Button type="text" size="small" shape="circle"
                                 icon={ <RedoOutlined rotate={ 180 } /> }
                                 onClick={ () => rebuild(prop, record) } />
                       </Tooltip>
                     </>
                   }
                 </>
               } />
        {
          item.status === UnitStateEnum.COMPILING &&
          <Progress className="no_margin"
                    size="small" percent={ item.progress } />
        }
      </>
    }
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
        <Button className="no_padding" type="link"
                onClick={ () => prop.router.push(`/units/unit/${ record.unit_basic.unit_id }#modify`) }>
          修改
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
    level: 0,
    with_public: false,
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
const getState = (prop: any) => {
  const {
      stateList,
      stateProgressList, setStateProgressList
    } = prop,
    request = async (isFirst: boolean = true) => {
      const list = isFirst
        ? stateList
          .map(v => ({
            unit_id: v.unit_basic.unit_id
          }))
        : stateProgressList
          .filter(v => v.status === UnitStateEnum.INIT || v.status === UnitStateEnum.COMPILING)
          .map(v => ({
            unit_id: v.unit_id
          }));
      
      if (list.length === 0) return;
      
      await getUnitStatus({
        unit_list: JSON.stringify(list)
      })
        .then((response: any) => {
          if (response.code !== 200) return;
          
          if (isFirst) {
            stateProgressList.length = 0;
            stateProgressList.push(...response.data.unit_list);
            setStateProgressList([ ...stateProgressList ]);
          } else {
            stateProgressList.forEach(v => {
              response.data.unit_list.forEach(vv => {
                if (v.unit_id !== vv.unit_id) return;
                v = { ...vv };
              });
            });
            setStateProgressList([ ...stateProgressList ]);
          }
          
          (response.data.unit_list.filter(v => v.status === UnitStateEnum.INIT || v.status === UnitStateEnum.COMPILING).length === 0 && setTime) &&
          clearInterval(setTime);
        })
        .catch(e => console.log(e));
    };
  
  request();
  setTime && clearInterval(setTime);
  setTime = setInterval(() => {
    request(false);
  }, 3000);
};
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
let setTime: NodeJS.Timeout | null = null;

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
  const [ stateProgressList, setStateProgressList ] = useState<ProgressType[]>([]);
  const propData = {
    router, team, form,
    stateForm, setStateForm,
    statePagination, setStatePagination,
    stateProgressList, setStateProgressList,
    stateList, setStateList
  };
  
  useEffect(() => {
    submit(propData);
  }, [
    statePagination.current,
    statePagination.pageSize
  ]);
  useEffect(() => {
    if (stateList.length === 0) return;
    
    getState(propData);
    
    return () => {
      setTime && clearInterval(setTime);
    };
  }, [ stateList ]);
  
  return <>
    <Row justify="space-between">
      <Col>
        <Button type="primary"
                onClick={ () => router.push('/units/unit/create') }>
          创建Unit
        </Button>
      </Col>
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
    <Table className="page_margin"
           columns={ tableColumn(propData) } pagination={ statePagination }
           dataSource={ stateList } scroll={ { x: 0 } } />
  </>;
}