import {configureStore,createSlice,PayloadAction} from '@reduxjs/toolkit';
const ui=createSlice({name:'ui',initialState:{authOpen:false},reducers:{setAuthOpen:(s,a:PayloadAction<boolean>)=>{s.authOpen=a.payload}}});
export const {setAuthOpen}=ui.actions;export const store=configureStore({reducer:{ui:ui.reducer}});export type RootState=ReturnType<typeof store.getState>;export type AppDispatch=typeof store.dispatch;
