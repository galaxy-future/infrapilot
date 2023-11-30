import {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  useSelector
} from 'react-redux';
import { useRouter } from 'next/router';
import {
  Row, Col,
  Button
} from 'antd';

import { RoleTypeEnum } from '@/lib/interfaces/team';
import type { StoreType } from '@/store';
import Style from './index.module.css';

export default function WalletBalance(): ReactNode {
  const router = useRouter();
  const { user, team } = useSelector((state: StoreType) => state);
  
  return <Row>
    <Col>
      <div className={ Style.title }>
        可用额度：
      </div>
      <div className={ Style.text }>
        <div className={ Style.balance }>
          <span>{ JSON.stringify(user.balance) }</span>点
        </div>
        {
          team.role === RoleTypeEnum.Creator &&
          <Button size="small" type="primary"
                  onClick={ () => router.push('/pay') }>
            充值
          </Button>
        }
      </div>
    </Col>
  </Row>
}