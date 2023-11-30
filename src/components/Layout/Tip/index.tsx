import {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  useSelector
} from 'react-redux';
import {} from 'antd';
import DayJS from 'dayjs';

import type { StoreType } from '@/store';
import Style from './index.module.css';

let setTime: NodeJS.Timeout | null = null,
  isFirst: boolean = true;

export default function Tip(): ReactNode {
  const { platform } = useSelector((state: StoreType) => state);
  const [ stateTip, setStateTip ] = useState<string>('');
  
  const check = () => {
    const time: number = 60 * 60 * 24 * 30;
    
    if (isFirst) {
      isFirst = false;
      return;
    }
    
    (platform.subscribe.expire > DayJS().unix() + time) &&
    setStateTip('');
    (platform.subscribe.expire <= DayJS().unix() + time) &&
    setStateTip('许可证即将到期，请及时续订');
    (platform.subscribe.expire <= DayJS().unix()) &&
    setStateTip('许可证已经到期，部分功能暂停使用，请及时续订');
  };
  
  useEffect(() => {
    check();
    setTime && clearInterval(setTime);
    setTime = setInterval(() => {
      check();
    }, 30000);
    
    return () => {
      setTime && clearInterval(setTime);
    };
  }, [ platform.subscribe ]);
  
  return <>
  {
    stateTip &&
    <div className={ Style.box_tip }>
      { stateTip }
    </div>
  }
  </>;
}