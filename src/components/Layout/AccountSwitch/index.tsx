import {
  type ReactNode,
  useState, useEffect
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  type MenuProps, Menu,
  Avatar, Dropdown,
  Space, message
} from 'antd';
import {
  SwapOutlined,
  PlusCircleOutlined,
  UserOutlined,
  CheckOutlined,
} from '@ant-design/icons';

import type { StoreType } from '@/store';
import { List } from '@/utils/platform';
import { createTeam } from '@/api/team';
import { useRouter } from 'next/navigation';
import ModalCreateTeam from '@/components/_modal/ModalCreateTeam';
import styles from './index.module.css';

type MenuItem = Required<MenuProps>['items'][number];
type TeamItem = {
  team_id: string;
  team_name: string;
};

function getItem(
  label: ReactNode,
  key: string,
  icon?: ReactNode,
  children?: MenuItem[],
  type?: 'group'
): MenuItem {
  return {
    key,
    label,
    icon,
    children,
    type,
  } as MenuItem;
}

export default function AccountSwitch(): ReactNode {
  const storeDispatch = useDispatch();
  const { user, team } = useSelector((state: StoreType) => state);
  const [ showCreateTeam, setShowCreateTeam ] = useState(false);
  const router = useRouter();
  
  const TeamItem = ({ team_id, team_name }: TeamItem) => (
    <Space key={ team_id } className={ styles.item }>
      <Avatar size="small"
              style={ { backgroundColor: '#87d068' } }
              icon={ <UserOutlined /> } />
      <span>{ team_name }</span>
      { team.id === team_id && <CheckOutlined /> }
    </Space>
  );
  
  const handleTeamItemList = (teamList: any[]) => {
    return (
      teamList &&
      teamList.map(({ team_id, team_name }) =>
        getItem(<TeamItem key={ team_id } team_id={ team_id } team_name={ team_name } />,
          `${ team_id }.${ team_name }`)
      )
    );
  };
  
  const handledTeamItemList: any[] = handleTeamItemList(team.list);
  
  const items: MenuProps['items'] = [
    getItem(
      '个人',
      'name',
      null,
      [
        getItem(
          <Space>
            <Avatar size="small"
                    style={ { backgroundColor: '#87d068' } }
                    icon={ <UserOutlined /> } />
            <span>{ user.name }</span>
            { team.id === team.person.id && <CheckOutlined /> }
          </Space>,
          `${ team.person.id }.${ team.person.name }`
        ),
      ],
      'group'),
    { type: 'divider' },
    getItem(
      '团队',
      '',
      null,
      handledTeamItemList && [ ...handledTeamItemList, { type: 'divider' } ],
      'group'),
    getItem(
      <div style={ { textAlign: 'center' } } onClick={ () => setShowCreateTeam(true) }>
        <PlusCircleOutlined style={ { margin: '0 5px 0 0' } } />
        创建团队
      </div>,
      'createTeam'),
  ];
  
  const dropdownRender = () => {
    return <Menu onClick={ (e: any) => onAccountChange(e) } items={ items } />;
  };
  
  const onSuccessCreateTeam = async (team_id: string, team_name: string) => {
    storeDispatch({
      type: 'team/setTeamInfo',
      payload: await List.team()
    });
    storeDispatch({
      type: 'team/switchTeam',
      payload: {
        id: team_id
      }
    });
    
    router.push('/');
  };
  
  const onAccountChange = (e: any) => {
    if (e.key === 'createTeam') return;
    
    storeDispatch({
      type: 'team/switchTeam',
      payload: {
        id: e.key.split('.')[0]
      }
    });
    
    router.push('/');
  };
  
  return <>
      <Dropdown placement="bottomRight"
                dropdownRender={ dropdownRender }>
        <div style={ {
          backgroundColor: '#F7F8FA',
          borderRadius: 20,
          padding: 15,
          height: 30,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer'
        } }>
          <span style={ {
            fontSize: 14,
            color: '#989FA9',
            lineHeight: 1,
            marginRight: 6,
          } }>
            { team.name !== '--personal' ? team.name : user.name }
          </span>
          <SwapOutlined style={ { color: '#989FA9' } } />
        </div>
      </Dropdown>
      <ModalCreateTeam type="团队" show={ showCreateTeam }
                       onModalData={ ({ show, data }) => {
                         setShowCreateTeam(show);
                         
                         data &&
                         createTeam(data)
                           .then((res) => {
                             const { team_id, team_name } = res.data;
                             
                             onSuccessCreateTeam(team_id, team_name);
                           })
                           .catch(e => console.log(e));
                       } } />
    </>;
}