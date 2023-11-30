"use client";
import { useState } from "react";
import styles from "./index.module.css";
import { UserOutlined, PlusOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Menu, Button } from "antd";
import type { MenuProps } from "antd/es/menu";
import ModalCreateTeam from '@/components/_modal/ModalCreateTeam';

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    label,
    key,
    icon,
    children,
    type,
  } as MenuItem;
}

export default function Top() {
  const [ showCreateTeam, setShowCreateTeam ] = useState(false);
  
  const items: MenuProps["items"] = [
    getItem(
      "jasontan_tjx@163.com",
      "name",
      null,
      [
        getItem(<a href="./">项目</a>, "dashboard"),
        getItem(<a href="./">设置</a>, "settings"),
        getItem(
          <div className={ styles.item }>
            <span onClick={ () => setShowCreateTeam(true) }>创建团队</span>
            <PlusOutlined />
          </div>,
          "team"
        ),
      ],
      "group"
    ),
    { type: "divider" },
    getItem(
      "",
      "",
      null,
      [
        getItem(
          <Button style={ { width: "100%" } } danger>
            退出登录
          </Button>,
          "exit"
        ),
      ],
      "group"
    ),
  ];
  
  const dropdownRender = () => {
    return <Menu items={ items } />;
  };
  
  return (
    <>
      <Dropdown placement="bottom" dropdownRender={ dropdownRender }>
        <Avatar
          style={ { backgroundColor: "#87d068" } }
          icon={ <UserOutlined /> }
        />
      </Dropdown>
      <ModalCreateTeam
        type="团队"
        onModalData={ () => setShowCreateTeam(false) }
        show={ showCreateTeam }
      />
    </>
  );
}