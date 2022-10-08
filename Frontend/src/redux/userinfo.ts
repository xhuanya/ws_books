import { createSlice } from "@reduxjs/toolkit";

const initstate = {
    login: false,
    wsStatus: false,
}
export const userinfo = createSlice({
    name: "userinfo",
    initialState: initstate,
    reducers: {
        changeStatus: function (state: any, action: any) {
            switch (action.payload.type) {
                case "changeLoginStatus":
                    return { ...state, login: action.payload.login };
                case "changeWsStatus":
                    return { ...state, wsStatus: action.payload.wsStatus }
            }
            return state;
        }
    }

})
export const { changeStatus } = userinfo.actions
export default userinfo.reducer