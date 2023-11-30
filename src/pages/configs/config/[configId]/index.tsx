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
  type FormInstance, type FormListFieldData, Form,
  type CollapseProps, Collapse,
  type TableProps, Table,
  Card, Typography,
  Row, Col, Space,
  Input, Button,
  message, Divider
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import _ from 'lodash';
import * as NanoID from 'nanoid';

import { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import {
  getConfig,
  createConfig, updateConfig
} from '@/api/config';
import Style from './index.module.css';

type FormConfigType = {
  key: string;
  name: string;
  value: string;
};
type FormInstanceType = {
  id: string;
  name: string;
  creator: string;
  createTime: string;
  config: FormConfigType[];
};

const getID = () => NanoID.nanoid(5);
const getConfigItem = (): FormConfigType => ({
  key: getID(),
  name: '',
  value: ''
});
const formRule = {
  name: [
    { required: true, message: '请输入名称' },
    { pattern: /^[0-9a-z.-]*$/, message: '只能包含小写字母、数字、中划线（-）和小数点（.）' }
  ],
  config: {
    name: (prop: any) => [
      { required: true, message: '请输入键' },
      { pattern: /^[0-9a-zA-Z._-]*$/, message: '只能包含字母、数字、下划线（_）、中划线（-）和小数点（.）' },
      {
        validator: (rule: any, value: string, callback: any) => {
          if (value === '') return Promise.resolve();
          if (prop.stateForm.config.filter(v => v.name === value).length > 1) return Promise.reject('键不能重复');
          return Promise.resolve();
        },
      }
    ],
    value: [ { required: true, message: '请输入值' } ],
  }
};
const formatFormData = (prop: any): any => {
  const { stateForm }: {
    stateForm: FormInstanceType
  } = prop;
  let config = {};
  
  stateForm.config.forEach(v => {
    config[v.name] = v.value;
  });
  
  return {
    config_map_id: stateForm.id,
    config_map_name: stateForm.name,
    kvs: config
  };
};
const formatFormDataReset = (prop: any): void => {
  const {
      setStateForm, stateFormCache,
      form
    } = prop,
    formData: FormInstanceType = {
      id: stateFormCache.config_map_id || '',
      name: stateFormCache.config_map_name || '',
      creator: stateFormCache.creator || '',
      createTime: stateFormCache.create_at || '',
      config: Object.keys(stateFormCache.kvs)?.map(v => ({
        key: getID(),
        name: v,
        value: stateFormCache.kvs[v]
      }))
    };
  
  setStateForm(formData);
  form.setFieldsValue(formData);
};
const collapseList = (prop: any): CollapseProps['items'] => [
  {
    key: 'config',
    label: '配置项',
    children: <Form.List name="config">
      {
        (fields, { add, remove }) =>
          <Table size="small"
                 columns={ tableConfigList(prop, { fields, add, remove }) }
                 footer={ (currentPageData) =>
                   prop.stateEdit &&
                   <Button type="link" size="small" className="button_block"
                           onClick={ () => add(getConfigItem()) }>
                     <PlusOutlined />
                     添加
                   </Button>
                 }
                 dataSource={ fields } pagination={ false } bordered />
      }
    </Form.List>
  },
];
const tableConfigList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    dataIndex: 'name',
    title: '键',
    width: 250,
    // ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'name' ] : undefined }
                     rules={ formRule.config.name(prop) }>
          <Input maxLength={ 24 } showCount={ prop.stateForm.config[index].name.length > 0 }
                 placeholder="请输入键" allowClear />
        </Form.Item>
        : (prop.stateForm.config[index].name || '-')
  },
  {
    dataIndex: 'value',
    title: '值',
    width: 500,
    // ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'value' ] : undefined }
                     rules={ formRule.config.value } style={ { padding: '0 0 20px' } }>
          <Input.TextArea maxLength={ 5000 } showCount={ prop.stateForm.config[index].value.length > 0 }
                          autoSize={ { minRows: 5, maxRows: 20 } }
                          placeholder="请输入值" allowClear />
        </Form.Item>
        : <div className="word_break">
          { prop.stateForm.config[index].value || '-' }
        </div>
  },
  ...(
    prop.stateEdit
      ? [
        {
          title: '操作',
          width: 100,
          ellipsis: true,
          render: (v: any, record: FormListFieldData, index: number) =>
            <Space>
              {
                prop.stateForm.config.length > 1
                  ? <Button type="text" shape="circle"
                            icon={ <DeleteOutlined /> }
                            onClick={ () => {
                              formList.remove(index);
                              
                              prop.stateForm.config.length--;
                              prop.setStateForm(prop.stateForm);
                            } } danger />
                  : '-'
              }
            </Space>
        }
      ]
      : []
  )
];
const clickSubmit = async (prop: any) =>
  prop.form.validateFields()
    .then(() => {
      const { stateForm, formModal } = prop,
        data = formatFormData(prop);
      
      !stateForm.id
        ? requestCreate(prop, data)
        : requestUpdate(prop, data);
    })
    .catch(e => {
      prop.setStateCollapse([ 'config' ]);
      showFormError(e);
    });
const requestGet = async (prop: any) =>
  await getConfig({
    team_id: prop.team.id,
    config_map_id: prop.stateForm.id
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      prop.setStateFormCache(response.data);
    })
    .catch(e => console.log(e));
const requestCreate = async (prop: any, data: any) =>
  await createConfig({
    ...data,
    team_id: prop.team.id
  })
    .then((response: any) => {
      const {
        router,
        setStateEdit
      } = prop;
      
      if (response.code !== 200) return;
      
      setStateEdit(false);
      // router.replace(`/configs/config/${ response.data.config_map_id }`);
      router.push('/configs');
      
      message.success('创建成功');
    })
    .catch(e => console.log(e));
const requestUpdate = async (prop: any, data: any) =>
  await updateConfig({
    ...data,
    team_id: prop.team.id
  })
    .then((response: any) => {
      const { setStateEdit } = prop;
      
      if (response.code !== 200) return;
      
      setStateEdit(false);
      
      message.success('更新成功');
    })
    .catch(e => console.log(e));

export default function Service(): ReactNode {
  const router = useRouter();
  const { team } = useSelector((store: StoreType) => store);
  const [ stateEdit, setStateEdit ] = useState<boolean>(false);
  const [ stateCollapse, setStateCollapse ] = useState<string[]>([ 'config' ]);
  const [ stateForm, setStateForm ] = useState<FormInstanceType>({
    id: '',
    name: '',
    creator: '',
    createTime: '',
    config: [
      getConfigItem()
    ]
  });
  const [ stateFormCache, setStateFormCache ] = useState<any>(null);
  const [ form ] = Form.useForm<FormInstance<FormInstanceType>>();
  const propData = {
    router, team,
    stateEdit, setStateEdit,
    stateCollapse, setStateCollapse,
    stateForm, setStateForm,
    stateFormCache, setStateFormCache,
    form
  };
  
  useEffect(() => {
    const isCreate = router.query.configId === 'create',
      path = router.asPath.split('#');
    
    if (isCreate) {
      setStateEdit(true);
    } else {
      if (path[1] === 'modify') {
        setStateEdit(true);
        router.push(path[0]);
      }
      
      stateForm.id = router.query.configId
        ? String(router.query.configId)
        : '';
      setStateForm({ ...stateForm });
      requestGet(propData);
    }
  }, [ router.query.configId ]);
  useEffect(() => {
    if (!stateFormCache) return;
    
    formatFormDataReset(propData);
  }, [ stateFormCache ]);
  
  return <Card>
    <Typography.Title className="page_title"
                      level={ 2 }>
      { stateForm.id ? stateForm.name : '创建Config' }
    </Typography.Title>
    <Divider />
    <Form className={ Style.form }
          form={ form } initialValues={ stateForm }
          onValuesChange={ v => setStateForm(_.merge({}, stateForm, v)) }>
      <Row gutter={ 10 }>
        <Col span={ 12 }>
          <Form.Item label="名称" name={ stateEdit ? 'name' : undefined }
                     rules={ formRule.name }>
            {
              stateEdit
                ? <Input maxLength={ 253 } showCount={ stateForm.name.length > 0 }
                         placeholder="请输入名称" disabled={ !!stateForm.id } allowClear />
                : stateForm.name
            }
          </Form.Item>
        </Col>
        <Col span={ 12 }>
          {
            stateEdit &&
            <div className={ [ Style.tips, Style.tail ].join(' ') }>
              名称长度为1-253个字符，只能包含小写字母、数字、中划线（-）和小数点（.）。
            </div>
          }
        </Col>
      </Row>
      <Collapse activeKey={ stateCollapse } items={ collapseList(propData) }
                onChange={ (v: any) => setStateCollapse(v) } />
    </Form>
    <Divider />
    <Space>
      {
        stateEdit
          ? <>
              <Button type="primary"
                      onClick={ () => clickSubmit(propData) }>
                { !stateForm.id ? '创建' : '更新' }
              </Button>
            {
              !stateForm.id
                ? <Button onClick={ () => router.push('/configs') }>
                  返回
                </Button>
                : <Button onClick={ () => {
                  setStateEdit(false);
                  formatFormDataReset(propData);
                } }>
                  取消
                </Button>
            }
            </>
          : <>
              {
                stateForm.id &&
                <Button type="primary"
                        onClick={ () => setStateEdit(true) }>
                  修改
                </Button>
              }
            <Button onClick={ () => router.push('/configs') }>
                返回
              </Button>
            </>
      }
    </Space>
  </Card>;
}