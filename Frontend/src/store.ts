import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import count from './redux/test';
import userinfo from './redux/userinfo';

export const store = configureStore({
    reducer: {
        userinfo,
        count,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;
