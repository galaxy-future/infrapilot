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
  Typography, Divider, Space, Row, Col,
  Radio, Select, Cascader, Checkbox, Input,
  Button, message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import _ from 'lodash';
import * as NanoID from 'nanoid';

import { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import { List } from '@/utils/platform';
import { ServiceAccessEnum, ServiceEnvTypeEnum } from '@/lib/enums/service';
import { UnitBuildEnum, UnitImageEnum, UnitTypeEnum } from '@/lib/enums/unit';
import { ServiceAccessDict, ServiceEnvTypeDict } from '@/lib/interfaces/service';
import { ServiceStateMap } from '@/lib/maps/service';
import { createService, updateService } from '@/api/service';
import ModalHistory from '@/components/service/_modal/ModalHistory';
import Style from './index.module.css';

type FormUnitItem = {
  key: string;
  id: string[] | undefined;
  image: {
    build: UnitBuildEnum,
    type: UnitImageEnum,
    input: string;
    name: string;
    select: string | undefined;
  },
  env: {
    key: string;
    name: string;
    type: ServiceEnvTypeEnum;
    value: string;
    valueList: string[] | undefined;
    required: boolean;
    description: string;
  }[];
  port: {
    key: string;
    name: number;
    permission: ServiceAccessEnum;
    public: boolean;
  }[];
  config: {
    key: string;
    id: string | undefined;
    path: string;
    pathSub: string;
  }[];
};
type FormDependItem = {
  key: string;
  id: string | undefined;
  name: string;
};
type FormDependencyItem = {
  key: string;
  id: string | undefined;
  name: string;
  desc: string
};
type FormInstanceType = {
  id: string;
  name: string;
  description: string;
  level: 0 | 1;
  preID: string;
  unit: FormUnitItem[];
  depend: FormDependItem[];
  dependency: FormDependencyItem[];
};

const getID = () => NanoID.nanoid(5);
const getUnitItem = (): FormUnitItem => ({
  key: getID(),
  id: undefined,
  image: {
    build: UnitBuildEnum.Image,
    type: UnitImageEnum.Demo,
    input: '',
    name: '',
    select: undefined
  },
  env: [],
  port: [],
  config: []
});
const getUnitConfigItem = (): FormUnitItem['config'][0] => ({
  key: getID(),
  id: undefined,
  path: '',
  pathSub: ''
});
const getDependItem = (): FormDependItem => ({
  key: getID(),
  id: undefined,
  name: ''
});
const getDependencyItem = (): FormDependencyItem => ({
  key: getID(),
  id: undefined,
  name: '',
  desc: ''
});
const formRule = {
  name: [
    { required: true, message: '请输入名称' },
    { pattern: /^\S*$/, message: '不可输入空格' }
  ],
  unit: {
    id: [ { required: true, message: '请选择unit' } ],
    image: {
      input: [ { required: true, message: '请输入镜像版本' } ],
      select: [ { required: true, message: '请选择镜像版本' } ]
    },
    env: {
      type: [ { required: true, message: '请选择类型' } ],
      value: [ { required: true, message: '请输入值' } ],
      valueList: [ { required: true, message: '请选择值' } ]
    },
    port: {
      permission: [ { required: true, message: '请选择访问权限' } ]
    },
    config: {
      id: [ { required: true, message: '请选择配置' } ],
      path: [ { required: true, message: '请输入路径' } ],
      // pathSub: [ { required: true, message: '请选择子路径' } ]
    }
  },
  depend: {
    id: [ { required: true, message: '请选择服务' } ]
  },
  dependency: {
    id: [ { required: true, message: '请选择外部依赖服务' } ]
  },
};
const formatFormData = (prop: any): any => {
  const { stateForm }: {
    stateForm: FormInstanceType
  } = prop;
  
  return {
    service_id: stateForm.id,
    service_name: stateForm.name,
    description: stateForm.description,
    level: stateForm.level,
    pre_id: stateForm.preID,
    service_detail: {
      units: stateForm.unit.map((v, i) => ({
        unit_id: v.id?.[0] || '',
        version: v.id?.[1] || '',
        image: {
          url: v.image.input || '',
          version: v.image.select || ''
        },
        environments: v.env.map(vv => ({
          name: vv.name,
          type: vv.type,
          customized_value: vv.value,
          is_required: vv.required,
          comment: vv.description,
          config_info: {
            service_id: vv.valueList?.[0] || '',
            unit_id: vv.valueList?.[1] || '',
            config_name: vv.valueList?.[2] || ''
          }
        })),
        config_map_list: v.config.map(vv => ({
          config_map_id: vv.id,
          mount_path: vv.path,
          subpath: vv.pathSub
        }))
      })),
      access_control: stateForm.unit.reduce((t: any[], v) => {
        t.push(
          ...v.port.map(vv => ({
            unit_id: v.id?.[0] || '',
            port: vv.name,
            permission: vv.permission,
            is_public: vv.public
          }))
        );
        return t;
      }, []),
      depends: stateForm.depend.map(v => ({
        service_id: v.id
      })),
      ext_dep: stateForm.dependency.map(v => ({
        id: v.id,
      }))
    }
  };
};
const formatFormDataReset = (prop: any): void => {
  const {
      setStateForm, stateFormCache,
      setStateCollapse,
      setStateCollapseUnit,
      form
    } = prop,
    formData: FormInstanceType = {
      id: stateFormCache.service_id || '',
      name: stateFormCache.service_name || '',
      description: stateFormCache.description || '',
      level: stateFormCache.level || 0,
      preID: stateFormCache.pre_id || '',
      unit: stateFormCache.service_detail.units?.map(v => ({
        key: getID(),
        id: [ v.unit_id, v.version ],
        image: {
          build: v.build_source || UnitBuildEnum.Image,
          type: v.image_source || UnitImageEnum.Demo,
          input: v.image.url || '',
          name: v.image.name || '',
          select: v.image.version || undefined
        },
        env: v.environments?.map(vv => ({
          key: getID(),
          name: vv.name,
          type: vv.type || ServiceEnvTypeEnum.Customize,
          value: vv.customized_value,
          valueList: (vv.config_info.service_id && vv.config_info.unit_id && vv.config_info.config_name)
            ? [
              vv.config_info.service_id,
              vv.config_info.unit_id,
              vv.config_info.config_name
            ]
            : undefined,
          required: vv.is_required,
          description: vv.comment
        })) || [],
        port: stateFormCache.service_detail.access_control
                ?.filter(vv => vv.unit_id === v.unit_id)
                .map(vv => ({
                  key: getID(),
                  id: vv.unit_id,
                  name: vv.port,
                  permission: vv.permission,
                  public: vv.is_public
                })) || [],
        config: v.config_map_list?.map(vv => ({
          key: getID(),
          id: vv.config_map_id,
          path: vv.mount_path,
          pathSub: vv.subpath
        })) || []
      })) || [],
      depend: stateFormCache.service_detail.depends?.map(v => ({
        key: getID(),
        id: v.service_id,
        name: v.service_name
      })) || [],
      dependency: stateFormCache.service_detail.ext_dep?.map(v => ({
        key: getID(),
        id: v.id,
        name: v.name,
        desc: v.desc
      })) || []
    },
    collapse: string[] = [ 'unit' ];
  
  formData.depend.length > 0 && collapse.push('depend');
  formData.dependency.length > 0 && collapse.push('dependency');
  setStateCollapse(collapse);
  setStateCollapseUnit(formData.unit.map(v => v.key));
  setStateForm(formData);
  form.setFieldsValue(formData);
};
const getUnitVersion = (prop: any, unitID, versionID): {
  unit: any,
  version: any
} => {
  const { stateUnitList } = prop,
    item = stateUnitList.find(v => v.value === unitID);
  let itemVersion: any = null;
  
  item && (itemVersion = item.children.find(v => v.value === versionID));
  
  return {
    unit: item,
    version: itemVersion
  };
};
const collapseList = (prop: any): CollapseProps['items'] => [
  {
    key: 'unit',
    label: <Row>
      <Col span={ 18 }>
        配置Unit
        <span className={ Style.collapse_tip }>
          一个服务可以由多个独立运行的业务单元即unit组成。
        </span>
      </Col>
      <Col span={ 6 } style={ { textAlign: 'right' } }>
        {
          prop.stateEdit &&
          <Button type="link" size="small" className="no_padding"
                  onClick={ () => prop.router.push('/units/unit/create') }>
            找不到合适的Unit？去创建一个
          </Button>
        }
      </Col>
    </Row>,
    children: <Form.List name="unit">
      {
        (fields, { add, remove }) =>
          <>
            <Collapse className={ Style.collapse }
                      activeKey={ prop.stateCollapseUnit }
                      items={ collapseUnitList(prop, { fields, add, remove }) }
                      onChange={ v => prop.setStateCollapseUnit(v) } bordered={ false } />
            {
              (prop.stateEdit && !prop.stateForm.id) &&
              <Button type="link" className="button_block"
                      style={ { background: 'rgba(0,0,0,0.02)' } }
                      onClick={ () => add(getUnitItem()) }>
                <PlusOutlined />
                添加Unit
              </Button>
            }
          </>
      }
    </Form.List>
  },
  {
    key: 'depend',
    label: '依赖服务（选填）',
    children: <Form.List name="depend">
      {
        (fields, { add, remove }) =>
          <Table size="small"
                 columns={ tableDependList(prop, { add, remove }) }
                 footer={ (currentPageData) =>
                   prop.stateEdit &&
                   <Button type="link" size="small" className="button_block"
                           onClick={ () => add(getDependItem()) }>
                     <PlusOutlined />
                     添加
                   </Button>
                 }
                 dataSource={ fields } pagination={ false } bordered />
      }
    </Form.List>
  },
  {
    key: 'dependency',
    label: '外部依赖（选填）',
    children: <Form.List name="dependency">
      {
        (fields, { add, remove }) =>
          <Table size="small"
                 columns={ tableDependencyList(prop, { add, remove }) }
                 footer={ (currentPageData) =>
                   prop.stateEdit &&
                   <Button type="link" size="small" className="button_block"
                           onClick={ () => add(getDependencyItem()) }>
                     <PlusOutlined />
                     添加
                   </Button>
                 }
                 dataSource={ fields } pagination={ false } bordered />
      }
    </Form.List>
  }
];
const collapseUnitList = (prop: any, formList: any): CollapseProps['items'] => [
  ...prop.stateForm.unit.map((v, i) => ({
    key: v.key,
    style: {
      marginBottom: 10,
      border: 'none',
      borderRadius: 8,
      background: 'rgba(0,0,0,0.02)'
    },
    label: <Row align="middle">
      <Col>Unit：</Col>
      <Col>
        <Form.Item className="no_margin" style={ { width: prop.stateEdit ? 250 : 'auto' } }
                   name={ prop.stateEdit ? [ i, 'id' ] : undefined }
                   rules={ formRule.unit.id }>
          {
            prop.stateEdit
              ? <Cascader placeholder="请选择Unit / 版本"
                          options={
                            prop.stateUnitList
                              .filter(vv => !prop.stateForm.id || vv.value === (prop.stateFormCache && prop.stateFormCache.service_detail.units[i].unit_id))
                              .map(v => ({ ...v, disabled: prop.stateForm.unit.find(vv => vv.id?.[0] === v.value) }))
                          }
                          onChange={ (value) => {
                            const item: FormUnitItem = prop.stateForm.unit[i];
                            
                            if (!value) {
                              item.id = undefined;
                              item.image = {
                                build: UnitBuildEnum.Image,
                                type: UnitImageEnum.Demo,
                                input: '',
                                name: '',
                                select: undefined
                              };
                              item.env = [];
                              item.port = [];
                            } else {
                              const { unit, version } = getUnitVersion(prop, value[0], value[1]);
                              
                              item.id = value as string[];
                              item.image = {
                                build: unit.build_source || UnitBuildEnum.Image,
                                type: unit.image_source || UnitImageEnum.Demo,
                                input: version.image?.url || '',
                                name: version.image?.name || '',
                                select: (prop.stateRepoList[unit.image_source]
                                  .find(v => v.value === version.image?.name)
                                  ?.children || [])[0]?.value || undefined
                              };
                              item.env = version.environments.map(v => ({
                                key: getID(),
                                name: v.name,
                                type: v.type || ServiceEnvTypeEnum.Customize,
                                value: v.customized_value,
                                required: v.is_required,
                                description: v.comment
                              }));
                              item.port = version.exposes.map(v => ({
                                key: getID(),
                                name: v.port,
                                permission: version.exposes.length === 1 ? ServiceAccessEnum.External : ServiceAccessEnum.Internal,
                                public: version.exposes.length === 1
                              }));
                              
                              prop.stateCollapseUnit.push(item.key);
                              prop.setStateCollapseUnit(prop.stateCollapseUnit);
                            }
                            
                            prop.setStateForm({ ...prop.stateForm });
                            prop.form.setFieldsValue(prop.stateForm);
                          } }
                          onClick={ e => e.stopPropagation() } />
              : (() => {
                const { stateForm } = prop,
                  [ unitID, versionID ] = stateForm.unit[i].id || [],
                  { unit, version } = getUnitVersion(prop, unitID, versionID);
                
                return <Button type="link" className="no_padding ellipsis_button"
                               onClick={ e => {
                                 e.stopPropagation();
                                 prop.router.push(`/units/unit/${ unit.value }?version=${ version.value }`);
                               } }>
                  { `${ unit?.label || '-' } / ${ version?.label || '-' }` }
                </Button>;
              })()
          }
        </Form.Item>
      </Col>
      {
        prop.stateForm.unit[i].image.build === UnitBuildEnum.Image &&
        <>
          <Col offset={ 1 }>镜像：</Col>
          <Col>
            {
              prop.stateForm.unit[i].image.type === UnitImageEnum.Public
                ? <Form.Item className="no_margin" style={ { width: prop.stateEdit ? 250 : 'auto' } }
                             name={ prop.stateEdit ? [ i, 'image', 'input' ] : undefined }
                             rules={ formRule.unit.image.input }>
                  {
                    prop.stateEdit
                      ? <Input placeholder="请输入镜像"
                               maxLength={ 300 } showCount={ prop.stateForm.unit[i].image.input.length > 0 }
                               onClick={ e => e.stopPropagation() } allowClear />
                      : (prop.stateForm.unit[i].image.input || '-')
                  }
                </Form.Item>
                : <Row gutter={ [ 5, 0 ] } align="middle">
                  <Col>
                    {
                      prop.stateRepoList[prop.stateForm.unit[i].image.type]
                        .find(v => v.value === prop.stateForm.unit[i].image.name)
                        ?.label || '-'
                    }
                  </Col>
                  <Col>/</Col>
                  <Col>
                    <Form.Item className="no_margin" style={ { width: prop.stateEdit ? 200 : 'auto' } }
                               name={ prop.stateEdit ? [ i, 'image', 'select' ] : undefined }
                               rules={ formRule.unit.image.select }>
                      {
                        prop.stateEdit
                          ? <Select placeholder="请选择版本" disabled={ !prop.stateForm.unit[i].image.name }
                                    options={
                                      prop.stateRepoList[prop.stateForm.unit[i].image.type]
                                        .find(v => v.value === prop.stateForm.unit[i].image.name)
                                        ?.children || []
                                    }
                                    onClick={ e => e.stopPropagation() } allowClear />
                          : (
                            prop.stateRepoList[prop.stateForm.unit[i].image.type]
                              .find(v => v.value === prop.stateForm.unit[i].image.name)
                              ?.children.find(v => v.value === prop.stateForm.unit[i].image.select)
                              ?.label || '-'
                          )
                      }
                    </Form.Item>
                  </Col>
                </Row>
            }
          </Col>
        </>
      }
    </Row>,
    extra: prop.stateEdit &&
           <Space>
             {
               (prop.stateForm.unit.length > 1 && !prop.stateForm.id) &&
               <Button type="text" shape="circle"
                       icon={ <DeleteOutlined /> }
                       onClick={ e => {
                         e.stopPropagation();
                         
                         formList.remove(i);
                         
                         prop.stateForm.unit.length--;
                         prop.setStateForm(prop.stateForm);
                       } } danger />
             }
           </Space>,
    children: <Row gutter={ [ 0, 10 ] }>
      {
        prop.stateForm.unit[i].env.length > 0 &&
        <Col span={ 24 }>
          <Form.List name={ [ i, 'env' ] }>
            {
              (fields, { add, remove }) =>
                <Table size="small"
                       title={ (currentPageData) =>
                         <Typography.Title className="no_margin"
                                           level={ 5 }>
                           环境变量
                         </Typography.Title>
                       }
                       columns={ tableEnvList(prop, { index: i, fields, add, remove }) }
                       dataSource={ fields } pagination={ false } bordered />
            }
          </Form.List>
        </Col>
      }
      <Col span={ 24 }>
        <Form.List name={ [ i, 'port' ] }>
          {
            (fields, { add, remove }) =>
              <Table size="small"
                     title={ (currentPageData) =>
                       <Typography.Title className="no_margin"
                                         level={ 5 }>
                         访问控制
                       </Typography.Title>
                     }
                     columns={ tablePortList(prop, { index: i, fields, add, remove }) }
                     dataSource={ fields } pagination={ false } bordered />
          }
        </Form.List>
      </Col>
      {
        (prop.stateEdit || prop.stateForm.unit[i].config.length > 0) &&
        <Col span={ 24 }>
          <Form.List name={ [ i, 'config' ] }>
            {
              (fields, { add, remove }) =>
                <Table size="small"
                       title={ (currentPageData) =>
                         <Row justify="space-between">
                           <Col>
                             <Typography.Title className="no_margin"
                                               level={ 5 }>
                               关联配置（选填）
                             </Typography.Title>
                           </Col>
                           {
                             prop.stateEdit &&
                             <Col>
                               <Button type="link" size="small" className="no_padding"
                                       onClick={ () => prop.router.push('/configs/config/create') }>
                                 找不到合适的配置？去创建一个
                               </Button>
                             </Col>
                           }
                         </Row>
                       }
                       columns={ tableConfigList(prop, { index: i, fields, add, remove }) }
                       footer={ (currentPageData) =>
                         prop.stateEdit &&
                         <Button type="link" size="small" className="button_block"
                                 onClick={ () => add(getUnitConfigItem()) }>
                           <PlusOutlined />
                           添加
                         </Button>
                       }
                       dataSource={ fields } pagination={ false } bordered />
            }
          </Form.List>
        </Col>
      }
    </Row>
  }))
];
const tableEnvList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    title: '变量名',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateForm.unit[formList.index].env[index].name || '-'
  },
  {
    title: '类型',
    width: 150,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'type' ] : undefined }
                     rules={ formRule.unit.env.type }>
          <Select options={ ServiceEnvTypeDict }
                  onChange={ value => {
                    const item = prop.stateForm.unit[formList.index].env[index];
                    
                    item.type = value;
                    item.value = '';
                    item.valueList = undefined;
                    
                    prop.setStateForm({ ...prop.stateForm });
                    prop.form.setFieldsValue(prop.stateForm);
                  } } />
        </Form.Item>
        : (ServiceEnvTypeDict.find(v => v.value === prop.stateForm.unit[formList.index].env[index].type)?.label || '-')
  },
  {
    title: '值',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      <>
        {
          prop.stateForm.unit[formList.index].env[index].type === ServiceEnvTypeEnum.Customize &&
          (
            prop.stateEdit
              ? <Form.Item className="no_margin"
                           name={ prop.stateEdit ? [ index, 'value' ] : undefined }
                           rules={ prop.stateForm.unit[formList.index].env[index].required ? formRule.unit.env.value : [] }>
                <Input maxLength={ 1000 }
                       placeholder="请输入值" allowClear />
              </Form.Item>
              : prop.stateForm.unit[formList.index].env[index].value || '-'
          )
        }
        {
          prop.stateForm.unit[formList.index].env[index].type === ServiceEnvTypeEnum.Config &&
          (
            prop.stateEdit
              ? <Form.Item className="no_margin"
                           name={ prop.stateEdit ? [ index, 'valueList' ] : undefined }
                           rules={ prop.stateForm.unit[formList.index].env[index].required ? formRule.unit.env.valueList : [] }>
                <Cascader placeholder="请选择 服务 / Unit / 配置项"
                          options={
                            prop.stateServiceList.map(v => ({
                              label: v.label,
                              value: v.value,
                              disabled: v.value === prop.stateForm.id || v.service_detail.units.length === 0,
                              children: v.service_detail.units.map(vv => {
                                const { unit, version } = getUnitVersion(prop, vv.unit_id, vv.version);
                                
                                return unit && version
                                  ? {
                                    label: unit.label,
                                    value: unit.value,
                                    disabled: version.config_info.length === 0,
                                    children: version.config_info.map(vvv => ({
                                      label: vvv.name,
                                      value: vvv.name
                                    }))
                                  }
                                  : {
                                    label: '无',
                                    value: '',
                                    disabled: true,
                                    children: []
                                  }
                              })
                            }))
                          } />
              </Form.Item>
              : (() => {
                const valueList = prop.stateForm.unit[formList.index].env[index].valueList;
                let service: any = null,
                  unit: any = null;
                
                if (!valueList) return '-';
                
                service = prop.stateServiceList.find(v => v.value === valueList?.[0]) || null;
                unit = service?.service_detail.units.find(v => v.unit_id === valueList?.[1]) || null;
                
                return `${ service?.label || '-' } / ${ prop.stateUnitList.find(v => v.value === unit?.unit_id)?.label || '-' } / ${ valueList?.[2] || '-' }`;
              })()
          )
        }
        {
          prop.stateForm.unit[formList.index].env[index].type === ServiceEnvTypeEnum.System &&
          (
            prop.stateEdit
              ? <Form.Item className="no_margin"
                           name={ prop.stateEdit ? [ index, 'valueList' ] : undefined }
                           rules={ prop.stateForm.unit[formList.index].env[index].required ? formRule.unit.env.valueList : [] }>
                <Cascader placeholder="请选择 服务 / Unit / 系统变量"
                          options={
                            [
                              {
                                label: `【当前服务】`,
                                value: 'this',
                                disabled: prop.stateForm.unit.length === 0,
                                children: prop.stateForm.unit
                                  .filter(v => v.id)
                                  .map(v => {
                                    const { unit, version } = getUnitVersion(prop, v.id[0], v.id[1]);
                                    
                                    return unit && version
                                      ? {
                                        label: unit.label,
                                        value: unit.value,
                                        disabled: version.exposes.length === 0 ||
                                                  unit.value === prop.stateForm.unit[formList.index].id[0],
                                        children: [
                                          {
                                            label: 'endpoint',
                                            value: 'endpoint'
                                          },
                                          {
                                            label: 'host',
                                            value: 'host'
                                          },
                                          ...version.exposes.map(vvv => ({
                                            label: `port_${ vvv.port }`,
                                            value: `port_${ vvv.port }`
                                          }))
                                        ]
                                      }
                                      : {
                                        label: '无',
                                        value: '',
                                        disabled: true,
                                        children: []
                                      }
                                  })
                              },
                              ...prop.stateServiceList
                                .filter(v => v.value !== prop.stateForm.id)
                                .map(v => ({
                                  label: v.label,
                                  value: v.value,
                                  disabled: v.value === prop.stateForm.id || v.service_detail.units.length === 0,
                                  children: v.service_detail.units.map(vv => {
                                    const { unit, version } = getUnitVersion(prop, vv.unit_id, vv.version);
                                    
                                    return unit && version
                                      ? {
                                        label: unit.label,
                                        value: unit.value,
                                        disabled: version.exposes.length === 0,
                                        children: [
                                          {
                                            label: 'endpoint',
                                            value: 'endpoint'
                                          },
                                          {
                                            label: 'host',
                                            value: 'host'
                                          },
                                          ...version.exposes.map(vvv => ({
                                            label: `port_${ vvv.port }`,
                                            value: `port_${ vvv.port }`
                                          }))
                                        ]
                                      }
                                      : {
                                        label: '无',
                                        value: '',
                                        disabled: true,
                                        children: []
                                      }
                                  })
                                }))
                            ]
                          } />
              </Form.Item>
              : (() => {
                const valueList = prop.stateForm.unit[formList.index].env[index].valueList;
                let service: any = null,
                  unit: any = null;
                
                if (!valueList) return '-';
                
                service = prop.stateServiceList.find(v => v.value === (valueList?.[0] !== 'this' ? valueList?.[0] : prop.stateForm.id)) || null;
                unit = service?.service_detail.units.find(v => v.unit_id === valueList?.[1]) || null;
                
                return `${ valueList?.[0] !== 'this' ? (service?.label || '-') : '【当前服务】' } / ${ prop.stateUnitList.find(v => v.value === unit?.unit_id)?.label || '-' } / ${ valueList?.[2] || '-' }`;
              })()
          )
        }
      </>
  },
  {
    title: '必填',
    width: 50,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateForm.unit[formList.index].env[index].required ? '是' : '否'
  },
  {
    title: '描述',
    width: 150,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateForm.unit[formList.index].env[index].description || '-'
  }
];
const tablePortList = (prop: any, formList: any) => [
  {
    title: '端口',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateForm.unit[formList.index].port[index].name || '-'
  },
  {
    title: '访问权限',
    width: 400,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ (prop.stateEdit && prop.stateForm.unit[formList.index].id) ? [ index, 'permission' ] : undefined }>
          <Radio.Group options={ ServiceAccessDict } />
        </Form.Item>
        : (ServiceAccessDict.find(v => v.value === prop.stateForm.unit[formList.index].port[index].permission)?.label || '-')
  },
  {
    title: '公网访问（唯一）',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin" valuePropName="checked"
                     name={ (prop.stateEdit && prop.stateForm.unit[formList.index].id) ? [ index, 'public' ] : undefined }>
          <Checkbox disabled={ !prop.stateForm.unit[formList.index].port[index].public && prop.stateForm.unit.some(v => v.port.some(vv => vv.public)) } />
        </Form.Item>
        : (prop.stateForm.unit[formList.index].port[index].public ? '是' : '否')
  },
];
const tableConfigList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    title: '配置名称',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'id' ] : undefined }
                     rules={ formRule.unit.config.id }>
          <Select options={ prop.stateConfigList }
                  placeholder="请选择配置"
                  onChange={ (value) => {
                    const data = { ...prop.stateForm };
                    
                    data.unit[formList.index].config[index].id = value;
                    data.unit[formList.index].config[index].pathSub = '';
                    prop.setStateForm(data);
                    prop.form.setFieldsValue(data);
                  } } />
        </Form.Item>
        : <Button type="link" className="no_padding ellipsis_button"
                  onClick={ () => prop.router.push(`/configs/config/${ prop.stateForm.unit[formList.index].config[index].id }`) }>
          { prop.stateConfigList.find(v => v.value === prop.stateForm.unit[formList.index].config[index].id)?.label || '-' }
        </Button>
  },
  {
    title: '键',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'pathSub' ] : undefined }>
          <Select options={ [
            {
              label: '全部',
              value: ''
            },
            ...(prop.stateConfigList.find(v => v.value === prop.stateForm.unit[formList.index].config[index].id)?.config || [])
          ] }
                  disabled={ !prop.stateForm.unit[formList.index].config[index].id }
                  placeholder="请选择子路径" />
        </Form.Item>
        : (prop.stateConfigList
             .find(v => v.value === prop.stateForm.unit[formList.index].config[index].id)?.config
             .find(v => v.value === prop.stateForm.unit[formList.index].config[index].pathSub)?.label || '全部')
  },
  {
    title: '容器挂载路径',
    width: prop.stateEdit ? 300 : 400,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'path' ] : undefined }
                     rules={ formRule.unit.config.path }>
          <Input maxLength={ 1000 }
                 placeholder="请输入容器挂载路径" allowClear />
        </Form.Item>
        : (prop.stateForm.unit[formList.index].config[index].path || '-')
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
                        
                        prop.stateForm.unit[formList.index].config.length--;
                        prop.setStateForm(prop.stateForm);
                      } } danger />
            </Space>
        }
      ]
      : []
  )
];
const tableDependList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    title: '服务',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'id' ] : undefined }
                     rules={ formRule.depend.id }>
          <Select options={ prop.stateServiceList.map(v => ({ ...v, disabled: v.value === prop.router.query.serviceId || prop.stateForm.depend.find(vv => vv.id === v.value) })) }
                  placeholder="请选择服务" />
        </Form.Item>
        : <Button type="link" className="no_padding ellipsis_button"
                  onClick={ () => prop.router.push(`/projects/project/${ prop.router.query.projectId }/service/${ prop.stateForm.depend[index].id }`) }>
          { prop.stateForm.depend[index].name || '-' }
        </Button>
  },
  {
    title: '描述',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateForm.depend[index].description || '-'
  },
  {
    title: '部署类型',
    width: 150,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateForm.depend[index].id
        ? Object
          .keys(UnitTypeEnum)
          .find(v => UnitTypeEnum[v] === prop.stateServiceList.find(v => v.value === prop.stateForm.depend[index].id)?.service_detail.instance_type)
        : '-'
  },
  {
    title: '状态',
    width: 150,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateForm.depend[index].id
        ? ServiceStateMap[prop.stateServiceList.find(v => v.value === prop.stateForm.depend[index].id)?.status]?.label
        : '-'
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
                        
                        prop.stateForm.depend.length--;
                        prop.setStateForm(prop.stateForm);
                      } } danger />
            </Space>
        }
      ]
      : []
  )
];
const tableDependencyList = (prop: any, formList: any): TableProps<any>['columns'] => [
  {
    title: '名称',
    width: 200,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateEdit
        ? <Form.Item className="no_margin"
                     name={ prop.stateEdit ? [ index, 'id' ] : undefined }
                     rules={ formRule.dependency.id }>
          <Select options={ prop.stateDependencyList.map(v => ({ ...v, disabled: v.value === prop.router.query.serviceId || prop.stateForm.dependency.find(vv => vv.id === v.value) })) }
                  placeholder="请选择服务" onChange={ (v, o: any) => {
            prop.stateForm.dependency[index].id = o.id
            prop.stateForm.dependency[index].desc = o.desc
            prop.setStateForm({ ...prop.stateForm });
            prop.form.setFieldValue('dependency', prop.stateForm.dependency);
          } } />
        </Form.Item>
        : <Button type="link" className="no_padding ellipsis_button"
                  onClick={ () => prop.router.push(`/dependencies/dependency/${ prop.stateForm.dependency[index].id }`) }>
          { prop.stateForm.dependency[index].name || '-' }
        </Button>
  },
  {
    title: '描述',
    width: 250,
    ellipsis: true,
    render: (value: any, record: FormListFieldData, index: number) =>
      prop.stateForm.dependency[index].desc || '-'
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
                        
                        prop.stateForm.dependency.length--;
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
      const { stateForm } = prop,
        data = formatFormData(prop);
      
      !stateForm.id
        ? requestCreate(prop, data)
        : requestUpdate(prop, data);
    })
    .catch(e => {
      prop.setStateCollapse([ 'unit', 'depend', 'config', 'dependency' ]);
      prop.setStateCollapseUnit(prop.stateForm.unit.map(v => v.key));
      showFormError(e);
    });
const requestServiceList = async (prop: any) =>
  prop.setStateServiceList([
    ...(await List.service({
      team_id: prop.team.id,
      project_id: prop.router.query.projectId
    }))
      .map(v => ({
        ...v,
        label: v.service_name,
        value: v.service_id
      }))
  ]);
const requestDependencyList = async (prop: any) =>
  prop.setStateDependencyList([
    ...(await List.serviceDependency({
      team_id: prop.team.id,
    }))
      .map(v => ({
        ...v,
        label: v.name,
        value: v.id
      }))
  ]);
const requestUnitList = async (prop: any) =>
  prop.setStateUnitList([
    ...(await List.unit({
      pre_id: prop.team.id,
      level: 0,
      with_public: true
    }))
      .map(v => ({
        ...v.unit_basic,
        label: `${ v.unit_basic.creator === '118952250293' ? '【系统】' : '' }${ v.unit_basic.unit_name }`,
        value: v.unit_basic.unit_id,
        children: v.versions.map(vv => ({
          ...vv,
          label: vv.unit_version,
          value: vv.version
        }))
      }))
  ]);
const requestRepoList = async (prop: any, type: UnitImageEnum) => {
  prop.stateRepoList[type] = [
    ...(await List.unitRepo({
      image_source: type,
      name: ''
    }))
      .map(v => ({
        label: v.name,
        value: v.name,
        children: v.tags.map(vv => ({
          label: vv,
          value: vv
        }))
      }))
  ];
  prop.setStateRepoList({ ...prop.stateRepoList });
};
const requestConfigList = async (prop: any) =>
  prop.setStateConfigList([
    ...(await List.unitConfig({
      team_id: prop.team.id
    }))
      .map(v => ({
        ...v,
        label: v.config_map_name,
        value: v.config_map_id,
        config: v.kvs
          ? Object
            .keys(v.kvs)
            .map(vv => ({
              label: vv,
              value: vv
            }))
          : []
      }))
  ]);
const requestCreate = async (prop: any, data: any) =>
  await createService(data)
    .then((response: any) => {
      const { router, setStateEdit } = prop;
      
      if (response.code !== 200) return;
      
      setStateEdit(false);
      // router.replace(`/projects/project/${ router.query.projectId }/service/${ response.data }`);
      router.push(`/projects/project/${ router.query.projectId }`);
      
      message.success('创建成功');
    })
    .catch(e => console.log(e));
const requestUpdate = async (prop: any, data: any) =>
  await updateService(data)
    .then((response: any) => {
      const {
        updateDetail,
        setStateEdit
      } = prop;
      
      if (response.code !== 200) return;
      
      setStateEdit(false);
      updateDetail();
      
      message.success('更新成功');
    })
    .catch(e => console.log(e));

export default function ServiceDetail(prop: any): ReactNode {
  const { detail, updateDetail } = prop;
  const router = useRouter();
  const { team } = useSelector((store: StoreType) => store);
  const [ stateEdit, setStateEdit ] = useState<boolean>(false);
  const [ stateServiceList, setStateServiceList ] = useState<any[]>([]);
  const [ stateUnitList, setStateUnitList ] = useState<any[]>([]);
  const [ stateDependencyList, setStateDependencyList ] = useState<any[]>([]);
  const [ stateRepoList, setStateRepoList ] = useState<Record<UnitImageEnum, any[]>>({
    [UnitImageEnum.Demo]: [] as any[],
    [UnitImageEnum.Public]: [] as any[],
    [UnitImageEnum.Model]: [] as any[]
  });
  const [ stateConfigList, setStateConfigList ] = useState<any[]>([]);
  const [ stateCollapse, setStateCollapse ] = useState<string[]>([ 'unit' ]);
  const [ stateCollapseUnit, setStateCollapseUnit ] = useState<string[]>([]);
  const [ stateForm, setStateForm ] = useState<FormInstanceType>({
    id: '',
    name: '',
    description: '',
    level: 1,
    preID: String(router.query.projectId),
    unit: [ getUnitItem() ],
    depend: [],
    dependency: []
  });
  const [ stateFormCache, setStateFormCache ] = useState<any>(null);
  const [ stateModalHistory, setStateModalHistory ] = useState<boolean>(false);
  const [ form ] = Form.useForm<FormInstance<FormInstanceType>>();
  const propData = {
    ...prop,
    router, team,
    stateEdit, setStateEdit,
    stateServiceList, setStateServiceList,
    stateUnitList, setStateUnitList,
    stateDependencyList, setStateDependencyList,
    stateRepoList, setStateRepoList,
    stateConfigList, setStateConfigList,
    stateCollapse, setStateCollapse,
    stateCollapseUnit, setStateCollapseUnit,
    stateForm, setStateForm,
    stateFormCache, setStateFormCache,
    stateModalHistory, setStateModalHistory,
    form
  };
  
  useEffect(() => {
    requestServiceList(propData);
    requestUnitList(propData);
    requestDependencyList(propData)
    Object.values(UnitImageEnum)
      .map(v => requestRepoList(propData, v));
    requestConfigList(propData);
  }, []);
  useEffect(() => {
    const isCreate: boolean = router.query.serviceId === 'create',
      path: string[] = router.asPath.split('#');
    
    if (isCreate) {
      setStateEdit(true);
    } else {
      if (stateUnitList.length === 0 ||
          stateServiceList.length === 0 ||
          stateConfigList.length === 0) return;
      
      if (path[1] === 'modify') {
        setStateEdit(true);
        router.push(path[0]);
      }
      
      setStateForm({
        ...stateForm,
        id: router.query.serviceId
          ? String(router.query.serviceId)
          : ''
      });
    }
    
    setStateModalHistory(false);
  }, [
    router.query.projectId, router.query.serviceId,
    stateUnitList, stateServiceList, stateConfigList
  ]);
  useEffect(() => {
    detail && setStateFormCache(detail);
  }, [ detail ]);
  useEffect(() => {
    if (!stateFormCache) return;
    
    formatFormDataReset(propData);
  }, [ stateFormCache ]);
  
  return <>
    {
      !stateForm.id &&
      <Divider />
    }
    <Form className={ Style.form } style={ { margin: stateForm.id ? '10px 0 0' : '0' } }
          form={ form } initialValues={ stateForm }
          onValuesChange={ v => setStateForm(_.merge({}, stateForm, v)) }>
      <Row gutter={ 10 } justify="space-between">
        <Col span={ 12 }>
          <Form.Item label="名称" name={ stateEdit ? 'name' : undefined }
                     rules={ formRule.name }>
            {
              stateEdit
                ? <Input maxLength={ 32 } showCount={ stateForm.name.length > 0 }
                         placeholder="请输入名称" disabled={ !!stateForm.id } allowClear />
                : stateForm.name || '-'
            }
          </Form.Item>
        </Col>
        {
          (!stateEdit && stateForm.id) &&
          <Col span={ 5 } style={ { textAlign: 'right' } }>
            <Button onClick={ () => setStateModalHistory(true) }>
              历史版本
            </Button>
          </Col>
        }
      </Row>
      <Row gutter={ 10 }>
        <Col span={ 12 }>
          <Form.Item label="描述" name={ stateEdit ? 'description' : undefined }>
            {
              stateEdit
                ? <Input maxLength={ 32 } showCount={ stateForm.description.length > 0 }
                         placeholder="请输入描述" allowClear />
                : stateForm.description || '-'
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
                ? <Button onClick={ () => router.push(`/projects/project/${ router.query.projectId }`) }>
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
            <Button type="primary"
                    onClick={ () => setStateEdit(true) }>
              修改
            </Button>
            <Button onClick={ () => router.push(`/projects/project/${ router.query.projectId }`) }>
              返回
            </Button>
          </>
      }
    </Space>
    <ModalHistory detail={ detail }
                  stateOpen={ stateModalHistory } setStateOpen={ setStateModalHistory } />
  </>;
}