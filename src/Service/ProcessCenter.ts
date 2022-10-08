import { Books, KVStorage, Note, NoteType, Proto, QueryNote, Session, Wsprotocol, WsprotocolRs } from "./protocol";
import { v4 } from 'uuid';
const session: Session = { Login: false, books: [], notes: [], notLoginExc: 0 };
let tryClount = 0;
let tryTime: Date;

export async function Join(socket: WebSocket) {
    if (!!SayHello) {
        socket.send(JSON.stringify({ cmd: Proto.Message, status: 200, message: SayHello }));
    }
}
/**
 * 消息处理中心
 * @param params 消息
 */
export async function MessageAnalysis(msg: Wsprotocol, socket: WebSocket) {

    try {
        // if (!session.Login) {
        //     session.notLoginExc += 1;
        // }
        // if (session.notLoginExc > 10) {
        //     socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "你一直搁这发命令干嘛你又没登陆！" }));

        //     return
        // }
        switch (msg.cmd) {
            case Proto.Debug:
                if (session.Login) {
                    socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "获取成功！", data: session }));
                } else {
                    socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "请登录后在操作！" }));
                }
                break;
            //心跳包
            case Proto.heartbeat:
                break;
            //登录
            case Proto.login:
                if (!!tryTime) {
                    if (new Date().getTime() - tryTime.getTime() < 1000) {
                        //从新更新尝试时间  防止恶意强c
                        tryTime = new Date();
                        socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "请稍等一下系统反应不过来啦！" }));
                        return
                    }
                }

                tryTime = new Date();
                let lock = await myKVBooks.get(KVStorage.Lock) || null;
                if (lock != null) {
                    if (tryClount > 10) {
                        socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "你个吊毛说了有人占用了！连接都给你杀了" }));
                        socket.close();
                        return
                    }
                    tryClount += 1;
                    socket.send(JSON.stringify({ cmd: msg.cmd, status: 500, message: "系统已被占用！" }));
                    return;
                }
                if (msg.data == PassWord) {
                    tryClount = 0;
                    await myKVBooks.put(KVStorage.Lock, '1')
                    session.Login = true;
                    socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "登录成功！" }));
                    SendBookClass().then(books => {
                        console.log("书本分类获取完毕！", books);
                        session.books = books;
                        socket.send(JSON.stringify({ cmd: Proto.books, status: 200, message: "获取成功！", data: books }));
                    });

                } else {
                    socket.send(JSON.stringify({ cmd: msg.cmd, status: 500, message: "密码错误！" }));
                }
                break;
            case Proto.refreshbook:
                if (!session.Login) {
                    socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "请登录后在操作！" }));
                    return;
                }
                SendBookClass().then(books => {
                    console.log("书本分类获取完毕！", books);
                    session.books = books;
                    socket.send(JSON.stringify({ cmd: Proto.books, status: 200, message: "获取成功！", data: books }));
                });
                break;
            //创建书本
            case Proto.createBook:
                if (!session.Login) {
                    socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "请登录后在操作！" }));
                    return;
                }
                let book: Books = JSON.parse(msg.data)
                if (!book.Text) {
                    socket.send(JSON.stringify({ cmd: msg.cmd, status: 500, message: "笔记本名称不能为空！" }))
                }
                socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "笔记本创建成功！" }))
                book.ID = v4();
                session.books.push(book);
                session.notes.push({ bookID: book.ID, note: [] });
                //从新发送书本合集
                socket.send(JSON.stringify({ cmd: Proto.books, status: 200, message: "获取成功！", data: session.books }));
                break;
            //查询文章或者分类
            case Proto.Notes:
                if (!session.Login) {
                    socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "请登录后在操作！" }));
                    return;
                }
                let query: QueryNote = JSON.parse(msg.data);
                let notes: any[] = session.notes.find(e => e.bookID == query.BookID)?.note || [];
                notes = JSON.parse(JSON.stringify(notes))
                //获取分类
                if (query.Type == NoteType.catalog) {
                    if (!!query.NoteText) {
                        notes = notes.filter((e: Note) => e.Text.includes(query.NoteText));
                    }
                    let result = notes.map((e: Note) => { e.Content = ""; return e })
                    socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "获取成功！", data: { notes: result, type: query.Type } }));
                } else {
                    socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "获取成功！", data: { notes: GetNodeByID(notes, query.ID.split('.')), type: query.Type, } }));
                }
                break;
            case Proto.delNotes:
                if (!session.Login) {
                    socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "请登录后在操作！" }));
                    return;
                }
                let delNote: Note = JSON.parse(msg.data)
                let bookNotes: Note[] = session.notes.find(e => e.bookID == delNote.BookId)?.note || [];
                // let dbNote = GetNodeByID(bookNotes, delNote.ID.split('.'))
                let removeNote=function(nodes: Note[],ids:string[]){
                    for (var i in nodes) {
                        if (!nodes[i].Children) {
                            nodes[i].Children = [];
                        }
                        if (nodes[i].ID == ids[0]) {
                            if (ids.length - 1 > 0) {
                                ids[1] = `${ids[0]}.${ids[1]}`
                                return GetNodeByID(nodes[i].Children, ids.splice(1))
                            }
                            delete nodes[i];
                        }
                    }
                    return undefined;
                }
                removeNote(bookNotes,delNote.ID.split('.'))
                socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "删除成功！" }));

                break;
            case Proto.createNotes:
                if (!session.Login) {
                    socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "请登录后在操作！" }));
                    return;
                }
                let note: Note = JSON.parse(msg.data)
                if (!note.BookId) {
                    socket.send(JSON.stringify({ cmd: msg.cmd, status: 500, message: "请先选择笔记本！" }));
                } else {
                    //所有的文字
                    let bookNotes: Note[] = session.notes.find(e => e.bookID == note.BookId)?.note || [];
                    if (!!note.ID) {
                        let dbNote = GetNodeByID(bookNotes, note.ID.split('.'))
                        if (!!dbNote) {
                            Object.assign(dbNote, note);
                            socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "修改成功！", data: note.ID }));
                            return
                        }
                    }
                    if (!!note.ParentID) {
                        //1.2.3
                        let parendids = note.ParentID.split('.');
                        let node = GetNodeByID(bookNotes, parendids);
                        if (!!node) {
                            note.ID = `${note.ParentID}.${node.Children.length + 1}`;
                            socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "创建成功！", data: note.ID }));
                            node.Children.push(note)
                        } else {
                            socket.send(JSON.stringify({ cmd: Proto.Debug, status: 200, message: "获取成功！", data: bookNotes }));
                        }
                    } else {
                        note.ID = `${bookNotes.length + 1}`;
                        bookNotes.push(note)
                        socket.send(JSON.stringify({ cmd: msg.cmd, status: 200, message: "创建成功！", data: note.ID }));
                    }
                    socket.send(JSON.stringify({ cmd: Proto.Notes, status: 200, message: "获取成功！", data: { notes: bookNotes, type: 1 } }));
                }
                break;
        }
    } catch (error) {
        socket.send(JSON.stringify({ cmd: Proto.Error, status: 500, message: "系统错误：" + error }));

    }
}
/**
 * 
 * @param nodes 
 * @param ids 
 * @returns 
 */
function GetNodeByID(nodes: Note[], ids: string[]): Note | undefined {
    for (var i in nodes) {
        if (!nodes[i].Children) {
            nodes[i].Children = [];
        }
        if (nodes[i].ID == ids[0]) {
            if (ids.length - 1 > 0) {
                ids[1] = `${ids[0]}.${ids[1]}`
                return GetNodeByID(nodes[i].Children, ids.splice(1))
            }
            return nodes[i];
        }
    }
    return undefined;
}


/**
 * 关闭连接保存kv数据
 */
export async function CloseWebSocket() {

    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (s, f) => {
        if (session.Login) {
            //保存本子
            await myKVBooks.put(KVStorage.Books, JSON.stringify(session.books))
            //保存笔记
            for (const i in session.notes) {
                await myKVBooks.put(session.notes[i].bookID, JSON.stringify(session.notes[i].note))
            }
            await myKVBooks.delete(KVStorage.Lock)
        }

        s();
    })
}
/**
 * 发送分类
 */
async function SendBookClass(): Promise<Books[]> {
    //记录分类
    let books: Array<Books> = JSON.parse(await myKVBooks.get(KVStorage.Books) || '[]')
    for (var i in books) {
        let note = await GetNotes(books[i].ID)
        session.notes.push({ bookID: books[i].ID, note: note })
    }
    return books
}
async function GetNotes(bookid: string): Promise<Note[]> {
    //记录分类
    let notes: Array<Note> = JSON.parse(await myKVBooks.get(bookid) || '[]')
    return notes;
}
/**
 * 登录检测
 * @returns 错误消息
 */
function CheckLogin(): WsprotocolRs | undefined {
    if (!session.Login) {
        return { cmd: Proto.failNotLogin, status: 500, message: "请登录后在操作！" };
    }
}