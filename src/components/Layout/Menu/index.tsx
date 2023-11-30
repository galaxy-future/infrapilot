import React, {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  useSelector
} from 'react-redux';
import { useRouter } from 'next/router';
import {
  Menu
} from 'antd';

import type { RouterType } from '@/lib/interfaces/public';
import type { StoreType } from '@/store';

import Style from './index.module.css';

const filterRouter = (prop: any) => {
  const { router, platform, setStateSelectList } = prop,
    list: any[] = [],
    hasCurrentRouter = (l: RouterType[]) => {
      let hasRouter: boolean = false;
      
      l.forEach((v: RouterType) => {
        let href: string = v.href;
        
        if (v.href !== path &&
            !(v.children && hasCurrentRouter(v.children))) return;
        hasRouter = true;
        
        list.push({
          title: v.name,
          href: v.href,
          click: () => {
            router.push(href);
          }
        });
      });
      
      return hasRouter;
    };
  let path = router.pathname;
  
  path === '/' && (path = '/projects');
  hasCurrentRouter(platform.router);
  
  list.reverse();
  
  setStateSelectList(list.length ? [ list[0].href ] : []);
};
const menuItemList = (prop: any) =>
  prop.platform.router
    .filter((v: any) => {
      if (v.menuHidden) return false;
      if (v.href === '/team' && prop.team.id === prop.team.person.id) return false;
      return true;
    })
    .map((v: any) => {
      let name: string = v.menuName || v.name,
        href: string = v.href;
      
      if (v.href === '/projects' && prop.team.id === prop.team.person.id) {
        name = '服务';
        href = `/projects/project/${ prop.team.person.project.id }`;
      }
      
      return {
        key: href,
        title: v.menuName || v.name,
        label: <div className={ Style.menu_item }>
          <v.icon />
          <div>{ name }</div>
        </div>
      };
    });
const clickMenuItem = (prop: any) =>
  (item: any) => {
    const { router, setStateSelectList } = prop;
    
    router.push(item.key);
    setStateSelectList([ item.key ]);
  };

export default function PublicMenu(prop: any): ReactNode {
  const router = useRouter();
  const { platform, team } = useSelector((state: StoreType) => state);
  const [ stateSelectList, setStateSelectList ] = useState<string[]>([]);
  const propData = {
    router,
    platform, team,
    stateSelectList, setStateSelectList
  };
  
  useEffect(() => {
    filterRouter(propData);
    
    (team.id === team.person.id && router.pathname === '/projects/project/[projectId]') &&
    setStateSelectList([ `/projects/project/${ team.person.project.id }` ]);
  }, [ router.pathname ]);
  
  return <Menu mode="inline" className={ Style.menu }
               selectedKeys={ stateSelectList }
               items={ menuItemList(propData) }
               onClick={ clickMenuItem(propData) } />;
}