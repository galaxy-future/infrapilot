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
import DayJS from 'dayjs';

import { PipelineTypeMap } from '@/lib/maps/pipeline';
import { getLog } from '@/api/deployment';
import Style from './index.module.css'

interface LogViewModalProps {
  show: boolean;
  log: any;
  detail: any;
  onModalData: ({ show }: {
    data?: object;
    show: boolean
  }) => void;
}

let setTime: any = null,
  interval: number = 5000;

export default function ModalLogPipeline(props: LogViewModalProps) {
  const {
    log, show,
    detail, onModalData
  } = props;
  const [ logs, setLogs ] = useState<any[]>([]);
  
  const getData = () => {
    getLog({
      pipeline_id: log.pipeline_id,
    })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        setLogs(response.data);
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
    (detail && log) &&
    <Modal open={ show } width={ 1000 } footer={ null }
           title={ `服务名称：${ detail.service_name }，变更类型：${ PipelineTypeMap[log.type] }，服务版本：${ log.new_version }` }
           onCancel={ () => {
             handleCancel();
             clearInterval(setTime);
           } } destroyOnClose>
      <Row justify="space-between">
        <Col style={ { display: 'flex', alignItems: 'center' } }>
          {/*<InfoCircleOutlined style={ { margin: '0 5px 0 0' } } />*/ }
          {/*最多显示最新时间的500条日志*/ }
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
        <pre style={ { margin: 0, color: '#ffffff' } }>
          {
            logs.map((v, i) =>
              <div key={ i }
                   className={ Style.message }>
                { `[${ DayJS(v.update_at * 1000).format('YYYY.MM.DD HH:mm:ss') }] [${ v.unit_name }] ` + v.message + (v.detail ? ':' + v.detail : '') }
              </div>
            )
          }
        </pre>
      </div>
    </Modal>
  );
}