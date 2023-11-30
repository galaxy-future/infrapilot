import {
  type ReactNode,
  useEffect, useState
} from 'react';
import {
  useDispatch
} from 'react-redux';
import {
  type FormInstance, Form,
  Space, Button, Input,
  Modal, message, Tag
} from 'antd';
import {
  ExclamationCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import _ from 'lodash';

import {
  subscribe, getLicenseCode
} from '@/api/subscribe';
import { File } from '@/utils/public';
import Style from './index.module.css';

type FormInstanceType = {
  code: string;
  license: string;
};

const href: string = process.env.ENV_MODE === 'development'
  ? 'http://172.16.16.180:30080/license'
  : 'https://www.galaxy-future.com/license';
const clickOk = async (prop: any) =>
  prop.form.validateFields()
    .then(async () => {
      requestSubscribe(prop);
    })
    .catch(() => message.warning('表单校验失败'));
const clickCancel = (prop: any) => {
  const {
      setStateOpen, setStateForm,
      form
    } = prop,
    data = {
      code: '',
      license: ''
    };
  
  setStateForm(data);
  form.setFieldsValue(data);
  
  setStateOpen(false);
};
const requestSubscribe = async (prop: any) =>
  await subscribe({
    request_code: prop.stateForm.code,
    license: prop.stateForm.license
  })
    .then(response => {
      if (response.code !== 200) return;
      
      prop.storeDispatch({
        type: 'platform/setSubscribe',
        payload: response.data
      });
      clickCancel(prop);
      
      message.success('续订成功');
    })
    .catch(e => console.log(e));
const requestLicenseCode = async (prop: any) =>
  await getLicenseCode()
    .then(response => {
      if (response.code !== 200) return;
      
      prop.setStateForm({
        ...prop.stateForm,
        code: response.data
      });
    })
    .catch(e => console.log(e));

export default function ModalSubscribe(prop: any): ReactNode {
  const storeDispatch = useDispatch();
  const { stateOpen, setStateOpen } = prop;
  const [ stateForm, setStateForm ] = useState<FormInstanceType>({
    code: '',
    license: ''
  });
  const [ form ] = Form.useForm<FormInstance<FormInstanceType>>();
  const propData = {
    ...prop,
    storeDispatch,
    stateOpen, setStateOpen,
    stateForm, setStateForm,
    form
  };
  
  useEffect(() => {
    if (!stateOpen) return;
    requestLicenseCode(propData);
  }, [ stateOpen ]);
  
  return <Modal title="续订" footer={ null }
                open={ stateOpen } onCancel={ () => clickCancel(propData) }>
    <Tag className={ Style.box_tag } color="warning">
      <Space size={ 5 }>
        <ExclamationCircleOutlined />
        <div className="content">
          请复制下方的申请码，并前往官网
          <a href={ href }
             target="_blank">
            { href }
          </a>
          获取许可证，然后粘贴到下方的输入框进行订阅。
        </div>
      </Space>
    </Tag>
    <Form className={ Style.form } labelCol={ { span: 4 } }
          form={ form } initialValues={ stateForm }
          onValuesChange={ v => setStateForm(_.merge({}, stateForm, v)) }>
      <Form.Item label="申请码" name="code">
        <div style={ { padding: '5px 0 0' } }>
          { stateForm.code }
          <Button type="link" size="small" icon={ <CopyOutlined /> }
                  onClick={ () => File.copyClipboard(stateForm.code) }>
            复制
          </Button>
        </div>
      </Form.Item>
      <Form.Item label="许可证" name="license"
                 rules={ [ { required: true, message: '请输入许可证' } ] }>
        <Input.TextArea placeholder="请输入许可证"
                        maxLength={ 500 } style={ { height: 120 } } showCount />
      </Form.Item>
      <Form.Item className="no_margin"
                 wrapperCol={ { offset: 4 } }>
        <Space className="page_margin" size="small">
          <Button type="primary"
                  onClick={ () => clickOk(propData) }>
            订阅
          </Button>
          <Button onClick={ () => clickCancel(propData) }>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>;
}