import {
  type ReactNode,
  useState
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Space, Button, Input, Divider,
  Tooltip, Row, Col
} from 'antd';
import {
  SettingOutlined,
  SearchOutlined,
  TagOutlined,
  QuestionCircleOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { SSO } from '@/utils/public';
import AccountSwitch from '@/components/Layout/AccountSwitch';
import ModalSubscribeInfo from '@/components/_modal/ModalSubscribeInfo';
import ModalSubscribe from '@/components/_modal/ModalSubscribe';
import Style from './index.module.css';
import logo from '@/../public/logo_icon.png';

export default function Top(): ReactNode {
  const [ stateModalSubscribeInfo, setStateModalSubscribeInfo ] = useState<boolean>(false);
  const [ stateModalSubscribe, setStateModalSubscribe ] = useState<boolean>(false);
  
  return <>
    <div className={ Style.box_top }>
      <Space style={ { marginLeft: 15 } }
             size={ 16 } wrap={ false }>
        <Link className={ Style.logo }
              href="/">
          <Row gutter={ 10 }>
            <Col>
              <Image src={ logo }
                     width={ 30 } height={ 30 } alt="logo" />
            </Col>
            <Col>InfraPilot</Col>
          </Row>
        </Link>
        <Space size={ 0 }>
          {/*<Button type="text"*/ }
          {/*        href="https://apps.galaxy-future.com">*/ }
          {/*  应用市场*/ }
          {/*</Button>*/ }
          {/*<Button type="text"*/ }
          {/*        href="https://cloud.galaxy-future.com">*/ }
          {/*  托管平台*/ }
          {/*</Button>*/ }
          {/*<Button className="active" type="text"*/ }
          {/*        href="https://ifs.galaxy-future.com">*/ }
          {/*  托管平台演示版*/ }
          {/*</Button>*/ }
          {/*<Button type="text" target="_blank"*/ }
          {/*        href="https://www.galaxy-future.com">*/ }
          {/*  星汉未来官网*/ }
          {/*</Button>*/ }
        </Space>
      </Space>
      <Space style={ { marginRight: 20 } } size={ 16 } wrap={ false }>
        {/*<Input style={ { background: '#F7F8FA', borderRadius: 20, fontSize: 14 } }*/ }
        {/*       placeholder='请输入查询内容' bordered={ false }*/ }
        {/*       suffix={ <SearchOutlined style={ { color: '#989FA9' } } /> } />*/ }
        <AccountSwitch />
        <Button type="link" size="small"
                onClick={ () => setStateModalSubscribeInfo(true) }>
          订阅
        </Button>
        <Tooltip placement="bottom" title="帮助">
          <QuestionCircleOutlined className={ Style.tool }
                                  onClick={ () => open(`/doc/InfraPilot 平台操作手册.pdf`) } />
        </Tooltip>
        {/*<SettingOutlined className={styles.tool} />*/ }
        <Tooltip placement="bottom" title="退出登录">
          <ExportOutlined className={ Style.tool } style={ { color: '#F04631', background: '#FEF0EE' } }
                          onClick={ () => SSO.logout() } />
        </Tooltip>
      </Space>
    </div>
    <ModalSubscribeInfo stateOpen={ stateModalSubscribeInfo }
                        setStateOpen={ setStateModalSubscribeInfo }
                        okFN={ () => setStateModalSubscribe(true) } />
    <ModalSubscribe stateOpen={ stateModalSubscribe }
                    setStateOpen={ setStateModalSubscribe } />
  </>;
}