import { getCookie, setCookie } from 'typescript-cookie';
import { createSlice } from '@reduxjs/toolkit';

import { CookieEnum } from '@/lib/enums/public';
import { RoleTypeEnum } from '@/lib/interfaces/team';

const cookieOptions = () => ({
  expires: 7,
  path: '/',
  domain: process.env.ENV_MODE === 'development'
    ? ''
    : location.hostname
});

export default createSlice({
  name: 'team',
  initialState: {
    id: '',
    name: '',
    role: '',
    person: {
      id: '0',
      name: '-',
      project: {
        id: '0',
        name: '-'
      }
    },
    list: [] as any[]
  },
  reducers: {
    setTeamPerson: (state, action) => {
      const { personal_team, default_project } = action.payload;
      
      state.person = {
        id: personal_team.team_id,
        name: personal_team.team_name,
        project: {
          id: default_project.project_id,
          name: default_project.project_name
        }
      };
    },
    
    getTeamInfo: (state) => {
      state.id = getCookie(CookieEnum.Team) || '';
    },
    
    setTeamInfo: (state, action) => {
      const team = action.payload.find((v: any) => v.team_id === state.id);
      
      state.list = action.payload;
      
      if (state.id && team) {
        state.id = team.team_id;
        state.name = team.team_name;
        state.role = team.role;
      } else {
        state.id = state.person.id;
        state.name = state.person.name;
        state.role = RoleTypeEnum.Creator;
      }
      
      setCookie(CookieEnum.Team, state.id, cookieOptions());
    },
    
    switchTeam: (state, action) => {
      const team = state.list.find(v => v.team_id === action.payload.id);
      
      if (action.payload.id && team) {
        state.id = team.team_id;
        state.name = team.team_name;
        state.role = team.role;
      } else {
        state.id = state.person.id;
        state.name = state.person.name;
        state.role = RoleTypeEnum.Creator;
      }
      
      setCookie(CookieEnum.Team, state.id, cookieOptions());
    }
  }
});