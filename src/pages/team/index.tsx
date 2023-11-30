import {
  type ReactNode,
  useState, useEffect
} from 'react';
import {
  useSelector
} from 'react-redux';
import {
  Card, Row, Col,
  Typography, Table,
  Tag, Space, Button,
  Tooltip, Modal,
  message
} from 'antd';
import {
  TeamOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { RoleTypeEnum, RoleTypeDict } from '@/lib/interfaces/team';
import type { StoreType } from '@/store';
import ModelAdd from '@/components/team/_modal/ModelAdd';
import ModelEdit from '@/components/team/_modal/ModelEdit';
import {
  getTeamMemberList, delTeamMember
} from '@/api/team';
import Style from './index.module.css';

type MemberDataType = {
  key: string;
  uid: string;
  role: RoleTypeEnum;
  name: string;
  phone: string;
  email: string;
  team_id: string;
  inviter: string;
  inviter_name: string;
  join_at: string;
};

let flagGetList: boolean = false;
let flagDeleteItem: boolean = false;

export default function Team(): ReactNode {
  const { team } = useSelector((state: StoreType) => state);
  const [ teamName, setTeamName ] = useState<any>('');
  const [ teamMemberList, setTeamMemberList ] = useState<MemberDataType[]>([]);
  const [ pagination, setPagination ] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number, range: [ number, number ]) => `总数：${ total }条`,
    onChange: (page: number, pageSize: number) => {
      if (flagGetList) return;
      
      pagination.pageSize !== pageSize &&
      (page = 1);
      
      setPagination({
        ...pagination,
        current: page,
        pageSize
      });
    }
  });
  const [ editUser, setEditUser ] = useState<any>(null);
  const [ modelAdd, setModelAdd ] = useState(false);
  const [ modelEdit, setModelEdit ] = useState(false);
  
  const switchModelAdd = (isOpen: boolean) => {
    setModelAdd(isOpen);
  };
  const switchModelEdit = (isOpen: boolean) => {
    setModelEdit(isOpen);
  };
  const clickEdit = (record: MemberDataType) => {
    switchModelEdit(true);
    setEditUser(record);
  };
  const clickDelete = (record: MemberDataType) => {
    Modal.confirm({
      content: `确认从团队中移除【${ record.name }】`,
      okText: '移除',
      okType: 'primary',
      okButtonProps: {
        danger: true
      },
      onOk: () => {
        deleteItem(record);
      }
    });
  };
  
  const getMemberList = async () => {
    if (flagGetList) return;
    flagGetList = true;
    
    await getTeamMemberList({
      team_id: team.id,
      page: pagination.current,
      page_size: pagination.pageSize
    })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        setPagination({
          ...pagination,
          total: response.data.total
        });
        setTeamMemberList(
          response.data.list
            ? response.data.list.map((v: MemberDataType) => ({
              ...v,
              key: v.uid
            }))
            : []
        );
      })
      .finally(() => {
        flagGetList = false;
      });
  };
  const deleteItem = async (item: any) => {
    if (flagDeleteItem) return;
    flagDeleteItem = true;
    
    await delTeamMember({
      team_id: team.id,
      target_id: item.key
    })
      .then((response: any) => {
        if (response.code !== 200) return;
        
        getMemberList();
        
        message.success('移除成功');
      })
      .finally(() => {
        flagDeleteItem = false;
      });
  };
  
  const columns: ColumnsType<MemberDataType> = [
    {
      dataIndex: 'name',
      title: '用户名',
      width: 250,
      render: (text: string, record: MemberDataType, index: number) =>
        <div className={ Style.table_name }>
          { text }
          <Tag color={ RoleTypeDict.find(v => v.value === record.role)?.expand.color }
               style={ { margin: '0 0 0 10px' } }>
            { RoleTypeDict.find(v => v.value === record.role)?.label }
          </Tag>
        </div>
    },
    {
      dataIndex: 'name',
      title: '用户名',
      width: 350,
      render: v => v || '-'
    },
    {
      title: '操作',
      width: 200,
      render: (v: string, record: MemberDataType, index: number) =>
        <Space size="small">
          {
            (record.role !== RoleTypeEnum.Creator &&
             team.role === RoleTypeEnum.Creator)
              ? <>
                <Tooltip placement="top" title="编辑">
                  <Button type="link" size="small"
                          shape="circle" icon={ <EditOutlined /> }
                          onClick={ () => clickEdit(record) } />
                </Tooltip>
                <Tooltip placement="top" title="删除">
                  <Button type="text" size="small"
                          shape="circle" icon={ <DeleteOutlined /> }
                          onClick={ () => clickDelete(record) } danger />
                </Tooltip>
              </>
              : '-'
          }
        </Space>
    }
  ];
  
  useEffect(() => {
    setTeamName(team.name);
  }, []);
  useEffect(() => {
    getMemberList();
  }, [
    pagination.current,
    pagination.pageSize
  ]);
  
  return <>
    <Card>
      <Row gutter={ 10 }>
        <Col>
          <Typography.Title className="page_title"
                            level={ 2 }>
            { teamName }
          </Typography.Title>
        </Col>
        <Col>
          <div className={ Style.amount }>
            <TeamOutlined />
            <span className={ Style.amount_span }>
              { teamMemberList.length }
            </span>
          </div>
        </Col>
      </Row>
      <Space className="page_margin">
        {
          team.role !== RoleTypeEnum.Member &&
          <Button type="primary"
                  className={ Style.button_invite }
                  onClick={ () => switchModelAdd(true) }>
            邀请新成员
          </Button>
        }
      </Space>
      <Table className="page_margin" columns={ columns }
             dataSource={ teamMemberList } pagination={ pagination } />
    </Card>
    <ModelAdd open={ modelAdd } switchOpen={ switchModelAdd }
              updateList={ getMemberList } />
    <ModelEdit open={ modelEdit } switchOpen={ switchModelEdit }
               userInfo={ editUser } updateList={ getMemberList } />
  </>;
};