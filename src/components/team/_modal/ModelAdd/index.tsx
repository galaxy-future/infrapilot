import {
  type ReactNode,
  useRef, useEffect, useDeferredValue
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  type FormRule, type InputRef,
  Modal, Tooltip,
  Row, Col, Button,
  Form, Input, Select,
  Space, message,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined
} from '@ant-design/icons';

import type { StoreType } from '@/store';
import { showFormError } from '@/utils/public';
import { RoleTypeEnum, RoleTypeDict } from '@/lib/interfaces/team';
import {
  addTeamMember, checkTeamManager
} from '@/api/team';
import Style from './index.module.css';

type FormInviteItemType = {
  name: string; // 用户名
  role: RoleTypeEnum; // 角色
};
type FormType = {
  invite: FormInviteItemType[]; // 邀请
};

const fromInviteItemInit: FormInviteItemType = {
  name: '',
  role: RoleTypeEnum.Member
};
let flagAddItem = false;

export default function TeamModelAdd(prop: any): ReactNode {
  const { team } = useSelector((state: StoreType) => state);
  const refName = useRef<{ exist: string[], noExist: string[] }>({
    exist: [],
    noExist: []
  });
  const refInput = useRef<InputRef>(null);
  const deferredOpen = useDeferredValue(prop.open);
  const [ form ] = Form.useForm();
  
  const formInviteItemRule: Record<string, FormRule[]> = {
    name: [
      { required: true, message: '用户名不可为空' },
      {
        validator: async (rule: any, value: string) => {
          return (
            form.getFieldValue('invite')
              .filter((v: FormInviteItemType) => v.name === value)
              .length === 1
          )
            ? Promise.resolve()
            : Promise.reject();
        },
        message: '此用户名已重复'
      },
      // {
      //   validator: async (rule: any, value: string) => {
      //     if (value.length !== 11) return Promise.resolve();
      //
      //     return checkName(value);
      //   },
      //   message: '此用户名已添加'
      // }
    ],
    role: [ { required: true, message: '角色不可为空' } ]
  };
  const clickSubmit = () => {
    form.validateFields()
      .then((value: FormType) => {
        if (value.invite.length === 0) {
          message.warning('邀请人数不可为0');
          return;
        }
        
        addItem();
      })
      .catch(e => showFormError(e));
  };
  const clickCancel = () => {
    refName.current.noExist.length = 0;
    refName.current.exist.length = 0;
    
    form.resetFields();
    prop.switchOpen?.(false);
  };
  const checkName = async (name: string) => {
    if (refName.current.noExist.includes(name)) return Promise.resolve();
    if (refName.current.exist.includes(name)) return Promise.reject();
    
    return await checkTeamManager({
      team_id: team.id,
      invitees: [
        {
          name,
          role: RoleTypeEnum.Member
        }
      ]
    })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        if (!response.data[0].is_exist) {
          refName.current.noExist.push(name);
          return Promise.resolve()
        } else {
          refName.current.exist.push(name);
          return Promise.reject();
        }
      });
  };
  const addItem = async () => {
    if (flagAddItem) return;
    flagAddItem = true;
    
    await addTeamMember({
      team_id: team.id,
      invitees: form.getFieldValue('invite')
    })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        if (response.data.length === 0) {
          clickCancel();
          prop.updateList?.();
          
          message.success('添加成功');
        } else {
          form.setFieldsValue({
            invite: response.data
          });
          
          message.warning('部分成员添加失败，请检查用户名是否注册');
        }
      })
      .finally(() => {
        flagAddItem = false;
      });
  };
  
  useEffect(() => {
    if (!deferredOpen) return;
    refInput.current?.focus();
  }, [ deferredOpen ]);
  
  return <Modal title="邀请新成员" open={ prop.open } footer={ null }
                onCancel={ clickCancel }>
    <Form name="formAdd" form={ form }
          onFinish={ () => clickSubmit }>
      <Form.List name="invite"
                 initialValue={ [ { ...fromInviteItemInit } ] }>
        {
          (fields, { add, remove }) =>
            <>
              <Row className={ Style.form_title }
                   gutter={ 10 }>
                <Col span={ 12 }>
                  用户名
                </Col>
                <Col span={ 8 }>
                  角色
                </Col>
                <Col style={ { textAlign: 'center' } }
                     span={ 4 }>
                  <Tooltip placement="top" title="添加成员">
                    <Button type="primary" size="small" shape="circle"
                            icon={ <PlusOutlined /> }
                            onClick={ () => add({ ...fromInviteItemInit }) } />
                  </Tooltip>
                </Col>
              </Row>
              {
                fields.map((item, index) =>
                  <Row key={ index } gutter={ 10 }>
                    <Col span={ 12 }>
                      <Form.Item { ...item }
                                 name={ [ item.name, 'name' ] } rules={ formInviteItemRule.name }>
                        <Input ref={ index === 0 ? refInput : null } placeholder="用户名"
                               maxLength={ 20 } allowClear />
                      </Form.Item>
                    </Col>
                    <Col span={ 8 }>
                      <Form.Item { ...item }
                                 name={ [ item.name, 'role' ] } rules={ formInviteItemRule.role }>
                        <Select disabled={ team.role !== RoleTypeEnum.Creator }
                                options={ RoleTypeDict.filter(v => v.value !== RoleTypeEnum.Creator) } />
                      </Form.Item>
                    </Col>
                    {
                      fields.length > 1 &&
                      <Col style={ { textAlign: 'center' } }
                           span={ 4 }>
                        <Tooltip placement="right" title="删除">
                          <Button type="text" shape="circle"
                                  icon={ <DeleteOutlined /> }
                                  onClick={ () => remove(index) } danger />
                        </Tooltip>
                      </Col>
                    }
                  </Row>
                )
              }
            </>
        }
      </Form.List>
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