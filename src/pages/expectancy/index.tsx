import {
  type ReactNode,
  useRef, useState, useEffect
} from 'react';
import {
  Result, Typography
} from 'antd';
import {
  SmileOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Expectancy(): ReactNode {
  const time = useRef(3);
  const [ countdown, setCountdown ] = useState(time.current);
  
  useEffect(() => {
    let setTime = setInterval(() => {
      if (time.current <= 0) {
        clearInterval(setTime);
        
        location.href = 'https://apps.galaxy-future.com/';
        return;
      }
      
      time.current -= 1;
      setCountdown(time.current);
    }, 1000);
    
    return () => {
      clearInterval(setTime);
    };
  }, []);
  
  return (
    <>
            <Result icon={ <SmileOutlined /> }
                    title="功能内测中，敬请期待！"
                    extra={
                      <Title level={ 5 }>
                        { countdown } 秒后返回<br />星汉未来应用市场
                      </Title>
                    } />
        </>
  );
};