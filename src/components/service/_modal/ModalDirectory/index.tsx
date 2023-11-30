import {
  type ReactNode,
  useState, useEffect
} from 'react';
import { useRouter } from 'next/router';
import {
  Modal,
  type TabsProps, Tabs,
  type DescriptionsProps, Descriptions,
  List, Card,
  Row, Col, Button,
  message
} from 'antd';
import {
  FolderFilled,
  FileOutlined
} from '@ant-design/icons';

import { getPodDirectory } from '@/api/deployment';
import { DirectoryTypeEnum } from '@/lib/enums/deployment';
import Style from './index.module.css';

type FormInstanceType = {
  pod: string;
  container: string;
  path: string;
  type: DirectoryTypeEnum;
};
type ListItemType = {
  name: string;
  type: DirectoryTypeEnum;
  size: string;
  update: string;
  content: string;
};

const tabList = (prop: any): TabsProps['items'] => [
  {
    key: DirectoryTypeEnum.Folder,
    label: '文件夹',
    children: <List className={ Style.list } loading={ prop.stateLoad }
                    header={ domListHeader(prop) }
                    footer={ domListFooter(prop) }
                    dataSource={ prop.stateList }
                    renderItem={ (item: ListItemType) => domListItem(prop, item) } bordered />
  },
  {
    key: DirectoryTypeEnum.File,
    label: '文件',
    children: <Card className={ Style.card }
                    title={ prop.stateList[1]?.name }
                    extra={
                      <Button type="link"
                              onClick={ () => switchItem(prop)() }>
                        返回
                      </Button>
                    }>
      <div className={ Style.container }>
        { prop.stateList[1]?.content }
      </div>
    </Card>
  }
];
const descriptionList = (prop: any): DescriptionsProps['items'] => [
  {
    label: '路径',
    children: prop.stateForm.path
  }
];
const domListHeader = (prop: any) =>
  <Row>
    <Col span={ 14 }>
      名称
    </Col>
    <Col span={ 4 }
         className="text_right">
      大小（KB）
    </Col>
    <Col span={ 6 }
         className="text_right">
      更新时间
    </Col>
  </Row>;
const domListFooter = (prop: any) =>
  <Row justify="space-between">
    <Col span={ 20 }>
      <Descriptions className={ Style.descriptions } size="small"
                    items={ descriptionList(prop) } />
    </Col>
    {/*<Col className="text_right"*/ }
    {/*     span={ 4 }>*/ }
    {/*  总大小：0Kb*/ }
    {/*</Col>*/ }
  </Row>;
const domListItem = (prop: any, item: ListItemType) =>
  <List.Item>
    <Row className="max_width">
      <Col span={ 14 }>
        <Button className="no_padding" type="link"
                onClick={ () => switchItem(prop)(item) }>
          <span className={ Style.icon }>
            {
              (item.type === DirectoryTypeEnum.Back || item.type === DirectoryTypeEnum.Folder) &&
              <FolderFilled />
            }
            {
              item.type === DirectoryTypeEnum.File &&
              <FileOutlined />
            }
          </span>
          { item.name }
        </Button>
      </Col>
      <Col span={ 4 }>
        <div className={ Style.item }>
          { item.size }
        </div>
      </Col>
      <Col span={ 6 }>
        <div className={ Style.item }>
          { item.update }
        </div>
      </Col>
    </Row>
  </List.Item>;
const requestPodDirectory = async (prop: any, data: any) => {
  const {
    detail,
    setStateLoad,
    stateForm, setStateForm,
    setStateList
  } = prop;
  
  setStateLoad(true);
  
  await getPodDirectory({
    cluster_id: prop.pod.cluster_id,
    pod_name: prop.pod.name,
    container_name: stateForm.container,
    file_path: data.path,
    file_type: data.type,
    file_sys_auth: JSON.stringify({
      project_id: prop.router.query.projectId,
      deployment_ids: detail.deployments?.map(v => v.deployment_id) || []
    })
  })
    .then((response: any) => {
      let list: any[] = [];
      
      if (response.code !== 200) {
        switch (response.code) {
          case 3:
            message.error('参数校验不通过，请检查参数信息');
            break;
          case 7:
            message.error('权限校验不通过，请确认是否有足够权限');
            break;
          case 13:
            message.error('查看失败，请稍后重试');
            break;
          case 16:
            message.error('Token校验不通过，请检查Token信息');
            break;
          case 2105:
            message.error('系统仅支持查看10M以下的文件');
            break;
          case 2106:
            message.error('系统暂不支持查看此类文件');
            break;
        }
        return;
      }
      
      list = response.data.file_list.map(v => ({
        name: v.file_name,
        type: v.file_type,
        size: v.file_size,
        update: v.file_update_at,
        content: v.file_content
      }));
      
      setStateForm({
        ...stateForm,
        ...data
      });
      setStateList([
        ...(
          data.path === '/'
            ? []
            : [
              {
                name: '..',
                type: DirectoryTypeEnum.Back,
                size: '',
                update: '',
                content: ''
              }
            ]
        ),
        ...list.filter(v => v.type === DirectoryTypeEnum.Folder),
        ...list.filter(v => v.type === DirectoryTypeEnum.File)
      ]);
    })
    .catch(e => console.log(e))
    .finally(() => {
      setStateLoad(false);
    });
}
const switchItem = (prop: any) =>
  (item: ListItemType | null = null) => {
    const { stateForm } = prop;
    let path = '',
      type = '';
    
    if (!item || item.type === DirectoryTypeEnum.Back) {
      const list = stateForm.path.split('/');
      list.pop();
      
      path = list.join('/') || '/';
      type = DirectoryTypeEnum.Folder
    } else {
      path = stateForm.path +
             (stateForm.path === '/' ? '' : '/') +
             item.name;
      type = item.type;
    }
    
    requestPodDirectory(prop, {
      path,
      type
    });
  };

export default function ModalDirectory(prop: any): ReactNode {
  const {
    open, switchOpen,
    pod
  } = prop;
  const router = useRouter();
  const [ stateLoad, setStateLoad ] = useState<boolean>(false);
  const [ stateForm, setStateForm ] = useState<FormInstanceType>({
    pod: '',
    container: 'worker',
    path: '/',
    type: DirectoryTypeEnum.Folder
  });
  const [ stateList, setStateList ] = useState<ListItemType[]>([]);
  const propData = {
    ...prop,
    router,
    stateLoad, setStateLoad,
    stateForm, setStateForm,
    stateList, setStateList
  };
  
  useEffect(() => {
    if (!pod || !open) return;
    
    requestPodDirectory(propData, {
      path: '/',
      type: DirectoryTypeEnum.Folder
    });
  }, [ pod, open ]);
  
  return <>
   {
     pod &&
     <Modal open={ open } width={ 1000 }
            title={ pod.name } footer={ null }
            onCancel={ () => {
              switchOpen(false);
              setStateForm({
                ...stateForm,
                pod: '',
                path: '/',
                type: DirectoryTypeEnum.Folder
              });
              setStateList([]);
            } }>
       <Tabs activeKey={ stateForm.type }
             renderTabBar={ (props, DefaultTabBar) => <></> }
             items={ tabList(propData) } animated />
     </Modal>
   }
  </>;
}