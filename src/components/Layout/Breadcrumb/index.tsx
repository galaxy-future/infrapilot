import React, {
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
  Breadcrumb
} from 'antd';

import type { RouterType } from '@/lib/interfaces/public';
import type { StoreType } from '@/store';
import { getProjectById } from '@/api/project';
import { getServiceById } from '@/api/service';
import { getUnit } from '@/api/unit';
import { getConfig } from '@/api/config';
import { getTemplate } from '@/api/template';
import { getDependency } from '@/api/dependency';
import Style from './index.module.css';

const filterRouter = (prop: any) => {
  const {
      router,
      platform, team,
      stateProject, stateService,
      stateUnit, stateConfig,
      stateTemplate, stateDependency
    } = prop,
    {
      projectId, serviceId,
      unitId, configId,
      templateId, dependencyId
    } = router.query,
    list: any[] = [],
    hasCurrentRouter = (l: RouterType[]) => {
      let hasRouter: boolean = false;
      
      l.forEach((v: RouterType) => {
        const title = {
          project: '',
          service: '',
          unit: '',
          config: '',
          template: '',
          dependency: ''
        };
        let href: string = v.href;
        
        if (v.href !== path &&
            !(v.children && hasCurrentRouter(v.children))) return;
        hasRouter = true;
        
        href.includes('[projectId]') &&
        (href = href.replace('[projectId]', projectId));
        href.includes('[serviceId]') &&
        (href = href.replace('[serviceId]', serviceId));
        href.includes('[unitId]') &&
        (href = href.replace('[unitId]', unitId));
        href.includes('[configId]') &&
        (href = href.replace('[configId]', configId));
        href.includes('[templateId]') &&
        (href = href.replace('[templateId]', templateId));
        href.includes('[dependencyId]') &&
        (href = href.replace('[dependencyId]', dependencyId));
        switch (v.href) {
          case '/projects/project/[projectId]':
            stateProject && (title.project = stateProject.project_name);
            projectId === 'create' && (title.project = '创建项目');
            
            list.push({
              title: title.project,
              click: () => {
                router.push(href);
              }
            });
            break;
          case '/projects/project/[projectId]/service/[serviceId]':
            stateService && (title.service = stateService.service_name);
            serviceId === 'create' && (title.service = '创建服务');
            
            list.push({
              title: title.service,
              click: () => {
                router.push(href);
              }
            });
            break;
          case '/units/unit/[unitId]':
            stateUnit && (title.unit = stateUnit.unit_name);
            unitId === 'create' && (title.unit = '创建Unit');
            
            list.push({
              title: title.unit,
              click: () => {
                router.push(href);
              }
            });
            break;
          case '/configs/config/[configId]':
            stateConfig && (title.config = stateConfig.config_map_name);
            configId === 'create' && (title.config = '创建配置');
            
            list.push({
              title: title.config,
              click: () => {
                router.push(href);
              }
            });
            break;
          case '/templates/template/[templateId]':
            stateTemplate && (title.template = stateTemplate.name);
            templateId === 'create' && (title.template = '创建模版');
            
            list.push({
              title: title.template,
              click: () => {
                router.push(href);
              }
            });
            break;
          case '/dependencies/dependency/[dependencyId]':
            stateDependency && (title.dependency = stateDependency.name);
            dependencyId === 'create' && (title.dependency = '创建依赖');
            
            list.push({
              title: title.dependency,
              click: () => {
                router.push(href);
              }
            });
            break;
          default:
            !(v.href === '/projects' && team.id === team.person.id) &&
            list.push({
              title: v.name,
              click: () => {
                router.push(href);
              }
            });
            break;
        }
      });
      
      return hasRouter;
    };
  let path = router.pathname;
  
  path === '/' && (path = '/projects');
  hasCurrentRouter(platform.router);
  
  list.reverse();
  
  return list;
};
const renderRouter = (item: any, params: any, items: any[], paths: string[]) =>
  !item.click
    ? item.title
    : <a onClick={ item.click }>
      { item.title }
    </a>;
const getProjectInfo = async (prop: any) => {
  const {
      router,
      stateProject, setStateProject
    } = prop,
    { projectId } = router.query;
  
  if (!projectId || projectId === 'create' ||
      (stateProject && (projectId === stateProject.project_id))) return;
  
  await getProjectById({
    project_id: projectId
  })
    .then((response: any) => {
      setStateProject(response.data);
    })
    .catch(e => console.log(e));
};
const getServiceInfo = async (prop: any) => {
  const {
      router,
      stateService, setStateService
    } = prop,
    { serviceId } = router.query;
  
  if (!serviceId || serviceId === 'create' ||
      (stateService && (serviceId === stateService.service_id))) return;
  
  await getServiceById({
    service_id: serviceId
  })
    .then((response: any) => {
      setStateService(response.data);
    })
    .catch(e => console.log(e));
};
const getUnitInfo = async (prop: any) => {
  const {
      router,
      stateUnit, setStateUnit
    } = prop,
    { unitId } = router.query;
  
  if (!unitId || unitId === 'create' ||
      (stateUnit && (unitId === stateUnit.unit_id))) return;
  
  await getUnit({
    unit_id: unitId
  })
    .then((response: any) => {
      setStateUnit(response.data);
    })
    .catch(e => console.log(e));
};
const getConfigInfo = async (prop: any) => {
  const {
      router, team,
      stateConfig, setStateConfig
    } = prop,
    { configId } = router.query;
  
  if (!configId || configId === 'create' ||
      (stateConfig && (configId === stateConfig.config_map_id))) return;
  
  await getConfig({
    team_id: team.id,
    config_map_id: configId
  })
    .then((response: any) => {
      setStateConfig(response.data);
    })
    .catch(e => console.log(e));
};
const getTemplateInfo = async (prop: any) => {
  const {
      router, team,
      stateTemplate, setStateTemplate
    } = prop,
    { templateId } = router.query;
  
  if (!templateId || templateId === 'create' ||
      (stateTemplate && (templateId === stateTemplate.template_id))) return;
  
  await getTemplate({
    template_id: templateId
  })
    .then((response: any) => {
      setStateTemplate(response.data);
    })
    .catch(e => console.log(e));
};
const getDependencyInfo = async (prop: any) => {
  const {
      router,
      stateDependency, setStateDependency
    } = prop,
    { dependencyId } = router.query;
  
  if (!dependencyId || dependencyId === 'create' ||
      (stateDependency && (dependencyId === stateDependency.id))) return;
  
  await getDependency({
    id: dependencyId,
  })
    .then((response: any) => {
      setStateDependency(response.data);
    })
    .catch(e => console.log(e));
};

export default function PublicBreadcrumb(prop: any): ReactNode {
  const router = useRouter();
  const { platform, team } = useSelector((state: StoreType) => state);
  const [ stateProject, setStateProject ] = useState<any>(null);
  const [ stateService, setStateService ] = useState<any>(null);
  const [ stateUnit, setStateUnit ] = useState<any>(null);
  const [ stateConfig, setStateConfig ] = useState<any>(null);
  const [ stateTemplate, setStateTemplate ] = useState<any>(null);
  const [ stateDependency, setStateDependency ] = useState<any>(null);
  const propData = {
    router, platform, team,
    stateProject, setStateProject,
    stateService, setStateService,
    stateUnit, setStateUnit,
    stateConfig, setStateConfig,
    stateTemplate, setStateTemplate,
    stateDependency, setStateDependency
  };
  
  useEffect(() => {
    getProjectInfo(propData);
    getServiceInfo(propData);
    getUnitInfo(propData);
    getConfigInfo(propData);
    getTemplateInfo(propData);
    getDependencyInfo(propData);
  }, [ router.pathname, router.query ]);
  
  return <Breadcrumb className={ Style.breadcrumb } separator=">"
                     items={ filterRouter(propData) }
                     itemRender={ renderRouter } />;
}