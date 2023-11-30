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
  message, Divider, Modal
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
  getDependency,
  createDependency, updateDependency
} from '@/api/dependency';
import Style from './index.module.css';

type FormConfigType = {
  key: string;
  name: string;
  value: string;
  comment: string,
  disabled: Boolean
};
type FormInstanceType = {
  id: string;
  name: string;
  desc: string;
  creator: string;
  createTime: string;
  config: FormConfigType[];
};

const getID = () => NanoID.nanoid(5);
const getConfigItem = (name: string = ''): FormConfigType => ({
  key: getID(),
  name: name,
  value: '',
  comment: '',
  disabled: !!name
});
const formRule = {
  name: [
    { required: true, message: '请输入名称' },
    { pattern: /^\S*$/, message: '不可输入空格' }
  ],
  config: {
    name: [ { required: true, message: '请输入Key' } ],
    value: (name: string) => [
      {
        validator: (rule, value) => {
          if (!value && name === 'host') {
            return Promise.reject('请输入域名或者ip');
          }
          
          return Promise.resolve();
        }
      }
    ]
  },
};
const formatFormData = (prop: any): any => {
  const { stateForm, team }: {
    stateForm: FormInstanceType,
    team: any
  } = prop;
  
  
  return {
    team_id: team.id,
    id: stateForm.id,
    name: stateForm.name,
    desc: stateForm.desc,
    config_info: stateForm.config
  };
};
const formatFormDataReset = (prop: any): void => {
  const {
      setStateForm, stateFormCache,
      form
    } = prop,
    formData: FormInstanceType = {
      id: stateFormCache.id || '',
      name: stateFormCache.name || '',
      desc: stateFormCache.desc || '',
      creator: stateFormCache.creator_name || '',
      createTime: stateFormCache.create_at || '',
      config: stateFormCache.config_info?.map(v => ({
        key: getID(),
        name: v.name || '',
        value: v.value || '',
        comment: v.comment || '',
        disabled: (v.name === 'host' || v.name === 'port')
      })) || [],
    };
  setStateForm(formData);
  form.setFieldsValue(formData);
};
const collapseList = (prop: any): CollapseProps['items'] => [
  {
    key: 'config',
    label: '配置信息',
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
    title: '配置项',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'name' ] : undefined }
                     rules={ formRule.config.name }>
          <Input disabled={ prop.stateForm.config[index].disabled } placeholder="Key" allowClear />
        </Form.Item>
        : (prop.stateForm.config[index].name || '-')
  },
  {
    dataIndex: 'value',
    title: '值',
    width: 300,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'value' ] : undefined } rules={ formRule.config.value(prop.stateForm.config[index].name) }>
          <Input placeholder={ (() => {
            let placeholder
            switch (prop.stateForm.config[index].name) {
              case 'host':
                placeholder = '域名或者ip'
                break;
              case 'port':
                placeholder = '端口号(选填)'
                break
              default:
                placeholder = 'Value'
                break;
            }
            return placeholder
          })() } allowClear />
        </Form.Item>
        : (prop.stateForm.config[index].value || '-')
  },
  {
    dataIndex: 'comment',
    title: '描述（选填）',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'comment' ] : undefined }>
          <Input maxLength={ 50 } showCount={ prop.stateForm.config[index].comment.length > 0 }
                 placeholder="描述" allowClear />
        </Form.Item>
        : (prop.stateForm.config[index].comment || '-')
  },
  ...(
    prop.stateEdit
      ? [
        {
          title: '操作',
          width: 100,
          ellipsis: true,
          render: (v: any, record: FormListFieldData, index: number) =>
            prop.stateForm.config[index].disabled ? '-' :
              <Button type="text" shape="circle"
                      icon={ <DeleteOutlined /> }
                      onClick={ () => {
                        formList.remove(index);
                        
                        prop.stateForm.config.length--;
                        prop.setStateForm(prop.stateForm);
                      } } danger />
          
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
const clickModalOK = (prop: any) => {
  const {
      stateForm, formModal
    } = prop,
    data = formatFormData(prop);
  
  formModal.validateFields()
    .then(() => {
      data.unit_detail.unit_version = formModal.getFieldValue('version') || '';
      formModal.resetFields();
      
      !stateForm.id
        ? requestCreate(prop, data)
        : requestUpdate(prop, data);
    })
    .catch(e => showFormError(e));
};
const requestGet = async (prop: any) =>
  await getDependency({
    id: prop.stateForm.id,
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      prop.setStateFormCache(response.data);
    })
    .catch(e => console.log(e));
const requestCreate = async (prop: any, data: any) =>
  await createDependency({
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
      router.push('/dependencies');
      
      message.success('创建成功');
    })
    .catch(e => console.log(e));
const requestUpdate = async (prop: any, data: any) =>
  await updateDependency({
    ...data,
  })
    .then((response: any) => {
      const { setStateEdit } = prop;
      
      if (response.code !== 200) return;
      
      setStateEdit(false);
      
      message.success('更新成功');
    })
    .catch(e => console.log(e));

export default function Dependency(): ReactNode {
  const router = useRouter();
  const { team } = useSelector((store: StoreType) => store);
  const [ stateEdit, setStateEdit ] = useState<boolean>(false);
  const [ stateCollapse, setStateCollapse ] = useState<string[]>([ 'config' ]);
  const [ stateForm, setStateForm ] = useState<FormInstanceType>({
    id: '',
    name: '',
    desc: '',
    creator: '',
    createTime: '',
    config: [
      getConfigItem('host'), getConfigItem('port')
    ]
  });
  const [ stateFormCache, setStateFormCache ] = useState<any>(null);
  const [ stateModel, setStateModel ] = useState<boolean>(false);
  const [ form ] = Form.useForm<FormInstance<FormInstanceType>>();
  const [ formModal ] = Form.useForm<FormInstance<FormInstanceType>>();
  const propData = {
    router, team,
    stateEdit, setStateEdit,
    stateCollapse, setStateCollapse,
    stateForm, setStateForm,
    stateFormCache, setStateFormCache,
    form
  };
  
  useEffect(() => {
    const isCreate = router.query.dependencyId === 'create',
      path = router.asPath.split('#');
    if (isCreate) {
      setStateEdit(true);
    } else {
      if (path[1] === 'modify') {
        setStateEdit(true);
        router.push(path[0]);
      }
      
      stateForm.id = router.query.dependencyId
        ? String(router.query.dependencyId)
        : '';
      setStateForm({ ...stateForm });
      requestGet(propData);
    }
  }, [ router.query.dependencyId ]);
  useEffect(() => {
    if (!stateFormCache) return;
    
    formatFormDataReset(propData);
  }, [ stateFormCache ]);
  
  return <Card>
    <Typography.Title className="page_title"
                      level={ 2 }>
      { stateForm.id ? stateForm.name : '创建依赖' }
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
                ? <Input maxLength={ 32 } showCount={ stateForm.name.length > 0 }
                         placeholder="请输入名称" disabled={ !!stateForm.id } allowClear />
                : (stateForm.name || '-')
            }
          </Form.Item>
        </Col>
        <Col span={ 12 }>
          {
            stateEdit &&
            <div className={ [ Style.tips, Style.tail ].join(' ') }>
              允许使用中文、英文、数字和特殊字符（如下划线、连字符、点等），长度不超过32个字符。
            </div>
          }
        </Col>
      </Row>
      <Row gutter={ 10 }>
        <Col span={ 12 }>
          <Form.Item label="描述" name={ stateEdit ? 'desc' : undefined }>
            {
              stateEdit
                ? <Input maxLength={ 253 } showCount={ stateForm.desc.length > 0 }
                         placeholder="请输入描述" allowClear />
                : (stateForm.desc || '-')
            }
          </Form.Item>
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
                ? <Button onClick={ () => router.push('/dependencies') }>
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
            <Button onClick={ () => router.push('/dependencies') }>
              返回
            </Button>
          </>
      }
    </Space>
  </Card>;
  
}