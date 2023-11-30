import {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  Modal,
  Row, Col,
  Button
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';


import { getPodLogs } from '@/api/deployment';

interface LogViewModalProps {
  pod: any;
  show: boolean;
  onModalData: ({ show }: {
    data?: object;
    show: boolean
  }) => void;
}

let setTime: any = null,
  interval: number = 5000;

export default function ModalLogInstance(props: LogViewModalProps) {
  const { pod, show, onModalData } = props;
  const [ logs, setLogs ] = useState('');
  
  const getData = () => {
    getPodLogs({
      cluster_id: pod.cluster_id,
      pod_name: pod.name,
    })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        setLogs(response.data.logs);
      })
      .catch(e => console.log(e));
  };
  
  const loop = () => {
    getData();
    
    clearInterval(setTime);
    setTime = setInterval(() => {
      getData();
    }, interval);
  };
  
  const handleOk = () => {
    onModalData({ show: false });
  };
  
  const handleCancel = () => {
    onModalData({ show: false });
  };
  
  useEffect(() => {
    show && loop();
    
    return () => {
      clearInterval(setTime);
    };
  }, [ show ]);
  
  return (
    pod &&
    <Modal open={ show } width={ 1000 }
           title={ pod.name }
           footer={ null }
           onCancel={ () => {
             handleCancel();
             clearInterval(setTime);
           } }
           destroyOnClose>
      <Row justify="space-between">
        <Col style={ { display: 'flex', alignItems: 'center' } }>
          <InfoCircleOutlined style={ { margin: '0 5px 0 0' } } />
          最多显示最新时间的500条日志
        </Col>
        <Col>
          <Button type="primary"
                  onClick={ () => getData() }>
            刷新
          </Button>
        </Col>
      </Row>
      <div style={ {
        overflowY: 'auto',
        height: 446,
        padding: 20,
        margin: '10px 0 0',
        background: '#000000',
        borderRadius: '5px'
      } }>
        <pre style={ {
          margin: 0,
          color: '#ffffff'
        } }>
          { logs }
        </pre>
      </div>
    </Modal>
  );
}