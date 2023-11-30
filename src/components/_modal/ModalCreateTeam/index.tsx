import { Input, Modal, Button, Form, Space } from "antd";

interface CreateTeamProps {
  show: boolean;
  type: string;
  onModalData: ({
    data,
    show,
    submitted,
  }: {
    data?: object;
    show: boolean;
    submitted: boolean;
  }) => void;
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

const tailLayout = {
  wrapperCol: { offset: 4, span: 18 },
};

export default function ModalCreateTeam(props: CreateTeamProps) {
  const { show, type, onModalData } = props;
  
  const [ form ] = Form.useForm();
  
  const onFinish = (values: any) => {
    console.log(values);
    onModalData({ show: false, data: values, submitted: true });
    form.resetFields();
  };
  
  const onReset = () => {
    onModalData({ show: false, submitted: false });
    form.resetFields();
  };
  
  return (
    <Modal
      title={ `创建${ type }` }
      open={ show }
      footer={ null }
      onCancel={ onReset }
      destroyOnClose
    >
      <Form
        { ...layout }
        form={ form }
        name="control-hooks"
        onFinish={ onFinish }
        className="page_margin"
      >
        <Form.Item
          name="name"
          label={ `${ type }名称` }
          rules={ [ { required: true, message: `请输入${ type }名称` } ] }
        >
          <Input placeholder={ `请输入${ type }名称...` } />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={ (prevValues, currentValues) =>
            prevValues.gender !== currentValues.gender
          }
        >
          { ({ getFieldValue }) =>
            getFieldValue("gender") === "other" ? (
              <Form.Item
                name="customizeGender"
                label="Customize Gender"
                rules={ [ { required: true } ] }
              >
                <Input />
              </Form.Item>
            ) : null
          }
        </Form.Item>
        <Form.Item { ...tailLayout } className="no_margin">
          <Space>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
            <Button htmlType="button" onClick={ onReset }>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}