import {
  type ReactNode,
  useState
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  Modal,
  Form, Input,
  Space, Button,
  message
} from 'antd';

import { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import { createProject } from '@/api/project';
import Style from './index.module.css';

type FormInterfaceType = {
  name: string;
};

const formRule = {
  name: [ { required: true, message: '请输入项目名称' } ]
};
const addProject = async (prop: any) =>
  await createProject({
    team_id: prop.team.id,
    ...prop.stateForm
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      message.success('创建服务成功');
      
      prop?.updateData();
      clickCancel(prop);
    })
    .catch(e => message.error(e));
const clickOk = async (prop: any) =>
  await prop.form.validateFields()
    .then(() => {
      addProject(prop);
    })
    .catch(e => showFormError(e));
const clickCancel = (prop: any) => {
  const { setStateOpen, form } = prop;
  
  form.resetFields();
  setStateOpen(false);
};

export default function ModalAdd(prop: any): ReactNode {
  const {
    stateOpen, setStateOpen,
    updateData
  } = prop;
  const [ form ] = Form.useForm();
  const { team } = useSelector((state: StoreType) => state);
  const [ stateForm, setStateForm ] = useState<FormInterfaceType>({
    name: ''
  });
  
  return <Modal title="创建项目"
                open={ stateOpen } footer={ null }
                onCancel={ () => clickCancel({ setStateOpen, form }) }>
    <Form className="page_margin"
          form={ form } initialValues={ stateForm }
          labelCol={ { span: 4 } }
          onValuesChange={ (changedValues: any, values: FormInterfaceType) => setStateForm(values) }>
      <Form.Item name="name" label="项目名称"
                 rules={ formRule.name }>
        <Input maxLength={ 50 }
               placeholder="请输入项目名称" allowClear />
      </Form.Item>
      <Form.Item className="no_margin"
                 wrapperCol={ { offset: 4 } }>
        <Space size="small">
          <Button type="primary"
                  onClick={ () => clickOk({ setStateOpen, form, team, stateForm, updateData }) }>
            创建
          </Button>
          <Button onClick={ () => clickCancel({ setStateOpen, form }) }>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>;
}