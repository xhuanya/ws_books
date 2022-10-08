import { createSlice } from "@reduxjs/toolkit";

const initstate = {
    num: 0
}
export const count = createSlice({
    name: "test",
    initialState: initstate,
    reducers: {
        changeStatus: (state: { num: number; }) => {
            console.log('计数器')
            state.num++;
        }
    }

})
export const { changeStatus } = count.actions
export default count.reducer