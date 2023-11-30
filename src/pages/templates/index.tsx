import {
  type ReactNode,
  useRef, useState, useEffect
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  useRouter
} from 'next/router';
import {
  Row, Col, Space,
  Card, Typography,
  Pagination, Progress, Button,
  message
} from 'antd';
import {
  LoadingOutlined
} from '@ant-design/icons';

import type { StoreType } from '@/store';
import {
  getTemplateList, uploadTemplate
} from '@/api/template';
import ModelDeployment from '@/components/template/_modal/ModelDeployment';
import Style from './index.module.css';

const upload = (prop: any) => {
  const {
      refUpload,
      stateUpload, setStateUpload
    } = prop,
    file: File | null = refUpload.current?.files[0] || null;
  let isActive: boolean = true;
  
  refUpload.current && (refUpload.current.files = new DataTransfer().files);
  
  if (!file) return;
  if ((!file.name.endsWith('.zip') || file.type !== 'application/zip') &&
      (!file.name.endsWith('.gz') || file.type !== 'application/x-gzip')) {
    isActive = false;
    message.warning('文件格式错误，请上传zip格式的文件');
  }
  
  setStateUpload({
    ...stateUpload,
    file: isActive ? file : null,
    active: isActive
  });
};
const requestGetList = async (prop: any) =>
  await getTemplateList({
    page: prop.statePagination.current,
    page_size: prop.statePagination.pageSize
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      prop.setStatePagination({
        ...prop.statePagination,
        total: response.data.total
      });
      prop.setStateList(
        response.data.templates
          ? response.data.templates
          : []
      );
    })
    .catch(e => console.log(e));
const requestUpload = async (prop: any) =>
  await uploadTemplate({
    template: prop.stateUpload.file,
    secret_name: ''
  })
    .then((response: any) => {
      const data = response.data.split('\n')
        .filter(v => v).pop()
        .split(':');
      
      prop.setStatePagination({
        ...prop.statePagination,
        current: 1
      });
      
      prop.setStateUpload({
        file: null,
        active: false,
        progress: 0
      });
      
      data[1].includes('成功')
        ? message.success(data[1] + data[2])
        : message.error(data[1] + data[2]);
    })
    .catch(e => console.log(e));

export default function Templates(): ReactNode {
  const router = useRouter();
  const refUpload = useRef(null);
  const { team } = useSelector((state: StoreType) => state);
  const [ stateList, setStateList ] = useState<any[]>([]);
  const [ statePagination, setStatePagination ] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number, range: [ number, number ]) => `总数：${ total }条`,
    onChange: (page: number, pageSize: number) => {
      statePagination.pageSize !== pageSize &&
      (page = 1);
      
      setStatePagination({
        ...statePagination,
        current: page,
        pageSize
      });
    }
  });
  const [ stateUpload, setStateUpload ] = useState({
    file: null as any,
    active: false,
    progress: 0
  });
  const [ stateModal, setStateModal ] = useState(false);
  const [ stateModelDate, setStateModelDate ] = useState({
    template_id: '',
    name: '',
    version: ''
  });
  const propData = {
    router, team,
    refUpload,
    stateList, setStateList,
    statePagination, setStatePagination,
    stateUpload, setStateUpload,
    stateModal, setStateModal,
    stateModelDate, setStateModelDate
  };
  
  useEffect(() => {
    requestGetList(propData);
  }, [
    statePagination.current, statePagination.pageSize
  ]);
  useEffect(() => {
    if (!stateUpload.file) return;
    
    requestUpload(propData);
  }, [ stateUpload.file ]);
  
  return <>
    <Card>
      <Row justify="space-between">
        <Col>
          <Typography.Title className="page_title"
                            level={ 2 }>
            模版市场
          </Typography.Title>
        </Col>
        <Col span={ 5 }>
          <div className={ Style.box_upload }>
            <input ref={ refUpload } type="file"
                   onChange={ () => upload(propData) } hidden />
            {
              !stateUpload.active
                ? <Button type="primary"
                          onClick={ () => (refUpload.current as any)?.click() }>
                  导入
                </Button>
                : <div className={ Style.upload }>
                  <div className={ `${ Style.upload_title } ellipsis` }>
                    <LoadingOutlined style={ { margin: '0 5px 0 0', color: '#108ee9' } } />
                    上传中：{ stateUpload.file.name }
                  </div>
                  {/*<Progress percent={ stateUpload.progress } status="active"*/ }
                  {/*          strokeColor={ { from: '#108ee9', to: '#87d068' } } />*/ }
                  <div className={ Style.upload_tip }>
                    上传时请勿切换或关闭页面
                  </div>
                </div>
            }
          </div>
        </Col>
      </Row>
      <Row gutter={ [ 20, 20 ] } className="page_margin">
        {
          stateList.map((v: any, i: number) =>
            <Col key={ v.template_id } span={ 8 }>
              <div className={ Style.card }
                   onClick={ () => router.push(`/templates/template/${ v.template_id }`) }>
                <div className={ Style.cover }
                     style={ { backgroundImage: `url(${ v.previews[0]?.image_url || '' })` } } />
                <div className={ Style.icon }>
                  <i style={ { backgroundImage: `url(${ v.icon || '' })` } } />
                </div>
                <div className={ Style.content }>
                  <div className={ `${ Style.title } ellipsis` }>
                    { v.name }
                  </div>
                  <div className={ `${ Style.text } ellipsis` }>
                    { v.description }
                  </div>
                  <Row justify="space-between">
                    <Col>
                      <div className={ Style.version }>
                        { v.version }
                      </div>
                    </Col>
                    <Col>
                      <Space size="small">
                        <Button type="primary" size="small"
                                onClick={ e => {
                                  e.stopPropagation();
                                  
                                  setStateModelDate({
                                    template_id: v.template_id,
                                    name: v.name,
                                    version: v.version
                                  });
                                  setStateModal(true);
                                } }>
                          部署
                        </Button>
                        {/*{*/ }
                        {/*  v.download_url &&*/ }
                        {/*  <Button size="small"*/ }
                        {/*          href={ v.download_url } download={ `${ v.name }.zip` }*/ }
                        {/*          onClick={ e => e.stopPropagation() }>*/ }
                        {/*    下载*/ }
                        {/*  </Button>*/ }
                        {/*}*/ }
                      </Space>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          )
        }
        <Col span={ 24 } style={ { textAlign: 'right' } }>
          <Pagination { ...statePagination } />
        </Col>
      </Row>
    </Card>
    <ModelDeployment detail={ stateModelDate }
                     stateOpen={ stateModal } setStateOpen={ setStateModal } />
  </>;
};