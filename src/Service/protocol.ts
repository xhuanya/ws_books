

export interface HttpError {
  message: string
  status: number
}
//协议
export interface Wsprotocol {
  //命令
  cmd: Proto,
  //数据
  data: string
}
//执行结果
export interface WsprotocolRs {
  cmd: Proto,
  status: number,
  message: string,
  data?: string
}
//文本
export interface Books {
  //书本分类
  ID: string,
  //文本
  Text: string,
}
//记录
export interface Session {
  Login: boolean,
  books: Books[],
  notes: SessionNote[]
  notLoginExc:number
}
//文章
export interface SessionNote {
  bookID: string,
  note: Note[]
}
//文章实体
export interface Note {
  BookId: string,
  ID: string,
  ParentID: string,
  //标题
  Text: string,
  //类型
  Type: NoteType,
  //文本
  Content: string
  Children: Note[]
}
export enum NoteType {
  //笔记
  Note,
  //目录
  catalog
}
//查询note的数据
export interface QueryNote {
  //笔记本id
  BookID: string,
  ID: string,
  //标题搜索
  NoteText: string,
  //查询类型 catalog 不显示回传文章内容
  Type: NoteType,
}

//协议
export enum Proto {
  //心跳
  heartbeat,
  //登录
  login,
  //没有登录
  failNotLogin,
  //笔记本
  books,
  //创建书本
  createBook,
  //目录或文字
  Notes,
  //创建目录或者文章
  createNotes,
  //刷新书本
  refreshbook,
  //移除文章
  delNotes,
  Debug = 100,
  Error = 500,
  Message=600,
}

export enum KVStorage {
  Books = "books",
  Lock = "lock"
}