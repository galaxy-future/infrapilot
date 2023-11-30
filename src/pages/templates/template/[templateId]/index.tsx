import {
  type ReactNode,
  useEffect, useState
} from 'react';
import { useRouter } from 'next/router';
import {
  type MenuProps,
  Card, Row, Col, Space,
  Typography, Button,
  Dropdown, Divider
} from 'antd';
import {
  LeftOutlined, RightOutlined
} from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import { List } from '@/utils/platform'
import { getTemplate } from '@/api/template';
import ModelDeployment from '@/components/template/_modal/ModelDeployment';
import Style from './index.module.css';

const versionList = (prop: any): MenuProps => ({
  items: prop.stateVersion.map(v => ({
    label: v.version,
    value: v.version,
    disabled: v.version === prop.stateForm.version
  })),
  onClick: (info: any) => prop.setStateForm({
    ...prop.stateForm,
    version: info.item.props.value
  })
});
const requestDetail = async (prop: any) =>
  await getTemplate({
    template_id: prop.stateForm.template_id,
    version: prop.stateForm.version
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      prop.setStateDetail(response.data);
      prop.setStateForm({
        ...prop.stateForm,
        name: response.data.name
      });
    })
    .catch(e => console.log(e));
const requestVersion = async (prop: any) =>
  prop.setStateVersion(await List.serviceTemplateVersion({
    template_id: prop.stateForm.template_id
  }));


export default function Template(prop: any): ReactNode {
  const router = useRouter();
  const [ stateForm, setStateForm ] = useState({
    template_id: router.query.templateId,
    name: '',
    version: ''
  });
  const [ stateDetail, setStateDetail ] = useState<any>(null);
  const [ stateVersion, setStateVersion ] = useState<any[]>([]);
  const [ stateVersionDropdown, setStateVersionDropdown ] = useState<boolean>(false);
  const [ stateModal, setStateModal ] = useState(false);
  const propData = {
    stateForm, setStateForm,
    stateDetail, setStateDetail,
    stateVersion, setStateVersion,
    stateVersionDropdown, setStateVersionDropdown,
    stateModal, setStateModal
  };
  
  useEffect(() => {
    requestVersion(propData);
  }, [ stateForm.template_id ]);
  useEffect(() => {
    if (stateVersion.length === 0) return;
    
    setStateForm({
      ...stateForm,
      version: stateVersion[0].version
    });
  }, [ stateVersion ]);
  useEffect(() => {
    if (!stateForm.version) return;
    
    requestDetail(propData);
  }, [ stateForm.version ]);
  
  return <>
    <Card className={ Style.detail }>
      {
        stateDetail &&
        <>
          <Row gutter={ 20 }>
            <Col>
              <img className={ Style.icon }
                   alt="" src={ stateDetail.icon } />
            </Col>
            <Col>
              <Typography.Title level={ 4 }
                                className="ellipsis">
                { stateDetail.name }
              </Typography.Title>
              <Dropdown.Button className={ Style.dropdown }
                               size="small" placement="bottomRight" overlayStyle={ { overflowY: 'auto', maxHeight: 300 } }
                               menu={ versionList(propData) } open={ stateVersionDropdown }
                               onOpenChange={ open => setStateVersionDropdown(open) }
                               onClick={ e => setStateVersionDropdown(!stateVersionDropdown) }>
                版本：{ stateForm.version }
              </Dropdown.Button>
              <Space className={ Style.box_button }
                     size={ 10 }>
                <Button type="primary" size="small"
                        onClick={ () => setStateModal(true) }>
                  部署
                </Button>
                {/*{*/ }
                {/*  stateDetail.download_url &&*/ }
                {/*  <Button size="small"*/ }
                {/*          href={ stateDetail.download_url } download={ `${ stateDetail.name }.zip` }>*/ }
                {/*    下载*/ }
                {/*  </Button>*/ }
                {/*}*/ }
              </Space>
            </Col>
          </Row>
          <Divider />
          <section className={ Style.box_content }>
            <Typography.Title level={ 5 }>
              应用描述
            </Typography.Title>
            <div className={ Style.content }>
              { stateDetail.description }
            </div>
          </section>
          <Divider />
          <section className={ Style.box_content }>
            <Typography.Title level={ 5 }>
              应用预览
            </Typography.Title>
            <div className={ [ Style.content, Style.box_preview ].join(' ') }>
              <Swiper speed={ 600 } spaceBetween={ 20 } slidesPerView={ 2 }
                      modules={ [ Navigation, Pagination ] }
                      navigation={ {
                        prevEl: `.${ Style.box_preview } .${ Style.button_prev }`,
                        nextEl: `.${ Style.box_preview } .${ Style.button_next }`,
                        disabledClass: Style.button_disabled
                      } }
                      pagination={ { clickable: true } }>
                {
                  stateDetail.previews.map(v =>
                    <SwiperSlide key={ v.image_url }>
                      <img alt="" src={ v.image_url } />
                    </SwiperSlide>
                  )
                }
              </Swiper>
              <Button type="link" className={ Style.button_prev }
                      icon={ <LeftOutlined /> } />
              <Button type="link" className={ Style.button_next }
                      icon={ <RightOutlined /> } />
            </div>
          </section>
          <Divider />
          <section className={ Style.box_content }>
           <Typography.Title level={ 5 }>
              使用教程
            </Typography.Title>
            <div className={ Style.content }>
              { stateDetail.user_guide }
            </div>
          </section>
        </>
      }
    </Card>
    <ModelDeployment detail={ stateForm }
                     stateOpen={ stateModal } setStateOpen={ setStateModal } />
  </>;
}