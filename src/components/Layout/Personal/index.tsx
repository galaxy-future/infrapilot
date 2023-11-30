import type { ReactNode } from 'react';
import {
  useSelector
} from 'react-redux';
import { useRouter } from 'next/router';
import {
  Typography,
  Button
} from 'antd';

import type { StoreType } from '@/store';
import { RoleTypeDict } from '@/lib/interfaces/team';
import Style from './index.module.css';

export default function PublicPersonal(prop: any): ReactNode {
  const router = useRouter();
  const { user, team } = useSelector((state: StoreType) => state);
  
  return <div className={ Style.box_user }>
    <div className={ Style.info }>
      <div className={ Style.icon }>
        {
          team.id !== team.person.id &&
          <span>
            { RoleTypeDict.find(v => v.value === team.role)?.label }
          </span>
        }
      </div>
    </div>
    <Typography.Title className={ Style.name }
                      level={ 5 }>
      { user.name }
    </Typography.Title>
    {/*<Button className={ Style.point } type="link"*/ }
    {/*        onClick={ () => router.push('/wallet') }>*/ }
    {/*  <span>{ JSON.stringify(user.balance) || 0 }</span>点*/ }
    {/*</Button>*/ }
  </div>;
}