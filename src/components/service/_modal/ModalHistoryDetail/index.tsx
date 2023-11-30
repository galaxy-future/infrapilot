import {
  type ReactNode, useEffect,
  useState
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  useRouter
} from 'next/router';
import {
  type DescriptionsProps, Descriptions,
  type CollapseProps, Collapse,
  type TableProps, Table,
  Typography,
  Modal, Button,
  Space, Row, Col
} from 'antd';
import * as NanoID from 'nanoid';

import { StoreType } from '@/store';
import { UnitBuildEnum, UnitImageEnum } from '@/lib/enums/unit';
import { ServiceAccessEnum, ServiceEnvTypeEnum } from '@/lib/enums/service';
import { ServiceAccessDict, ServiceEnvTypeDict } from '@/lib/interfaces/service';
import { List } from '@/utils/platform';
import {
  getVersionDetail
} from '@/api/service';
import Style from './index.module.css';

type FormUnitItem = {
  key: string;
  id: string[] | undefined;
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
type FormInstanceType = {
  id: string;
  name: string;
  description: string;
  level: 0 | 1;
  preID: string;
  unit: FormUnitItem[];
  depend: FormDependItem[];
};

const getID = () => NanoID.nanoid(5);
const formatFormDataReset = (prop: any): void => {
  const {
      setStateForm, stateFormCache,
      setStateCollapseUnit
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
      })) || []
    };
  
  // setStateCollapseUnit(formData.unit.map(v => v.key));
  setStateForm(formData);
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
const descriptionList = (prop: any): DescriptionsProps['items'] => [
  {
    label: '名称',
    span: 24,
    children: prop.stateForm.name || '-'
  },
  {
    label: '描述',
    span: 24,
    children: prop.stateForm.description || '-'
  },
  {
    label: '配置Unit',
    span: 24,
    children: <Collapse className={ Style.collapse }
                        activeKey={ prop.stateCollapseUnit }
                        items={ collapseUnitList(prop) }
                        onChange={ v => prop.setStateCollapseUnit(v) } bordered={ false } />
  },
  {
    label: '依赖服务',
    span: 24,
    children: prop.stateForm.depend?.length
      ? <Space size="small">
        {
          prop.stateForm.depend.map(v =>
            <Button key={ v.id } type="link" className="no_padding ellipsis_button"
                    onClick={ () => {
                      prop.router.push(`/projects/project/${ prop.router.query.projectId }/service/${ v.id }`);
                      clickCancel(prop);
                    } }>
              { v.name || '-' }
            </Button>
          )
        }
      </Space>
      : '-'
  }
];
const collapseUnitList = (prop: any): CollapseProps['items'] => [
  ...prop.stateForm.unit.map(v => ({
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
        {
          (() => {
            const [ unitID, versionID ] = v.id || [],
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
      </Col>
      {
        v.image.build === UnitBuildEnum.Image &&
        <>
          <Col offset={ 1 }>镜像：</Col>
          <Col>
            {
              v.image.type === UnitImageEnum.Public
                ? (v.image.input || '-')
                : <Row gutter={ [ 5, 0 ] } align="middle">
                  <Col>
                    {
                      prop.stateRepoList[v.image.type]
                        .find(vv => vv.value === v.image.name)
                        ?.label || '-'
                    }
                  </Col>
                  <Col>/</Col>
                  <Col>
                    {
                      prop.stateRepoList[v.image.type]
                        .find(vv => vv.value === v.image.name)
                        ?.children.find(vv => vv.value === v.image.select)
                        ?.label || '-'
                    }
                  </Col>
                </Row>
            }
          </Col>
        </>
      }
    </Row>,
    children: <Row gutter={ [ 0, 10 ] }>
      {
        v.env.length > 0 &&
        <Col span={ 24 }>
          <Table size="small"
                 title={ (currentPageData) =>
                   <Typography.Title className="no_margin"
                                     level={ 5 }>
                     环境变量
                   </Typography.Title>
                 }
                 columns={ tableEnvList(prop) }
                 dataSource={ v.env } pagination={ false } bordered />
        </Col>
      }
      <Col span={ 24 }>
        <Table size="small"
               title={ (currentPageData) =>
                 <Typography.Title className="no_margin"
                                   level={ 5 }>
                   访问控制
                 </Typography.Title>
               }
               columns={ tablePortList(prop) }
               dataSource={ v.port } pagination={ false } bordered />
      </Col>
      {
        v.config.length > 0 &&
        <Col span={ 24 }>
          <Table size="small"
                 title={ (currentPageData) =>
                   <Typography.Title className="no_margin"
                                     level={ 5 }>
                     关联配置
                   </Typography.Title>
                 }
                 columns={ tableConfigList(prop) }
                 dataSource={ v.config } pagination={ false } bordered />
        </Col>
      }
    </Row>
  }))
];
const tableEnvList = (prop: any): TableProps<any>['columns'] => [
  {
    dataIndex: 'name',
    title: '变量名',
    width: 150,
    ellipsis: true,
    render: v => v || '-'
  },
  {
    dataIndex: 'type',
    title: '类型',
    width: 100,
    ellipsis: true,
    render: v => ServiceEnvTypeDict.find(vv => vv.value === v)?.label || '-'
  },
  {
    dataIndex: 'value',
    title: '值',
    width: 200,
    ellipsis: true,
    render: (v: string, record: any) =>
      <>
        { record.type === ServiceEnvTypeEnum.Customize && (v || '-') }
        {
          record.type === ServiceEnvTypeEnum.Config &&
          (() => {
            let service: any = null,
              unit: any = null;
            
            if (!record.valueList) return '-';
            
            service = prop.stateServiceList.find(v => v.value === record.valueList?.[0]) || null;
            unit = service?.service_detail.units.find(v => v.unit_id === record.valueList?.[1]) || null;
            
            return `${ service?.label || '-' } / ${ prop.stateUnitList.find(v => v.value === unit?.unit_id)?.label || '-' } / ${ record.valueList?.[2] || '-' }`;
          })()
        }
        {
          record.type === ServiceEnvTypeEnum.System &&
          (() => {
            const valueList = record.valueList;
            let service: any = null,
              unit: any = null;
            
            if (!valueList) return '-';
            
            service = prop.stateServiceList.find(v => v.value === (valueList?.[0] !== 'this' ? valueList?.[0] : prop.stateForm.id)) || null;
            unit = service?.service_detail.units.find(v => v.unit_id === valueList?.[1]) || null;
            
            return `${ valueList?.[0] !== 'this' ? (service?.label || '-') : '【当前服务】' } / ${ prop.stateUnitList.find(v => v.value === unit?.unit_id)?.label || '-' } / ${ valueList?.[2] || '-' }`;
          })()
        }
      </>
  },
  {
    dataIndex: 'required',
    title: '必填',
    width: 50,
    ellipsis: true,
    render: v => v ? '是' : '否'
  },
  {
    dataIndex: 'description',
    title: '描述',
    width: 100,
    ellipsis: true,
    render: v => v || '-'
  }
];
const tablePortList = (prop: any) => [
  {
    dataIndex: 'name',
    title: '端口',
    width: 150,
    ellipsis: true,
    render: v => v || '-'
  },
  {
    dataIndex: 'permission',
    title: '访问权限',
    width: 300,
    ellipsis: true,
    render: v => ServiceAccessDict.find(vv => vv.value === v)?.label || '-'
  },
  {
    dataIndex: 'public',
    title: '公网访问（唯一）',
    width: 150,
    ellipsis: true,
    render: v => v ? '是' : '否'
  },
];
const tableConfigList = (prop: any): TableProps<any>['columns'] => [
  {
    dataIndex: 'id',
    title: '配置名称',
    width: 150,
    ellipsis: true,
    render: (v: string, record: any, index: number) =>
      <Button type="link" className="no_padding ellipsis_button"
              onClick={ () => prop.router.push(`/configs/config/${ v }`) }>
        { prop.stateConfigList.find(vv => vv.value === v)?.label || '-' }
      </Button>
  },
  {
    dataIndex: 'pathSub',
    title: '键',
    width: 150,
    ellipsis: true,
    render: v => v || '全部'
  },
  {
    dataIndex: 'path',
    title: '容器挂载路径',
    width: 300,
    ellipsis: true,
    render: v => v || '-'
  }
];
const clickCancel = (prop: any) => {
  const {
    setStateOpen, setStateForm
  } = prop;
  
  setStateOpen(false);
  setStateForm(null);
};
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
const requestVersionDetail = async (prop: any) =>
  await getVersionDetail({
    service_id: prop.data.id,
    version: prop.data.version
  })
    .then(response => {
      if (response.code !== 200) return;
      
      prop.setStateFormCache(response.data);
    })
    .catch(e => console.log(e));

export default function ModalHistory(prop: any): ReactNode {
  const {
    data,
    stateOpen, setStateOpen
  } = prop;
  const router = useRouter();
  const { team } = useSelector((store: StoreType) => store);
  const [ stateServiceList, setStateServiceList ] = useState<any[]>([]);
  const [ stateUnitList, setStateUnitList ] = useState<any[]>([]);
  const [ stateRepoList, setStateRepoList ] = useState<Record<UnitImageEnum, any[]>>({
    [UnitImageEnum.Demo]: [] as any[],
    [UnitImageEnum.Public]: [] as any[],
    [UnitImageEnum.Model]: [] as any[]
  });
  const [ stateConfigList, setStateConfigList ] = useState<any[]>([]);
  const [ stateCollapseUnit, setStateCollapseUnit ] = useState<string[]>([]);
  const [ stateForm, setStateForm ] = useState<FormInstanceType>({
    id: '',
    name: '',
    description: '',
    level: 1,
    preID: '',
    unit: [],
    depend: []
  });
  const [ stateFormCache, setStateFormCache ] = useState<any>(null);
  const propData = {
    ...prop,
    router, team,
    stateServiceList, setStateServiceList,
    stateUnitList, setStateUnitList,
    stateRepoList, setStateRepoList,
    stateConfigList, setStateConfigList,
    stateCollapseUnit, setStateCollapseUnit,
    stateForm, setStateForm,
    stateFormCache, setStateFormCache
  };
  
  useEffect(() => {
    if (!stateOpen) return;
    
    requestServiceList(propData);
    requestUnitList(propData);
    Object.values(UnitImageEnum)
      .map(v => requestRepoList(propData, v));
    requestConfigList(propData);
    requestVersionDetail(propData);
  }, [ stateOpen ]);
  useEffect(() => {
    if (!stateFormCache) return;
    
    formatFormDataReset(propData);
  }, [ stateFormCache ]);
  
  return <Modal title={ `版本详情：${ data.version }` } width={ 1000 } footer={ null }
                open={ stateOpen } onCancel={ () => clickCancel(propData) }>
    <div className={ Style.container }>
      {
        stateForm &&
        <Descriptions size="small" items={ descriptionList(propData) }
                      column={ 24 } colon={ false }
                      labelStyle={ { width: 100, textAlign: 'right' } }
                      style={ { minWidth: 800 } } bordered />
      }
    </div>
  </Modal>;
}