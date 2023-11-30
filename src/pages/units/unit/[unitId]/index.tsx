import {
  type ReactNode,
  useEffect, useState
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
  type DescriptionsProps, Descriptions,
  Card, Typography, Badge,
  Dropdown, Tooltip,
  Divider, Space, Row, Col,
  Radio, Select, Checkbox,
  Input, InputNumber, AutoComplete,
  Button, Modal, message
} from 'antd';
import {
  DownOutlined,
  PlusOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  ExclamationOutlined,
  RedoOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import _ from 'lodash';
import * as NanoID from 'nanoid';
import DayJS from 'dayjs';

import { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import { List } from '@/utils/platform';
import {
  UnitBuildEnum, UnitImageEnum,
  UnitProcessorEnum, UnitGPUTypeEnum,
  UnitHealthEnum, UnitProtocolEnum,
  UnitVolumeTypeEnum, UnitStateEnum,
  UnitBuildFormEnum
} from '@/lib/enums/unit';
import {
  UnitStatusInterface,
  UnitBuildDist, UnitGPUDist, UnitImageDist
} from '@/lib/interfaces/unit';
import {
  UnitStatusMap
} from '@/lib/maps/unit';
import {
  getUnit, getUnitVersion,
  getUnitCheck, getUnitParam,
  createUnit, updateUnit,
  rebuildUnit
} from '@/api/unit';
import Style from './index.module.css';

type FormCheckType = {
  load: boolean;
  message: string;
};
type FormNetType = {
  key: string;
  name: string;
  description: string;
  protocol: UnitProtocolEnum;
  port: string;
};
type FormConfigType = {
  key: string;
  name: string;
  value: string;
  description: string;
};
type FormEnvType = {
  key: string;
  name: string;
  value: string;
  required: boolean;
  description: string;
};
type FormVolumeType = {
  key: string;
  path: string;
  type: UnitVolumeTypeEnum;
};
type FormModelType = {
  key: string;
  id: string | undefined;
  path: string;
};
type FormInstanceType = {
  id: string;
  name: string;
  description: string;
  level: -1 | 0 | 1;
  preID: string;
  creator: string;
  createTime: string;
  state: UnitStateEnum;
  stateMessage: string;
  build: {
    form: 0 | 1;
    type: UnitBuildEnum;
    imageType: UnitImageEnum;
    imageInput: string;
    imageSelect: string | undefined;
    gitStore: string;
    gitDockerfile: string;
  };
  processor: {
    type: UnitProcessorEnum;
    gpu: UnitGPUTypeEnum;
  };
  health: {
    type: UnitHealthEnum;
    port: number | undefined;
    path: string;
  };
  net: FormNetType[];
  config: FormConfigType[];
  env: FormEnvType[];
  volume: FormVolumeType[];
  model: FormModelType[];
};

const recommendGit: string[] = [
  'https://gitea.com/galaxy-future/web-hello',
  'https://gitea.com/galaxy-future/ChatGPT-Next-Web',
  'https://gitea.com/galaxy-future/alist'
];
const recommendDockerfile: string[] = [
  'Dockerfile',
  'docker/Dockerfile'
];
const portList: UnitStatusInterface[] = [
  {
    label: 'SSH',
    value: '22'
  },
  {
    label: 'telnet',
    value: '33'
  },
  {
    label: 'HTTP',
    value: '80'
  },
  {
    label: 'HTTPS',
    value: '443'
  },
  {
    label: 'MySQL',
    value: '3306'
  },
  {
    label: 'Redis',
    value: '6379'
  }
];
const getID = () => NanoID.nanoid(5);
const getNetItem = (): FormNetType => ({
  key: getID(),
  name: '',
  description: '',
  protocol: UnitProtocolEnum.TCP,
  port: ''
});
const getConfigItem = (): FormConfigType => ({
  key: getID(),
  name: '',
  value: '',
  description: '',
});
const getEnvItem = (): FormEnvType => ({
  key: getID(),
  name: '',
  value: '',
  required: false,
  description: ''
});
const getVolumeItem = (): FormVolumeType => ({
  key: getID(),
  path: '',
  type: UnitVolumeTypeEnum.NAS
});
const getModelItem = (): FormModelType => ({
  key: getID(),
  id: undefined,
  path: ''
});
const formRule = {
  name: [
    { required: true, message: '请输入名称' },
    { pattern: /^\S*$/, message: '不可输入空格' }
  ],
  build: {
    form: [ { required: true, message: '请选择类型' } ],
    type: [ { required: true, message: '请选择构建来源' } ],
    imageType: [ { required: true, message: '请选择镜像类型' } ],
    imageInput: [
      { required: true, message: '请输入镜像' },
      { pattern: /^\S*$/, message: '不可输入空格' }
    ],
    imageSelect: [ { required: true, message: '请选择镜像' } ],
    gitStore: (prop: any) => [
      { required: true, message: '请输入仓库地址' },
      { pattern: /^\S*$/, message: '不可输入空格' },
      {
        validator: (rule, value) => {
          if (prop.stateCheckGitStore.message)
            return Promise.reject(prop.stateCheckGitStore.message);
          return Promise.resolve();
        }
      }
    ],
    gitDockerfile: (prop: any) => [
      { required: true, message: '请输入Dockerfile文件地址' },
      { pattern: /^\S*$/, message: '不可输入空格' },
      {
        validator: (rule, value) => {
          if (prop.stateCheckGitDockerfile.message)
            return Promise.reject(prop.stateCheckGitDockerfile.message);
          return Promise.resolve();
        }
      }
    ]
  },
  processor: {
    type: [ { required: true, message: '请选择是否使用GPU' } ],
    gpu: [ { required: true, message: '请选择GPU类型' } ],
  },
  health: {
    type: [ { required: true, message: '请选择协议' } ],
    port: [ { required: true, message: '请输入端口' } ],
    path: [
      { required: true, message: '请输入路径' },
      { pattern: /^\S*$/, message: '不可输入空格' }
    ]
  },
  net: {
    protocol: [ { required: true, message: '请选择协议' } ],
    port: (prop: any) => [
      { required: true, message: '请输入端口' },
      { pattern: /^\d+$/, message: '只能输入数字' },
      {
        validator: (rule, value) => {
          if (!value) return Promise.resolve();
          if (value <= 0 || value > 65535)
            return Promise.reject('范围只能在1~65535');
          if (prop.stateForm.net.filter(v => v.port === value).length > 1)
            return Promise.reject('不能配置相同端口');
          
          return Promise.resolve();
        }
      }
    ]
  },
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
  env: {
    name: [ { required: true, message: '请输入Key' } ]
  },
  volume: {
    name: [ { required: true, message: '请输入名称' } ],
    path: [ { required: true, message: '请输入路径' } ],
    type: [ { required: true, message: '请选择类型' } ]
  },
  model: {
    id: [ { required: true, message: '请选择模型' } ],
    path: [ { required: true, message: '请输入路径' } ]
  },
  modelVersion: [
    { required: true, message: '请输入版本' },
    { pattern: /^[0-9a-zA-Z._-]*$/, message: '只能包含字母、数字、下划线（_）、中划线（-）和小数点（.）' }
  ]
};
const formatFormData = (prop: any): any => {
  const { stateForm }: {
    stateForm: FormInstanceType
  } = prop;
  
  return {
    unit_id: stateForm.id,
    unit_name: stateForm.name,
    description: stateForm.description,
    level: stateForm.level || 0,
    pre_id: stateForm.preID || '',
    build_source: stateForm.build.type,
    image_source: stateForm.build.imageType,
    git_url: stateForm.build.gitStore,
    dockerfile: stateForm.build.gitDockerfile,
    unit_detail: {
      type: stateForm.build.form,
      unit_version: '',
      instance_info: {
        instance_spec: {
          processor_type: stateForm.processor.type,
          instance_type: stateForm.processor.gpu
        }
      },
      image: {
        url: stateForm.build.imageInput,
        name: stateForm.build.imageSelect || ''
      },
      health_check: {
        protocol: stateForm.health.type,
        port: stateForm.health.port,
        path: stateForm.health.path
      },
      exposes: stateForm.net.map(v => ({
        expose_name: v.name,
        comment: v.description,
        protocol: v.protocol,
        port: Number(v.port)
      })),
      config_info: stateForm.config.map(v => ({
        name: v.name,
        value: v.value,
        comment: v.description
      })),
      environments: stateForm.env.map(v => ({
        name: v.name,
        customized_value: v.value,
        is_required: v.required,
        comment: v.description
      })),
      volumes: stateForm.volume.map(v => ({
        mount_path: v.path,
        category: v.type
      })),
      models: stateForm.model.map(v => ({
        volume_id: v.id,
        mount_path: v.path
      }))
    }
  };
};
const formatFormDataReset = (prop: any): void => {
  const {
      setStateForm, stateFormCache,
      setStateCollapse,
      form
    } = prop,
    formData: FormInstanceType = {
      id: stateFormCache.unit_id || '',
      name: stateFormCache.unit_name || '',
      description: stateFormCache.description || '',
      level: stateFormCache.level || 0,
      preID: stateFormCache.pre_id || '',
      creator: stateFormCache.creator_name || '',
      createTime: stateFormCache.create_at || '',
      state: stateFormCache.status || UnitStateEnum.INIT,
      stateMessage: stateFormCache.exception_msg || '',
      build: {
        form: stateFormCache.unit_detail.type || UnitBuildFormEnum.Internal,
        type: stateFormCache.build_source || UnitBuildEnum.Image,
        imageType: stateFormCache.image_source || UnitImageEnum.Demo,
        imageInput: stateFormCache.unit_detail.image?.url || '',
        imageSelect: stateFormCache.unit_detail.image?.name || undefined,
        gitStore: stateFormCache.git_url || '',
        gitDockerfile: stateFormCache.dockerfile || ''
      },
      processor: {
        type: stateFormCache.unit_detail.instance_info.instance_spec.processor_type || UnitProcessorEnum.CPU,
        gpu: stateFormCache.unit_detail.instance_info.instance_spec.instance_type || UnitGPUTypeEnum.Low
      },
      health: {
        type: stateFormCache.unit_detail.health_check.protocol || UnitHealthEnum.HTTP,
        port: stateFormCache.unit_detail.health_check.port || undefined,
        path: stateFormCache.unit_detail.health_check.path || ''
      },
      net: stateFormCache.unit_detail.exposes?.map(v => ({
        key: getID(),
        name: v.expose_name || '',
        description: v.comment || '',
        protocol: v.protocol.toLowerCase() || UnitProtocolEnum.TCP,
        port: String(v.port) || ''
      })) || [],
      config: stateFormCache.unit_detail.config_info?.map(v => ({
        key: getID(),
        name: v.name || '',
        value: v.value || '',
        description: v.comment || '',
        disabled: (stateFormCache.unit_detail.type === UnitBuildFormEnum.External) && (v.name === 'host' || v.name === 'port')
      })) || [],
      env: stateFormCache.unit_detail.environments?.map(v => ({
        key: getID(),
        name: v.name || '',
        value: v.customized_value || '',
        required: v.is_required || false,
        description: v.comment || ''
      })) || [],
      volume: stateFormCache.unit_detail.volumes?.map(v => ({
        key: getID(),
        path: v.mount_path || '',
        type: v.category || UnitVolumeTypeEnum.NAS
      })) || [],
      model: stateFormCache.unit_detail.models?.map(v => ({
        key: getID(),
        id: v.volume_id,
        path: v.mount_path
      })) || []
    },
    collapse = [ 'net' ];
  formData.config.length > 0 && collapse.push('config');
  formData.env.length > 0 && collapse.push('env');
  formData.volume.length > 0 && collapse.push('volume');
  formData.model.length > 0 && collapse.push('model');
  
  setStateForm(formData);
  form.setFieldsValue(formData);
  
  setStateCollapse(collapse);
};
const autoWriteName = (prop: any, name: string = '') => {
  const {
      stateForm, setStateForm,
      form
    } = prop,
    nowName = form.getFieldValue('name');
  if (nowName) return;
  
  stateForm.name = name.replaceAll('.git', '');
  
  setStateForm({ ...stateForm });
  form.setFieldValue('name', name);
  form.validateFields([ 'name' ]);
};
const description = (prop: any): DescriptionsProps['items'] =>
  [
    {
      label: '名称',
      span: 1,
      children: prop.stateForm.name
    },
    {
      label: '使用GPU',
      span: 1,
      children: <Space>
        { prop.stateForm.processor.type === UnitProcessorEnum.CPU ? '否' : '是' }
        {
          prop.stateForm.processor.type === UnitProcessorEnum.GPU &&
          <>
            ，{ UnitGPUDist.find(v => v.value === prop.stateForm.processor.gpu)?.label || '-' }
          </>
        }
      </Space>
    },
    {
      label: '状态',
      span: 1,
      children: <Badge className="run_state"
                       status={ UnitStatusMap[prop.stateForm.state].value }
                       text={
                         <>
            { UnitStatusMap[prop.stateForm.state]?.label || '-' }
                           {
                             prop.stateForm.state === UnitStateEnum.NO_AVAILABLE &&
                             <>
                <Tooltip placement="left" overlayClassName="tooltip_code"
                         title={ prop.stateForm.stateMessage }>
                  <Button type="text" size="small" shape="circle"
                          icon={ <ExclamationOutlined /> } danger />
                </Tooltip>
                <Tooltip placement="bottom"
                         title="重试">
                  <Button type="text" size="small" shape="circle"
                          icon={ <RedoOutlined rotate={ 180 } /> }
                          onClick={ () => requestRebuild(prop) } />
                </Tooltip>
              </>
                           }
          </>
                       } />
    },
    {
      label: '构建来源',
      span: 1,
      children: UnitBuildDist
                  .find(v => v.value === prop.stateForm.build.type)
                  ?.label || '-'
    },
    {
      label: '创建时间',
      span: 1,
      children: DayJS(prop.stateForm.createTime).format('YYYY.MM.DD HH:mm:ss')
    },
    {
      label: '创建者',
      span: 1,
      children: prop.stateForm.creator
    },
    ...(
      prop.stateForm.build.type === UnitBuildEnum.Image
        ? [
          {
            label: '镜像地址',
            span: 3,
            children: <>
              {
                prop.stateForm.build.imageType === UnitImageEnum.Public &&
                prop.stateForm.build.imageInput
              }
              {
                (prop.stateForm.build.imageType === UnitImageEnum.Demo ||
                 prop.stateForm.build.imageType === UnitImageEnum.Model) &&
                (prop.stateForm.build.imageSelect || '-')
              }
            </>
          }
        ]
        : []
    ),
    ...(
      prop.stateForm.build.type === UnitBuildEnum.Git
        ? [
          {
            label: '项目地址',
            span: 2,
            children: prop.stateForm.build.gitStore
          },
          {
            label: 'Dockerfile文件',
            span: 1,
            children: prop.stateForm.build.gitDockerfile
          }
        ]
        : []
    ),
    {
      label: '健康检测',
      span: 3,
      children: <Space size="large">
        <span>
          协议：
          {
            Object
              .keys(UnitHealthEnum)
              .find(k => UnitHealthEnum[k] === prop.stateForm.health.type)
          }
        </span>
        <span>
          端口：{ prop.stateForm.health.port }
        </span>
        {
          prop.stateForm.health.type === UnitHealthEnum.HTTP &&
          <span>
            路径：{ prop.stateForm.health.path }
          </span>
        }
      </Space>
    }
  ]

const collapseList = (prop: any): CollapseProps['items'] =>
  [
    {
      key: 'net',
      label: '网络访问',
      children: <Form.List name="net">
        {
          (fields, { add, remove }) =>
            <Table size="small"
                   columns={ tableNetList(prop, { fields, add, remove }) }
                   footer={ (currentPageData) =>
                     prop.stateEdit &&
                     <Button type="link" size="small" className="button_block"
                             onClick={ () => add(getNetItem()) }>
                       <PlusOutlined />
                       添加
                     </Button>
                   }
                   dataSource={ fields } pagination={ false } bordered />
        }
      </Form.List>
    },
    {
      key: 'config',
      label: '配置信息（选填）',
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
    {
      key: 'env',
      label: '环境变量（选填）',
      children: <Form.List name="env">
        {
          (fields, { add, remove }) =>
            <Table size="small"
                   columns={ tableEnvList(prop, { fields, add, remove }) }
                   footer={ (currentPageData) =>
                     prop.stateEdit &&
                     <Button type="link" size="small" className="button_block"
                             onClick={ () => add(getEnvItem()) }>
                       <PlusOutlined />
                       添加
                     </Button>
                   }
                   dataSource={ fields } pagination={ false } bordered />
        }
      </Form.List>
    },
    {
      key: 'volume',
      label: '持久化存储（选填）',
      children: <Form.List name="volume">
        {
          (fields, { add, remove }) =>
            <Table size="small"
                   columns={ tableVolumeList(prop, { fields, add, remove }) }
                   footer={ (currentPageData) =>
                     prop.stateEdit &&
                     <Button type="link" size="small" className="button_block"
                             onClick={ () => add(getVolumeItem()) }>
                       <PlusOutlined />
                       添加
                     </Button>
                   }
                   dataSource={ fields } pagination={ false } bordered />
        }
      </Form.List>
    },
    ...(
      prop.stateForm.processor.type === UnitProcessorEnum.GPU
        ? [
          {
            key: 'model',
            label: '模型配置（选填）',
            children: <Form.List name="model">
              {
                (fields, { add, remove }) =>
                  <Table size="small"
                         columns={ tableModelList(prop, { fields, add, remove }) }
                         footer={ (currentPageData) =>
                           prop.stateEdit &&
                           <Button type="link" size="small" className="button_block"
                                   onClick={ () => add(getVolumeItem()) }>
                             <PlusOutlined />
                             添加
                           </Button>
                         }
                         dataSource={ fields } pagination={ false } bordered />
              }
            </Form.List>
          }
        ]
        : []
    )
  ];
const tableNetList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    dataIndex: 'protocol',
    title: '协议',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'protocol' ] : undefined }
                     rules={ formRule.net.protocol }>
          <Select placeholder="请选择协议"
                  options={
                    Object
                      .keys(UnitProtocolEnum)
                      .map(k => ({ label: k, value: UnitProtocolEnum[k] }))
                  } />
        </Form.Item>
        : (
          Object
            .keys(UnitProtocolEnum)
            .find(k => UnitProtocolEnum[k] === prop.stateForm.net[index].protocol) || '-'
        )
  },
  {
    dataIndex: 'port',
    title: '端口',
    width: 300,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'port' ] : undefined }
                     rules={ formRule.net.port(prop) }>
          <AutoComplete placeholder="请输入端口"
                        options={ [
                          {
                            label: '常用端口',
                            options: portList.map(v => ({
                              ...v,
                              label: `${ v.label }(${ v.value })`,
                              disabled: !!prop.stateForm.net.find(vv => v.value === vv.port)
                            }))
                          }
                        ] } allowClear />
        </Form.Item>
        : (prop.stateForm.net[index].port || '-')
  },
  {
    dataIndex: 'description',
    title: '描述（选填）',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'description' ] : undefined }>
          <Input maxLength={ 50 } showCount={ prop.stateForm.net[index].description.length > 0 }
                 placeholder="描述" allowClear />
        </Form.Item>
        : (prop.stateForm.net[index].description || '-')
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
                prop.stateForm.net.length > 1
                  ? <Button type="text" shape="circle"
                            icon={ <DeleteOutlined /> }
                            onClick={ () => {
                              formList.remove(index);
                              
                              prop.stateForm.net.length--;
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
          <Input placeholder="Key" allowClear />
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
          <Input placeholder="Value" allowClear />
        </Form.Item>
        : (prop.stateForm.config[index].value || '-')
  },
  {
    dataIndex: 'description',
    title: '描述（选填）',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'description' ] : undefined }>
          <Input maxLength={ 50 } showCount={ prop.stateForm.config[index].description.length > 0 }
                 placeholder="描述" allowClear />
        </Form.Item>
        : (prop.stateForm.config[index].description || '-')
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
const tableEnvList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    dataIndex: 'name',
    title: '变量名',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'name' ] : undefined }
                     rules={ formRule.env.name }>
          <Input placeholder="Key" allowClear />
        </Form.Item>
        : (prop.stateForm.env[index].name || '-')
  },
  {
    dataIndex: 'value',
    title: '值',
    width: 240,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'value' ] : undefined }>
          <Input placeholder="Value" allowClear />
        </Form.Item>
        : (prop.stateForm.env[index].value || '-')
  },
  {
    dataIndex: 'required',
    title: '必填',
    width: 60,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin" valuePropName="checked"
                     name={ prop.stateEdit ? [ index, 'required' ] : undefined }>
          <Checkbox />
        </Form.Item>
        : (prop.stateForm.env[index].required ? '是' : '否')
  },
  {
    dataIndex: 'description',
    title: '描述（选填）',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'description' ] : undefined }>
          <Input maxLength={ 50 } showCount={ prop.stateForm.env[index].description.length > 0 }
                 placeholder="描述" allowClear />
        </Form.Item>
        : (prop.stateForm.env[index].description || '-')
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
              <Button type="text" shape="circle"
                      icon={ <DeleteOutlined /> }
                      onClick={ () => {
                        formList.remove(index);
                        
                        prop.stateForm.env.length--;
                        prop.setStateForm(prop.stateForm);
                      } } danger />
            </Space>
        }
      ]
      : []
  )
];
const tableVolumeList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    dataIndex: 'path',
    title: '容器挂载路径',
    width: 500,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'path' ] : undefined }
                     rules={ formRule.volume.path }>
          <Input placeholder="请输入路径" allowClear />
        </Form.Item>
        : (prop.stateForm.volume[index].path || '-')
  },
  {
    dataIndex: 'type',
    title: '存储类型',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'type' ] : undefined }>
          <Select placeholder="请选择类型"
                  options={
                    Object
                      .keys(UnitVolumeTypeEnum)
                      .map(k => ({ label: k, value: UnitVolumeTypeEnum[k] }))
                  } />
        </Form.Item>
        : (
          Object
            .keys(UnitVolumeTypeEnum)
            .find(k => UnitVolumeTypeEnum[k] === prop.stateForm.volume[index].type) || '-'
        )
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
              <Button type="text" shape="circle"
                      icon={ <DeleteOutlined /> }
                      onClick={ () => {
                        formList.remove(index);
                        
                        prop.stateForm.volume.length--;
                        prop.setStateForm(prop.stateForm);
                      } } danger />
            </Space>
        }
      ]
      : []
  )
];
const tableModelList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    dataIndex: 'id',
    title: '模型名称',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'id' ] : undefined }
                     rules={ formRule.model.id }>
          <Select placeholder="请选择模型"
                  options={
                    prop.stateModelList.map(v => ({
                      ...v,
                      disabled: !!prop.stateForm.model.find(vv => v.value === vv.id)
                    }))
                  } />
        </Form.Item>
        : (prop.stateModelList.find(v => v.value === prop.stateForm.model[index].id)?.label || '-')
  },
  {
    dataIndex: 'path',
    title: '容器挂载路径',
    width: 500,
    ellipsis: true,
    render: (v: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'path' ] : undefined }>
          <Input placeholder="请输入路径" allowClear />
        </Form.Item>
        : (prop.stateForm.model[index].path || '-')
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
              <Button type="text" shape="circle"
                      icon={ <DeleteOutlined /> }
                      onClick={ () => {
                        formList.remove(index);
                        
                        prop.stateForm.model.length--;
                        prop.setStateForm(prop.stateForm);
                      } } danger />
            </Space>
        }
      ]
      : []
  )
];
const clickSubmit = async (prop: any) =>
  prop.form.validateFields()
    .then(() => {
      prop.setStateModel(true);
    })
    .catch(e => {
      prop.setStateCollapse([ 'net', 'config', 'env', 'volume', 'model' ]);
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
const requestParam = async (prop: any) => {
  const {
      stateForm, setStateForm,
      setStateCollapse,
      form
    } = prop,
    image = stateForm.build.imageSelect || '',
    collapse = [ 'net' ];
  
  if (!image) return;
  
  getUnitParam({
    image_source: stateForm.build.imageType,
    image
  })
    .then((response: any) => {
      const data: FormInstanceType = { ...stateForm };
      
      if (response.code !== 200) return;
      
      response.data.instance_info.instance_spec?.processor_type &&
      (data.processor.type = response.data.instance_info.instance_spec.processor_type);
      response.data.instance_info.instance_spec?.instance_type &&
      (data.processor.gpu = response.data.instance_info.instance_spec.instance_type);
      response.data.health_check.protocol && (data.health.type = response.data.health_check.protocol);
      response.data.health_check.port && (data.health.port = response.data.health_check.port);
      response.data.health_check.path && (data.health.path = response.data.health_check.path);
      data.net = response.data.exposes.map((v: any) => {
        const item: FormNetType = getNetItem();
        
        item.name = v.expose_name;
        item.protocol = v.protocol;
        item.port = v.port;
        
        return item;
      });
      data.config = response.data.config_info.map((v: any) => {
        const item: FormConfigType = getConfigItem();
        
        item.name = v.name;
        item.value = v.value;
        item.description = v.comment;
        
        return item;
      });
      data.env = response.data.environments.map((v: any) => {
        const item: FormEnvType = getEnvItem();
        
        item.name = v.name;
        item.value = v.customized_value;
        item.required = v.is_required;
        
        return item;
      });
      data.model = response.data.models.map((v: any) => {
        const item: FormModelType = getModelItem();
        
        item.id = v.volume_id;
        item.path = v.mount_path;
        
        return item;
      });
      
      data.config.length > 0 && collapse.push('config');
      data.env.length > 0 && collapse.push('env');
      data.model.length > 0 && collapse.push('model');
      
      setStateForm(data);
      form.setFieldsValue(data);
      
      setStateCollapse(collapse);
    })
    .catch(e => console.log(e));
};
const requestRepoList = async (prop: any, type: UnitImageEnum, name: string = '') => {
  prop.stateRepoList[type] = [
    ...(await List.unitRepo({
      image_source: type,
      name
    }))
      .map((v: any) => ({
        label: v.name,
        value: v.name
      }))
  ];
  prop.setStateRepoList({ ...prop.stateRepoList });
};
const requestModelList = async (prop: any) =>
  prop.setStateModelList([
    ...(await List.unitModel())
      .map((v: any) => ({
        label: v.model_name,
        value: v.volume_id
      }))
  ]);
const requestVersionList = async (prop: any) =>
  await getUnitVersion({
    unit_id: prop.router.query.unitId,
  })
    .then((response: any) => {
      const { setStateVersionList } = prop;
      
      if (response.code !== 200) return;
      
      setStateVersionList(response.data.version_list || []);
    })
    .catch(e => console.log(e));
const requestCheck = async (prop: any, type: 'GitStore' | 'GitDockerfile') => {
  const {
    setStateCheckGitStore,
    setStateCheckGitDockerfile,
    stateForm, setStateForm,
    form
  } = prop;
  let responseData: any = null;
  
  switch (type) {
    case 'GitStore':
      setStateCheckGitStore({
        load: true,
        message: ''
      });
      break;
    case 'GitDockerfile':
      setStateCheckGitDockerfile({
        load: true,
        message: ''
      });
      break;
  }
  
  await getUnitCheck({
    git_url: prop.stateForm.build.gitStore,
    dockerfile_path: prop.stateForm.build.gitDockerfile
  })
    .then((response: any) => {
      if (response.code !== 200) {
        responseData = response;
        return;
      }
      
      const data: FormInstanceType = {
        ...stateForm,
        build: {
          ...stateForm.build,
          gitDockerfile: response.data.dockerfile_path
        },
        health: {
          ...stateForm.health,
          type: UnitHealthEnum.TCP,
          port: response.data.detect_port
        },
        net: response.data.expose_list.map(v => ({
          key: getID(),
          name: '',
          description: '',
          protocol: v.protocol,
          port: v.port
        }))
      };
      
      setStateForm(data);
      form.setFieldsValue(data);
    })
    .catch(e => console.log(e))
    .finally(() => {
      let messageStore: string = '',
        messageDockerfile: string = '';
      
      if (responseData) {
        switch (responseData.code) {
          case 2107:
          case 2108:
            messageDockerfile = responseData.msg;
            break;
          case 2110:
            messageStore = '该项目地址无法访问';
            break;
          case '2109':
          default:
            break;
        }
      }
      
      setStateCheckGitStore({
        load: false,
        message: messageStore
      });
      setStateCheckGitDockerfile({
        load: false,
        message: messageDockerfile
      });
    });
};
const requestGet = async (prop: any) =>
  await getUnit({
    unit_id: prop.stateForm.id,
    version: prop.stateVersion
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      prop.setStateFormCache(response.data);
    })
    .catch(e => console.log(e));
const requestCreate = async (prop: any, data: any) =>
  await createUnit(data)
    .then((response: any) => {
      const {
        router,
        setStateEdit, setStateModel
      } = prop;
      
      if (response.code !== 200) return;
      
      setStateEdit(false);
      setStateModel(false);
      // router.replace(`/units/unit/${ response.data.unit_id }`);
      router.push('/units');
      
      message.success('创建成功');
    })
    .catch(e => console.log(e));
const requestUpdate = async (prop: any, data: any) =>
  await updateUnit(data)
    .then((response: any) => {
      const { setStateEdit, setStateModel } = prop;
      
      if (response.code !== 200) return;
      
      setStateEdit(false);
      setStateModel(false);
      requestVersionList(prop);
      
      message.success('更新成功');
    })
    .catch(e => console.log(e));
const requestRebuild = async (prop: any) =>
  await rebuildUnit({
    unit_id: prop.stateForm.id
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      requestGet(prop);
      message.success('正在重试');
    })
    .catch(e => console.log(e));

export default function Unit(prop: any): ReactNode {
  const router = useRouter();
  const { team } = useSelector((store: StoreType) => store);
  const [ stateEdit, setStateEdit ] = useState<boolean>(false);
  const [ stateVersionDropdown, setStateVersionDropdown ] = useState<boolean>(false);
  const [ stateVersionList, setStateVersionList ] = useState<any[]>([]);
  const [ stateVersion, setStateVersion ] = useState<string>('');
  const [ stateCheckGitStore, setStateCheckGitStore ] = useState<FormCheckType>({
    load: false,
    message: ''
  });
  const [ stateCheckGitDockerfile, setStateCheckGitDockerfile ] = useState<FormCheckType>({
    load: false,
    message: ''
  });
  const [ stateRepoList, setStateRepoList ] = useState<Record<UnitImageEnum, any[]>>({
    [UnitImageEnum.Demo]: [] as any[],
    [UnitImageEnum.Public]: [] as any[],
    [UnitImageEnum.Model]: [] as any[]
  });
  const [ stateModelList, setStateModelList ] = useState<any[]>([]);
  const [ stateCollapse, setStateCollapse ] = useState<string[]>([ 'net' ]);
  const [ stateForm, setStateForm ] = useState<FormInstanceType>({
    id: '',
    name: '',
    description: '',
    level: 0,
    preID: team.id,
    creator: '',
    createTime: '',
    state: UnitStateEnum.INIT,
    stateMessage: '',
    build: {
      form: UnitBuildFormEnum.Internal,
      type: UnitBuildEnum.Image,
      imageType: UnitImageEnum.Demo,
      imageInput: '',
      imageSelect: undefined,
      gitStore: '',
      gitDockerfile: ''
    },
    processor: {
      type: UnitProcessorEnum.CPU,
      gpu: UnitGPUTypeEnum.Low
    },
    health: {
      type: UnitHealthEnum.HTTP,
      port: 80,
      path: '/'
    },
    net: [ getNetItem() ],
    config: [],
    env: [],
    volume: [],
    model: []
  });
  const [ stateFormCache, setStateFormCache ] = useState<any>(null);
  const [ stateModel, setStateModel ] = useState<boolean>(false);
  const [ form ] = Form.useForm<FormInstance<FormInstanceType>>();
  const [ formModal ] = Form.useForm<FormInstance<FormInstanceType>>();
  const propData = {
    router, team,
    stateCheckGitStore, setStateCheckGitStore,
    stateCheckGitDockerfile, setStateCheckGitDockerfile,
    stateEdit, setStateEdit,
    stateRepoList, setStateRepoList,
    stateModelList, setStateModelList,
    stateVersionList, setStateVersionList,
    stateVersion, setStateVersion,
    stateCollapse, setStateCollapse,
    stateForm, setStateForm,
    stateFormCache, setStateFormCache,
    stateModel, setStateModel,
    form, formModal
  };
  
  useEffect(() => {
    const isCreate = router.query.unitId === 'create',
      path = router.asPath.split('#');
    
    if (isCreate) {
      setStateEdit(true);
      Object.values(UnitImageEnum)
        .map(v => requestRepoList(propData, v));
    } else {
      if (path[1] === 'modify') {
        setStateEdit(true);
        router.push(path[0]);
      }
      
      setStateForm({
        ...stateForm,
        id: router.query.unitId
          ? String(router.query.unitId)
          : '',
        level: -1 // 默认为-1，防止公共unit被点击更新按钮
      });
      requestVersionList(propData);
    }
    
    requestModelList(propData);
  }, [ router.query.unitId ]);
  useEffect(() => {
    setStateVersion(router.query.version || (stateVersionList.length > 0 ? stateVersionList[0].value : ''));
  }, [ stateVersionList ]);
  useEffect(() => {
    (stateForm.id && stateVersion) &&
    requestGet(propData);
  }, [ stateVersion ]);
  useEffect(() => {
    stateCheckGitStore.message &&
    form.validateFields([ [ 'build', 'gitStore' ] ]);
    stateCheckGitDockerfile.message &&
    form.validateFields([ [ 'build', 'gitDockerfile' ] ]);
  }, [
    stateCheckGitStore.message,
    stateCheckGitDockerfile.message
  ]);
  useEffect(() => {
    if (!stateFormCache) return;
    
    formatFormDataReset(propData);
    (propData.stateFormCache.image_source === UnitImageEnum.Demo ||
     propData.stateFormCache.image_source === UnitImageEnum.Model) &&
    requestRepoList(propData, propData.stateFormCache.image_source, stateFormCache.unit_detail.image.name);
  }, [ stateFormCache ]);
  
  return <>
    <Card>
      <Space className="align_bottom"
             size="middle">
        <Typography.Title className="page_title"
                          level={ 2 }>
          { stateForm.id ? stateForm.name : '创建Unit' }
        </Typography.Title>
        {
          !stateEdit &&
          <Dropdown.Button size="small" placement="bottomRight"
                           overlayStyle={ { overflowY: 'auto', maxHeight: 300 } }
                           icon={ <DownOutlined /> } open={ stateVersionDropdown }
                           menu={ {
                             items: stateVersionList.map(v => ({ ...v, key: v.value })),
                             onClick: item => setStateVersion(item.key)
                           } }
                           onOpenChange={ open => setStateVersionDropdown(open) }
                           onClick={ e => setStateVersionDropdown(!stateVersionDropdown) }>
            版本：{ stateVersionList.find(v => v.value === stateVersion)?.label || '' }
          </Dropdown.Button>
        }
      </Space>
      <Divider />
      <Form className={ Style.form }
            form={ form } initialValues={ stateForm }
            onValuesChange={ v => setStateForm(_.merge({}, stateForm, v)) }>
        {
          stateEdit
            ? <>
              <Form.Item label="构建来源" name={ stateEdit ? [ 'build', 'type' ] : undefined }
                         rules={ formRule.build.type }>
                {
                  stateEdit
                    ? <Radio.Group disabled={ !!stateForm.id }
                                   options={ UnitBuildDist } />
                    : UnitBuildDist
                      .find(v => v.value === stateForm.build.type)
                      ?.label
                }
              </Form.Item>
              {
                stateForm.build.type === UnitBuildEnum.Image &&
                <Row gutter={ 10 }>
                  <Col span={ stateEdit ? 12 : 24 }>
                    <Form.Item className="no_margin"
                               label="镜像" required={ stateEdit }>
                      <Row gutter={ 10 }>
                        <Col span={ stateEdit ? 8 : undefined }>
                          <Form.Item name={ stateEdit ? [ 'build', 'imageType' ] : undefined }
                                     rules={ formRule.build.imageType }>
                            {
                              stateEdit
                                ? <Select options={ UnitImageDist }
                                          placeholder="请选择类型" disabled={ !!stateForm.id }
                                          onChange={ (value: any) => {
                                            console.log(value, 'aaaaa')
                                            stateForm.build.imageType = value;
                                            stateForm.build.imageSelect = undefined;
                                            stateForm.build.imageInput = '';
                                            
                                            setStateForm({ ...stateForm });
                                            form.setFieldValue('build', stateForm.build);
                                          } } />
                                : UnitImageDist
                                  .find(v => v.value === stateForm.build.imageType)
                                  ?.label
                            }
                          </Form.Item>
                        </Col>
                        {
                          stateForm.build.imageType === UnitImageEnum.Public &&
                          <Col span={ 16 }>
                            <Form.Item name={ stateEdit ? [ 'build', 'imageInput' ] : undefined }
                                       rules={ formRule.build.imageInput }>
                              {
                                stateEdit
                                  ? <Input placeholder="请输入镜像"
                                           maxLength={ 300 } showCount={ stateForm.build.imageInput.length > 0 }
                                           onBlur={ () => autoWriteName(propData, form.getFieldValue([ 'build', 'imageInput' ]).split('/').pop()) }
                                           allowClear />
                                  : <div className={ Style.form_text }>
                                    { stateForm.build.imageInput }
                                  </div>
                              }
                            </Form.Item>
                          </Col>
                        }
                        {
                          (stateForm.build.imageType === UnitImageEnum.Demo ||
                           stateForm.build.imageType === UnitImageEnum.Model) &&
                          <Col span={ 16 }>
                            <Form.Item name={ stateEdit ? [ 'build', 'imageSelect' ] : undefined }
                                       rules={ formRule.build.imageSelect }>
                              {
                                stateEdit
                                  ? <Select placeholder="请选择镜像"
                                            options={ stateRepoList[stateForm.build.imageType === UnitImageEnum.Demo ? UnitImageEnum.Demo : UnitImageEnum.Model] }
                                            disabled={ !!stateForm.id }
                                            onChange={ (value: any) => {
                                              stateForm.build.imageSelect = value;
                                              autoWriteName(propData, stateForm.build.imageSelect);
                                              requestParam(propData);
                                            } } allowClear />
                                  : (stateForm.build.imageSelect || '-')
                              }
                            </Form.Item>
                          </Col>
                        }
                      </Row>
                    </Form.Item>
                  </Col>
                  {
                    stateForm.build.imageType === UnitImageEnum.Public &&
                    <Col span={ stateEdit ? 12 : 0 }>
                      <div className={ [ Style.tips, Style.tail ].join(' ') }>
                        请输入完整的镜像仓库地址，
                        如：registry.cn-hangzhou.aliyuncs.com/docker_vhukze/java_test:v1.0.3
                        或docker.io/bitnami/mysql:latest，并确保可公开访问。
                      </div>
                    </Col>
                  }
                </Row>
              }
              {
                stateForm.build.type === UnitBuildEnum.Git &&
                <Row gutter={ 10 }>
                  <Col span={ 12 }>
                    <Form.Item label="开源项目地址" name={ stateEdit ? [ 'build', 'gitStore' ] : undefined }
                               rules={ formRule.build.gitStore(propData) }
                               extra={
                stateCheckGitStore.load &&
                <span className={ Style.load }>
                  自动检测中<LoadingOutlined />
                </span>
                               }>
                      {
                        stateEdit
                          ? <AutoComplete placeholder="https://provider-name/oragazation-name/project-name"
                                          options={ recommendGit.map(v => ({ label: v, value: v })) }
                                          maxLength={ 300 } disabled={ !!stateForm.id || stateCheckGitStore.load || stateCheckGitDockerfile.load }
                                          onBlur={ () => {
                                            autoWriteName(propData, form.getFieldValue([ 'build', 'gitStore' ]).split('/').pop());
                                            requestCheck(propData, 'GitStore');
                                          } } allowClear />
                          : stateForm.build.gitStore
                      }
                    </Form.Item>
                  </Col>
                  <Col span={ 12 }>
                    {
                      stateEdit &&
                      <div className={ [ Style.tips, Style.tail ].join(' ') }>
                        目前仅支持可公开访问的项目，如https://gitea.com/galaxy-future/web-hello。
                      </div>
                    }
                  </Col>
                  <Col span={ 12 }>
                    <Form.Item label="Dockerfile文件" name={ stateEdit ? [ 'build', 'gitDockerfile' ] : undefined }
                               rules={ formRule.build.gitDockerfile(propData) }
                               extra={
                stateCheckGitDockerfile.load &&
                <span className={ Style.load }>
                  自动检测中<LoadingOutlined />
                </span>
                               }>
                      {
                        stateEdit
                          ? <AutoComplete placeholder="Dockerfile or docker/Dockerfile" maxLength={ 300 }
                                          options={ recommendDockerfile.map(v => ({ label: v, value: v })) }
                                          disabled={ stateCheckGitStore.load || stateCheckGitDockerfile.load }
                                          onBlur={ () => requestCheck(propData, 'GitDockerfile') } allowClear />
                          : stateForm.build.gitDockerfile
                      }
                    </Form.Item>
                  </Col>
                  <Col span={ 12 }>
                    {
                      stateEdit &&
                      <div className={ [ Style.tips, Style.tail ].join(' ') }>
                        项目所使用的dockerfile相对路径，默认使用Dockerfile或者docker/Dockerfile。
                      </div>
                    }
                  </Col>
                </Row>
              }
              <Row gutter={ 10 }>
                <Col span={ 12 }>
                  <Form.Item label="名称" name={ stateEdit ? 'name' : undefined }
                             rules={ formRule.name }>
                    {
                      stateEdit
                        ? <Input maxLength={ 32 } showCount={ stateForm.name.length > 0 }
                                 placeholder="请输入名称" disabled={ !!stateForm.id } allowClear />
                        : stateForm.name
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
              <Form.Item className="no_margin"
                         label="使用GPU" required={ stateEdit }>
                <Row gutter={ 10 }>
                  <Col>
                    <Form.Item name={ stateEdit ? [ 'processor', 'type' ] : undefined }
                               rules={ formRule.processor.type }>
                      {
                        stateEdit
                          ? <Radio.Group disabled={ !!stateForm.id || (stateForm.build.type === UnitBuildEnum.Image && stateForm.build.imageType === UnitImageEnum.Demo) }>
                            {
                              Object
                                .keys(UnitProcessorEnum)
                                .map(k =>
                                  <Radio key={ UnitProcessorEnum[k] } value={ UnitProcessorEnum[k] }>
                                    { UnitProcessorEnum[k] === UnitProcessorEnum.CPU ? '否' : '是' }
                                  </Radio>
                                )
                            }
                          </Radio.Group>
                          : stateForm.processor.type === UnitProcessorEnum.CPU ? '否' : '是'
                      }
                    </Form.Item>
                  </Col>
                  {
                    stateForm.processor.type === UnitProcessorEnum.GPU &&
                    <Col span={ stateEdit ? 15 : undefined }>
                      <Form.Item name={ stateEdit ? [ 'processor', 'gpu' ] : undefined }
                                 label={
                                   <Tooltip placement="bottomLeft" title={ '低配GPU机型采用NVIDIA T4，高配GPU机型采用NVIDIA V100，低配机型成本不到高配机型的一半，请根据实际需要选择' }>
                                     <span>
                                       GPU机型<QuestionCircleOutlined className="icon_tooltip" />
                                     </span>
                                   </Tooltip>
                                 }
                                 rules={ formRule.processor.gpu }>
                        {
                          stateEdit
                            ? <Radio.Group options={ UnitGPUDist } />
                            : UnitGPUDist.find(v => v.value === stateForm.processor.gpu)?.label
                        }
                      </Form.Item>
                    </Col>
                  }
                </Row>
              </Form.Item>
              <Form.Item className="no_margin"
                         label="健康检测" required={ stateEdit }>
                <Row gutter={ 10 }>
                  <Col>
                    <Form.Item name={ stateEdit ? [ 'health', 'type' ] : undefined }
                               rules={ formRule.health.type }>
                      {
                        stateEdit
                          ? <Radio.Group disabled={ stateForm.build.type === UnitBuildEnum.Image && stateForm.build.imageType === UnitImageEnum.Demo }>
                            {
                              Object
                                .keys(UnitHealthEnum)
                                .map(k =>
                                  <Radio key={ UnitHealthEnum[k] } value={ UnitHealthEnum[k] }>
                                    { k }协议
                                  </Radio>
                                )
                            }
                          </Radio.Group>
                          : Object
                              .keys(UnitHealthEnum)
                              .find(k => UnitHealthEnum[k] === stateForm.health.type) +
                            '协议'
                      }
                    </Form.Item>
                  </Col>
                  <Col span={ stateEdit ? 5 : undefined }>
                    <Form.Item label="端口" name={ stateEdit ? [ 'health', 'port' ] : undefined }
                               rules={ formRule.health.port }>
                      {
                        stateEdit
                          ? <InputNumber className="max_width"
                                         placeholder="请输入端口" controls={ false }
                                         min={ 1 } max={ 65535 } precision={ 0 }
                                         disabled={ stateForm.build.type === UnitBuildEnum.Image && stateForm.build.imageType === UnitImageEnum.Demo } />
                          : stateForm.health.port
                      }
                    </Form.Item>
                  </Col>
                  {
                    stateForm.health.type === UnitHealthEnum.HTTP &&
                    <Col span={ 10 }>
                      <Form.Item label="路径" name={ stateEdit ? [ 'health', 'path' ] : undefined }
                                 rules={ formRule.health.path }>
                        {
                          stateEdit
                            ? <Input maxLength={ 300 } showCount={ stateForm.health.path.length > 0 }
                                     placeholder="请输入路径"
                                     disabled={ stateForm.build.type === UnitBuildEnum.Image && stateForm.build.imageType === UnitImageEnum.Demo }
                                     allowClear />
                            : stateForm.health.path
                        }
                      </Form.Item>
                    </Col>
                  }
                </Row>
              </Form.Item>
            </>
            : <Descriptions title="基本信息" size="small"
                            column={ 3 } labelStyle={ { width: 100 } }
                            items={ description(propData) } bordered />
        }
        <Collapse className={ stateEdit ? '' : 'page_margin' }
                  activeKey={ stateCollapse } items={ collapseList(propData) }
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
                  ? <Button onClick={ () => router.push('/units') }>
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
                (stateForm.id && stateForm.level !== -1) &&
                <Button type="primary"
                        onClick={ () => setStateEdit(true) }>
                  修改
                </Button>
              }
              <Button onClick={ () => router.push('/units') }>
                返回
              </Button>
            </>
        }
      </Space>
    </Card>
    <Modal title="确认保存" open={ stateModel } footer={ null }
           onCancel={ () => setStateModel(false) }>
      <Form form={ formModal }
            labelCol={ { span: 5 } }>
        <Form.Item className="no_margin"
                   label="当前最新版本">
          { stateVersionList.find(v => v.value === stateVersion)?.label || '-' }
        </Form.Item>
        <Form.Item label="保存为版本" name="version"
                   rules={ formRule.modelVersion }>
          <Input maxLength={ 32 }
                 placeholder="如：v1.0.0" />
        </Form.Item>
        <Form.Item className="no_margin"
                   wrapperCol={ { offset: 5 } }>
          <Space size="small">
            <Button type="primary"
                    onClick={ () => clickModalOK(propData) }>
              确定
            </Button>
            <Button onClick={ () => setStateModel(false) }>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  </>;
}