import {
  type ReactNode,
  useEffect
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  type FormRule,
  Button,
  Row, Col, Space,
  Form, Select,
  message, Modal,
} from 'antd';

import { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import { RoleTypeDict, RoleTypeEnum } from '@/lib/interfaces/team';
import { enableTeamManager, disableTeamManager } from '@/api/team';
import Style from './index.module.css';

type FormType = {
  id: string;
  name: string;
  role: RoleTypeEnum;
};

const FormRule: Record<string, FormRule[]> = {
  name: [ { required: true, message: '用户名不可为空' } ],
  role: [ { required: true, message: '角色不可为空' } ]
};
let flagUpdateRole = false;

export default function TeamModelEdit(prop: any): ReactNode {
  const { team } = useSelector((store: StoreType) => store);
  const [ form ] = Form.useForm();
  
  const clickSubmit = () => {
    form.validateFields()
      .then((value: FormType) => {
        updateRole();
      })
      .catch(e => showFormError(e));
  };
  const clickCancel = () => {
    form.resetFields();
    prop.switchOpen?.(false);
  };
  
  const updateRole = async () => {
    const data = form.getFieldsValue();
    let request: any = null,
      role = '';
    
    if (flagUpdateRole) return;
    flagUpdateRole = true;
    
    switch (data.role) {
      case RoleTypeEnum.Manager:
        request = enableTeamManager;
        break;
      case RoleTypeEnum.Member:
        request = disableTeamManager;
        break;
    }
    
    await request?.({
        team_id: team.id,
        target_id: prop.userInfo?.key
      })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        clickCancel();
        prop.updateList?.();
        
        message.success('变更成功');
      })
      .finally(() => {
        flagUpdateRole = false;
      });
  };
  
  const footerDom: ReactNode[] = [
    <Row key={ 1 } gutter={ 50 }
         justify="center">
      <Col>
        <Button onClick={ clickCancel }>
          取消
        </Button>
      </Col>
      <Col>
        <Button type="primary"
                onClick={ clickSubmit }>
          确定
        </Button>
      </Col>
    </Row>
  ];
  
  useEffect(() => {
    (prop.open && prop.userInfo) &&
    form.setFieldsValue({ ...prop.userInfo });
  }, [ prop.open ]);
  
  return <Modal title="修改成员角色" open={ prop.open } footer={ null }
                onCancel={ clickCancel }>
    <Form name="formEdit" form={ form }
          onFinish={ clickSubmit }>
      <Row gutter={ 10 }>
        <Col span={ 12 }>
          <Form.Item>
            { prop.userInfo?.name || '用户名' }
          </Form.Item>
        </Col>
        <Col span={ 12 }>
          <Form.Item name="role" rules={ FormRule.role }>
            <Select options={ RoleTypeDict.filter(v => v.value !== RoleTypeEnum.Creator) } />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item className="no_margin">
        <Space size="small">
          <Button type="primary"
                  onClick={ clickSubmit }>
            确定
          </Button>
          <Button onClick={ clickCancel }>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>;
}