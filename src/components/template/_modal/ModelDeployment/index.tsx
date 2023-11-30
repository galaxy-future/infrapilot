import {
  type ReactNode, useEffect,
  useState
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  useRouter
} from 'next/router';
import {
  type FormProps, Form,
  Space, Button, Select,
  Modal, message
} from 'antd';
import _ from 'lodash';

import { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import {
  getProjectList
} from '@/api/project';
import {
  deploymentTemplate
} from '@/api/template';
import Style from './index.module.css';

type FormInterfaceType = {
  project: string | undefined;
  template: string;
  name: string;
  version: string;
};

const formRule = {
  project: [ { required: true, message: '请选择项目' } ]
};
const getName = () => Math.random().toString(36).slice(7);
const clickOk = async (prop: any) => {
  const {
    form
  } = prop;
  
  prop.form.validateFields()
    .then(() => {
      deploy(prop);
    })
    .catch(e => showFormError(e));
};
const clickCancel = (prop: any) => {
  const {
    setStateOpen, stateSetShow,
    setStateList, setStateForm
  } = prop;
  
  setStateOpen(false);
  stateSetShow(false);
  setStateList([]);
  setStateForm({
    project: '',
    template: '',
    name: '',
    version: ''
  });
};
const requestProjectList = async (prop: any) =>
  await getProjectList({
    team_id: prop.team.id,
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      prop.setStateList(
        response.data.list
          ? response.data.list.map(v => ({
            ...v,
            label: v.project_name,
            value: v.project_id
          }))
          : []
      );
    })
    .catch(e => console.log(e));
const deploy = async (prop: any) =>
  await deploymentTemplate({
    deploy: true,
    level: 1,
    pre_id: prop.stateForm.project,
    template_id: prop.stateForm.template,
    service_name: prop.stateForm.name,
    version: prop.stateForm.version
  })
    .then((response: any) => {
      if (response.code !== 200) return;
      
      message.success('部署成功');
      
      clickCancel(prop);
      prop.router.push(`/projects/project/${ prop.stateForm.project }/service/${ response.data.service_id }?tab=deployment`);
    })
    .catch(e => console.log(e));

export default function ModelDeployment(prop: any): ReactNode {
  const {
    detail,
    stateOpen, setStateOpen
  } = prop;
  const router = useRouter();
  const { team } = useSelector((store: StoreType) => store);
  const [ stateShow, stateSetShow ] = useState<boolean>(false);
  const [ stateList, setStateList ] = useState<any[]>([]);
  const [ stateForm, setStateForm ] = useState<FormInterfaceType>({
    project: undefined,
    template: '',
    name: '',
    version: ''
  });
  const [ form ] = Form.useForm();
  const propData = {
    ...prop,
    router, team,
    stateShow, stateSetShow,
    stateList, setStateList,
    stateForm, setStateForm,
    form
  };
  
  useEffect(() => {
    if (!stateOpen) return;
    
    if (team.id === team.person.id) {
      setStateOpen(false);
      stateForm.project = team.person.project.id;
      stateForm.template = detail.template_id;
      stateForm.name = detail.name + '-' + getName();
      stateForm.version = detail.version;
      
      setStateForm({ ...stateForm });
      deploy(propData);
    } else {
      stateSetShow(true);
      
      setStateForm({
        ...stateForm,
        name: detail.name + '-' + getName(),
        template: detail.template_id,
        version: detail.version
      });
      requestProjectList(propData);
    }
  }, [ stateOpen ]);
  
  return <Modal title="部署" footer={ null }
                open={ stateShow } onCancel={ () => clickCancel(propData) }>
    <Form className="page_margin"
          form={ form } initialValues={ stateForm }
          labelCol={ { span: 4 } }
          onValuesChange={ v => setStateForm(_.merge({}, stateForm, v)) }>
      <Form.Item name="project" label="项目名称"
                 rules={ formRule.project }>
        <Select placeholder="请选择项目"
                options={ stateList } allowClear />
      </Form.Item>
      <Form.Item className="no_margin"
                 wrapperCol={ { offset: 4 } }>
        <Space size="small">
          <Button type="primary"
                  onClick={ () => clickOk(propData) }>
            部署
          </Button>
          <Button onClick={ () => clickCancel(propData) }>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>;
}