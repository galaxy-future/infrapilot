import { getCookie, setCookie, removeCookie } from 'typescript-cookie';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Router from 'next/router';

import { CookieEnum, ParamEnum } from '@/lib/enums/public';
import { Url } from '@/utils/public';
import { requestGetBalance } from '@/api/pay';

const cookieOptions = () => ({
    expires: 7,
    path: '/',
    domain: process.env.ENV_MODE === 'development'
      ? ''
      : location.hostname
  }),
  setUserCookie = (user: any) => {
    setCookie(CookieEnum.Token, user.token, cookieOptions());
    setCookie(CookieEnum.UserID, user.id, cookieOptions());
    setCookie(CookieEnum.UserName, user.name, cookieOptions());
  };

export const thunkGetBalance = createAsyncThunk('user/getBalance', async () =>
  await requestGetBalance({})
    .then((response: any) => {
      if (response.code !== 200) return;
      
      return response.data.balance;
    })
);

export default createSlice({
  name: 'user',
  initialState: {
    token: '',
    id: '',
    name: '',
    balance: 0
  },
  reducers: {
    getUserInfo: (state) => {
      const redirect = Url.del([
        ParamEnum.Token,
        ParamEnum.UserID,
        ParamEnum.UserName
      ]);
      
      state.token = Url.get(ParamEnum.Token) || getCookie(CookieEnum.Token) || '';
      state.id = Url.get(ParamEnum.UserID) || getCookie(CookieEnum.UserID) || '';
      state.name = Url.get(ParamEnum.UserName) || getCookie(CookieEnum.UserName) || '';
      setUserCookie(state);
      
      history.replaceState(null, '', redirect);
      Router.replace(redirect);
    },
    
    setUserInfo: (state, action) => {
      const { token, id, name } = action.payload;
      
      state.token = token;
      state.id = id;
      state.name = name;
      setUserCookie(state);
    },
    
    removeUserInfo: (state) => {
      state.token = '';
      state.id = '';
      state.name = '';
      removeCookie(CookieEnum.Token, cookieOptions());
      removeCookie(CookieEnum.UserID, cookieOptions());
      removeCookie(CookieEnum.UserName, cookieOptions());
      removeCookie(CookieEnum.Team, cookieOptions());
    }
  },
  extraReducers(builder) {
    builder
      .addCase(thunkGetBalance.fulfilled, (state, action) => {
        action.payload && (state.balance = action.payload);
      });
  }
});