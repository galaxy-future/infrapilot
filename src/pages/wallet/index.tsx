import { type ReactNode } from 'react';
import {
  type TabsProps, Tabs,
  Card, Tooltip
} from 'antd';
import {
  ExclamationCircleOutlined
} from '@ant-design/icons';

import WalletBalance from '@/components/wallet/Balance';
import WalletTableBill from '@/components/wallet/TableBill';
import WalletTableRecharge from '@/components/wallet/TableRecharge';
import Style from './index.module.css';

const tabItem = (): TabsProps['items'] => [
  {
    key: 'bill',
    label: <>
      用量明细
      <Tooltip placement="right"
               title="说明：用量明细数据相对于实际消耗会有延迟，每小时更新一次">
        <ExclamationCircleOutlined className={ Style.icon } />
      </Tooltip>
    </>,
    children: <WalletTableBill />
  },
  // {
  //   key: 'recharge',
  //   label: '充值记录',
  //   children: <WalletTableRecharge />
  // }
];

export default function Wallet(): ReactNode {
  return <>
    {/*<Card>*/ }
    {/*  <WalletBalance />*/ }
    {/*</Card>*/ }
    <Card className={ Style.card }>
      <Tabs size="small" defaultActiveKey="bill"
            items={ tabItem() } />
    </Card>
  </>;
}