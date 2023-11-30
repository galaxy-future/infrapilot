import thunk from 'redux-thunk';
import { configureStore } from '@reduxjs/toolkit';

import SliceStatistical from '@/store/sliceStatistical';
import SlicePlatform, { thunkSubscribe } from '@/store/slicePlatform';
import SliceUser, { thunkGetBalance } from '@/store/sliceUser';
import SliceTeam from '@/store/sliceTeam';

export type StoreType = ReturnType<typeof Store.getState>;

export const asyncThunk = {
  thunkSubscribe,
  thunkGetBalance
};

const Store = configureStore({
  preloadedState: {},
  reducer: {
    statistical: SliceStatistical.reducer,
    platform: SlicePlatform.reducer,
    user: SliceUser.reducer,
    team: SliceTeam.reducer
  },
  middleware: [ thunk ]
});

export default Store;