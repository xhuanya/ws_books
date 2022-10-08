import { EventEmitter } from 'events'
import { json } from 'stream/consumers';
/**
 * websocket
 */
export class HuanWebSocket {
    /**
     * 事件管理
     */
    event: EventEmitter;
    /**
     * ws 连接
     */
    websocket: WebSocket;
    /**
     * 心跳包监听
     */
    hearbeatInterval: NodeJS.Timer | undefined
    /**
     * 重连次数
     */
    reconnection = 0;
    /**
     * 初始化连接
     * @param ws ws连接
     */
    constructor(ws: string) {
        this.websocket = new WebSocket(ws);
        this.event = new EventEmitter();
        this.Init();
    }

    /**
     * 初始化ws 信息
     */
    private Init() {
        let self = this;
        this.websocket.addEventListener('open', function () {
            self.event.emit(wsEvent.Open)
            self.reconnection = 0;
            //定时发送心跳包
            self.hearbeatInterval = setInterval(function () {
                self.SendCmd(Proto.heartbeat, null);
            }, 1000);
            self.MessageHandling();
        });
        this.websocket.addEventListener("close", function () {
            self.event.emit(wsEvent.close)
            clearInterval(self.hearbeatInterval)
        })
    }
    /**
     * 处理消息
     */
    private MessageHandling() {
        let self = this;
        this.websocket.addEventListener('message', function (message) {
            let protoData: WsprotocolRs = JSON.parse(message.data);
            switch (protoData.cmd) {
                case Proto.Debug:
                    self.event.emit(wsEvent.debug, protoData)
                    break;
                case Proto.login:
                    self.event.emit(wsEvent.Login, protoData)
                    break;
                case Proto.books:
                    self.event.emit(wsEvent.books, protoData)
                    break;
                case Proto.Notes:

                    self.event.emit(wsEvent.Notes, protoData)
                    break;
                case Proto.createBook:
                    self.event.emit(wsEvent.createBook, protoData)
                    break;
                case Proto.Error:

                    self.event.emit(wsEvent.Error, protoData)
                    break;
                case Proto.Message:

                    self.event.emit(wsEvent.Message, protoData)
                    break;
                case Proto.createNotes:

                    self.event.emit(wsEvent.createNotes, protoData)
                    break;
            }
        })
    }
    /**
     * 
     * @param eventName 命令名称
     * @param listener 回调数据
     */
    public on(cmd: wsEvent, listener: (...args: any[]) => void) {
        //监听协议
        this.event.on(cmd, listener);
    }
    /**
     * 移除监听
     * @param cmd 
     * @param listener 
     */
    public removeListener(cmd: wsEvent, listener: (...args: any[]) => void) {
        this.event.removeListener(cmd, listener);
    }
    /**
     * 
     * @param cmd 命令
     * @param data 
     */
    public SendCmd(cmd: Proto, data: any) {
        this.websocket.send(JSON.stringify({ cmd: cmd, data: data }))
    }
}

//执行结果
export interface WsprotocolRs {
    cmd: Proto,
    status: number,
    message: string,
    data?: any
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
    Debug = 100,
    Error = 500,
    Message = 600,
}
//协议
export interface Wsprotocol {
    //命令
    cmd: Proto,
    //数据
    data: string
}
let socekt: HuanWebSocket | undefined;
/**
 * 导出socket
 */
export function GetHuanSocket(): HuanWebSocket {
    if (socekt === undefined) {
        socekt = new HuanWebSocket('wss://book.xhuan.eu.org/ws')
    }
    return socekt;
}

export enum wsEvent {
    Open = "open",
    Login = "login",
    books = "books",
    createBook = "createBook",
    close = "close",
    debug = "debug",
    Notes = "Notes",
    Error = "Error",
    Message = "Message",
    createNotes = "createNotes",
}