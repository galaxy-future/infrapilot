import {
  message
} from 'antd';

import { ParamEnum } from '@/lib/enums/public';
import Store from '@/store';

export namespace Url {
  /**
   * 设置
   * @param {*} o 参数一维对象
   * @param {string} url Url字符串
   * @return {string} 返回Url
   */
  export function set(o: any, url: string = location.href): string {
    const hash = url.split('#')[1] || '';
    let href = url.split('?')[0] || '',
      search = url.split('?')[1] || '',
      param = '';
    
    if (Object.keys(o).length === 0) return url;
    
    if (hash !== '') {
      href = href.split('#')[0];
      search = search.split('#')[0];
    }
    
    Object.keys(o).forEach((v: string) => {
      const regExp = new RegExp(`(?:&|/?)${ v }=([^&$]+)`);
      let hasParam: any = '';
      
      search !== '' && (hasParam = search.match(regExp));
      
      if (hasParam && hasParam[1] !== undefined) {
        search = search.replace(hasParam[1], o[v])
      } else {
        param !== '' && (param += '&');
        param += v + '=' + o[v];
      }
    });
    
    if (search !== '') {
      if (search[0] === '&') {
        search = '?' + param + search;
      } else {
        search = '?' + param + '&' + search;
      }
    } else {
      search = '?' + param;
    }
    
    hash !== '' && (search += '#' + hash);
    
    return href + search;
  }
  
  /**
   * 获取
   * @param {string} key 键
   * @param {string} url Url地址
   * @return {string|null} 值
   */
  export function get(key: string, url: string = location.search.substring(1)): string | null {
    const regExp = new RegExp(`(?:&|/?)${ key }=([^&$]+)`);
    let value: any = null;
    
    url.includes('?') && (url = url.split('?')[1]);
    url.includes('#') && (url = url.split('#')[0]);
    value = url.match(regExp);
    
    return (!value || value[1] === undefined) ? null : decodeURIComponent(value[1]);
  }
  
  /**
   * 删除
   * @param {array} array 参数数组
   * @param {string} url Url字符串
   * @return {string} 返回Url
   */
  export function del(array: string[], url: string = location.href): string {
    const hash = url.split('#')[1] || '';
    let href = url.split('?')[0] || '',
      search = url.split('?')[1] || '';
    
    if (array.length === 0) return url;
    
    if (hash !== '') {
      href = href.split('#')[0];
      search = search.split('#')[0];
    }
    
    array.forEach((v: string) => {
      const regExp = new RegExp(`(^|&)${ v }=([^&]*)(&|$)`);
      let hasParam: any = '';
      
      search !== '' && (hasParam = search.match(regExp));
      (hasParam && hasParam[0] !== undefined) && (search = search.replace(hasParam[0], ''));
    });
    
    search[0] === '&' && (search = search.slice(1));
    search !== '' && (search = '?' + search);
    hash !== '' && (search += '#' + hash);
    
    return href + search;
  }
  
  /**
   * 获取全部参数
   * @param {string} url Url
   * @return {array|null} 返回Url参数数组
   */
  export function all(url: string = location.search.substring(1)): any {
    const param: any = {};
    let urlList: any = url;
    
    if (!url || !url.includes('=')) return param;
    
    url.includes('?') && (urlList = url.split('?')[1]);
    url.includes('#') && (urlList = urlList.split('#')[0]);
    
    if (!urlList) return param;
    
    urlList = urlList.split('&');
    
    urlList.forEach((v: string) => {
      const p = v.split('=');
      p[0] && (param[p[0]] = decodeURIComponent(p[1]));
    });
    
    return param;
  }
  
  /**
   * 获取哈希值
   * @return {string} 返回Url的hash值
   */
  export function hash(): string {
    return decodeURIComponent(location.hash).substring(1);
  }
  
  /**
   * 参数化
   * @param {*} o 对象
   * @param {boolean} hasQuestion 是否添加？
   * @return {string} 参数
   */
  export function toParam(o: any, hasQuestion: boolean = false): string {
    let param = '';
    
    for (const key in o) param += (param === '' ? '' : '&') + key + '=' + o[key];
    
    return hasQuestion ? '?' + param : param;
  }
  
  /**
   * 判断是否是外链
   * @param {string} url 链接
   * @return {boolean} 是否是外链
   */
  export function isLink(url: string): boolean {
    return url.includes('http://') || url.includes('https://');
  }
}

export namespace SSO {
  /**
   * 检查
   */
  export function check(): boolean {
    const { user: { token, id, name } } = Store.getState();
    
    return !!token && !!id && !!name;
  }
  
  /**
   * 登录
   * @param {string} href 联接
   */
  export function login(href: string = location.origin): void {
    let path = 'http://172.16.16.181:18081';
    
    switch (process.env.ENV_MODE) {
      case 'platform':
        path = '/sso';
        break;
      case 'production':
        path = `${ location.protocol }//${ location.hostname }:18081`;
        break;
      case 'development':
      default:
        break;
    }
    
    location.href = `${ path }?${ [ ParamEnum.Source ] }=${ encodeURIComponent(href) }`;
  }
  
  /**
   * 退登
   */
  export function logout(): void {
    Store.dispatch({ type: 'user/removeUserInfo' });
  }
}

export namespace File { // 文件
  /**
   * 加载文件
   * @param {string} url 地址
   */
  export async function load(url: string): Promise<any> {
    const urlList: string[] = url.split('.');
    let suffix: string = urlList[urlList.length - 1],
      dom: any = null,
      position: string = '';
    
    suffix = suffix.split('#')[0];
    suffix = suffix.split('?')[0];
    
    switch (suffix) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        position = 'body';
        dom = document.createElement('img');
        dom.style.position = 'absolute';
        dom.style.zIndex = -999;
        dom.style.top = -999;
        dom.style.left = -999;
        dom.style.opacity = 0;
        dom.src = url;
        break;
      case 'css':
        position = 'head';
        dom = document.createElement('link');
        dom.setAttribute('ref', 'stylesheet');
        dom.href = url;
        break;
      case 'js':
        position = 'body';
        dom = document.createElement('script');
        dom.setAttribute('type', 'text/javascript');
        dom.setAttribute('defer', 'true');
        dom.src = url;
        break;
    }
    
    return new Promise((resolve: any, reject: any) => {
      dom.onload = () => {
        resolve(dom);
      };
      
      dom.onerror = () => {
        reject();
      };
      
      switch (position) {
        case 'head':
          document.head.appendChild(dom);
          break;
        case 'body':
          document.body.appendChild(dom);
          break;
      }
    });
  }
  
  /**
   * 下载CSV
   * @param {string} name 文件名
   * @param {string[][]} dataList 二维数组列表
   */
  export function downloadCSV(name: string, dataList: string[][]): void {
    const dom = document.createElement('a'),
      blob = new Blob([
        '\uFEFF',
        dataList.reduce((t: string, v: string[], i: number) => t + v.join(',') + ((i + 1 < dataList.length) ? '\r\n' : ''), '')
      ], { type: 'text/csv' });
    
    dom.style.display = 'none';
    dom.download = `${ name }.csv`;
    dom.href = URL.createObjectURL(blob);
    dom.click();
    URL.revokeObjectURL(dom.href);
  }
  
  /**
   * 复制至剪贴板
   * @param {string} content 内容
   */
  export function copyClipboard(content: string): void {
    const textarea = document.createElement('textarea');
    
    textarea.style.position = 'absolute';
    textarea.style.top = '-999px';
    textarea.style.left = '-999px';
    textarea.style.width = '0px';
    textarea.style.height = '0px';
    textarea.style.opacity = '0';
    textarea.value = content;
    document.body.appendChild(textarea);
    
    textarea.select();
    document.execCommand('copy', true);
    textarea.remove();
    
    message.success('复制至剪贴板成功');
  }
}

export function showFormError(e: any): void {
  message.warning(`表单校验失败：${ e.errorFields?.map(v => v.errors.join('，')).join('，') || '未知' }`);
}