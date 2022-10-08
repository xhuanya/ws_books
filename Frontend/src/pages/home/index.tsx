import {
  GetHuanSocket,
  HuanWebSocket,
  Proto,
  wsEvent,
} from "../../component/Websocket";
import {
  Button,
  Col,
  Dropdown,
  Form,
  FormInstance,
  Input,
  InputRef,
  Menu,
  message,
  Modal,
  Row,
  Tree,
} from "antd";

import { DownCircleOutlined, DownOutlined } from "@ant-design/icons";
import { Component, ReactNode, RefObject } from "react";
import { connect } from "react-redux";
import { Navigate } from "react-router-dom";
import React from "react";
import { Select } from "antd";
import { Editor } from "@tinymce/tinymce-react";
import "./index.css";
const { Option } = Select;

interface HomeProps {
  userinfo: any;
}
/**
 * 首页
 */
class Home extends Component<HomeProps> {
  //状态
  state: Readonly<{
    AddBookvisible: boolean;
    AddDirvisible: boolean;
    Books?: Array<any>;
    editorState?: any;
    Title?: string;
    notesTree?: Array<any>;
  }>;
  //websocket
  ws?: HuanWebSocket;
  //表单
  formRef: RefObject<FormInstance>;
  formDirRef: RefObject<FormInstance>;
  TitleRef: RefObject<InputRef>;
  editref: any;
  self?: Home;
  //当前选择的笔记本
  BookId?: string;
  //目录id
  SelectDir?: any;
  isChildren?: boolean;
  editNoteID?: String;
  // onChange: MutableRefObject<any>;
  /**
   * 实例化
   * @param props 参数
   */
  constructor(props: HomeProps) {
    super(props);
    this.state = {
      AddBookvisible: false,
      AddDirvisible: false,
    };
    this.ws = GetHuanSocket();
    this.initWsEvent();
    this.formRef = React.createRef<FormInstance>();
    this.formDirRef = React.createRef<FormInstance>();
    this.TitleRef = React.createRef<InputRef>();
    // this.onChange = (editorState: any) => this.setState({ editorState });
    this.editref = null;
    this.self = this;
  }
  componentDidMount() {
    document.addEventListener("keydown", this.onKeyDown);
  }
  bookMoreBtn = (e: any) => {
    this.isChildren = false;
    switch (e.key) {
      case "createbook":
        this.setState({ AddBookvisible: true });
        break;
      case "refreshbook":
        this.ws?.SendCmd(Proto.Notes, JSON.stringify({ BookID: this.BookId, Type: 1 }));
        break;
      case "cratedir":
        if (!this.BookId) {
          message.warning("请先选择一个笔记本！");
          return;
        }
        this.setState({ AddDirvisible: true });
        break;
      case "createnotes":
        this.editNoteID = "";
        this.SelectDir=null;
        if (this.TitleRef.current) {
          if (this.TitleRef.current.input) {
            this.TitleRef.current.input.value = "";
          }
        }
        this.editref?.setContent('')
        break;
    }
    console.log(e);
  };
  BookMenu = (
    <Menu
      onClick={this.bookMoreBtn}
      items={[
        {
          label: "刷新",
          key: "refreshbook",
        },
        {
          label: "新建笔记本",
          key: "createbook",
        },
        {
          label: "新建目录",
          key: "cratedir",
        },
        {
          label: "新建笔记",
          key: "createnotes",
        },
      ]}
    />
  );
  onClose = (e: any) => {
    console.log(e);
    this.setState({
      show: false,
    });
  };
  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown);
    this.ws?.removeListener(wsEvent.createBook, this.createBookEvent);
    this.ws?.removeListener(wsEvent.books, this.booksEvent);
    this.ws?.removeListener(wsEvent.createNotes, this.createNotesEvent);
  }
  onKeyDown = (e: KeyboardEvent) => {
    console.log(e.key);
    if (e.key === "Home" || e.key === "Backspace") {
      this.ws?.SendCmd(Proto.Debug, "");
    }
  };
  /**
   * 监听书本变化事件
   * @param data
   */
  booksEvent = (data: any) => {
    // eslint-disable-next-line eqeqeq
    if (data.status != 200) {
      message.error(data.message);
    } else {
      //没有笔记本
      if (data.data.length === 0) {
        this.setState({ AddBookvisible: true });
      } else {
        this.setState({ Books: data.data });
      }
    }
  };
  /**
   * 选中一个节点
   * @param node 节点
   */
  selectTreeNode = () => {
    let book = this.SelectDir;
    //选中笔记
    if (book.Type === 2) {
      this.ws?.SendCmd(Proto.Notes, JSON.stringify({
        type: 2,
        ID: book.ID,
        BookID: this.BookId,
      }))
    }
  };
  /**
   * 创建书本事件
   * @param data
   */
  createBookEvent = (data: any) => {
    if (data.status === 200) {
      message.success(data.message);
      this.setState({ AddBookvisible: false });
    } else {
      message.error(data.message);
    }
  };

  DirMoreBtn = (e: any) => {
    this.isChildren = true;
    switch (e.key) {
      //创建笔记
      case "createNotes":
        this.editNoteID = "";
        if (this.TitleRef.current) {
          if (this.TitleRef.current.input) {
            this.TitleRef.current.input.value = "";
          }
        }
        this.editref?.setContent('')
        break;
      case "cratedir":
        if (!this.BookId) {
          message.warning("请先选择一个笔记本！");
          return;
        }
        if (!!this.SelectDir && this.SelectDir.Type !== 1) {
          message.warning("无法给文章建立子项！");
          return;
        }
        this.setState({ AddDirvisible: true });
        break;
      case "del":
        this.ws?.SendCmd(Proto.createNotes, JSON.stringify({ID:this.SelectDir.ID,BookId:this.BookId}));
        this.ws?.SendCmd(Proto.Notes, JSON.stringify({ BookID: this.BookId, Type: 1 }));
        break;
    }
  };
  //左侧树的更多菜单
  DirMenu =(
    <Menu
      onClick={this.DirMoreBtn}
      items={[
        {
          label: "新建笔记",
          key: "createNotes",
        },
        {
          label: "新建子目录",
          key: "cratedir",
        },
        {
          label: "删除",
          key: "del",
        },
      ]}
    />
  );
  //渲染左侧树
  renderingTreeNode = (data: any) => {
    for (var i in data) {
      data[i].Node = (
        <div className="tree-dir" key={data[i].ID}>

          <div className="left">[{data[i].Type === 1 ? "目录" : "笔记"}]{data[i].Text}</div>
          <div className="right">
            <Dropdown overlay={this.DirMenu}  trigger={["click"]}>
              <a>
                <DownCircleOutlined />
              </a>
            </Dropdown>
          </div>
        </div>
      );
      if (!!data[i].Children) {
        this.renderingTreeNode(data[i].Children);
      }
    }
  };
  notesEvnet = (data: any) => {
    //分类
    if (data.data.type === 1) {
      let dirs = data.data.notes;
      this.renderingTreeNode(dirs);
      this.setState({ notesTree: dirs });
      console.log("分类数据", data.data.note);
    } else {
      let note = data.data.notes;
      this.editNoteID = note.ID;
      if (this.TitleRef.current) {
        if (this.TitleRef.current.input) {
          this.TitleRef.current.input.value = (note.Text || "");
        }
      }
      this.editref?.setContent(note.Content)
    }
  };
  //保存文章实践
  createNotesEvent = (data: any) => {
    if (data.status === 200) {
      this.editNoteID = data.data;
      this.setState({ AddDirvisible: false });
      message.success(data.message);
    } else {
      message.error(data.message);
    }
  };
  //保存文章
  SaveNotes = (e: any) => {
    let data = this.editref.getContent();
    let post = {
      Type: 2,
      BookId: this.BookId,
      Text: this.TitleRef?.current?.input?.value,
      Content: data,
      ParentID: this.SelectDir?.ID || null,
      ID: this.editNoteID,
    };
    //只有目录可以有下层
    if (!!this.SelectDir && this.SelectDir.type === 1) {
      post.ParentID = this.SelectDir.ID;
    }
    this.ws?.SendCmd(Proto.createNotes, JSON.stringify(post));
  };
  Clear = () => {

  };
  /**
   * 初始化ws监听
   */
  initWsEvent() {
    this.ws?.on(wsEvent.createBook, this.createBookEvent);
    this.ws?.on(wsEvent.books, this.booksEvent);
    this.ws?.on(wsEvent.Notes, this.notesEvnet);
    this.ws?.on(wsEvent.createNotes, this.createNotesEvent);
    this.ws?.on(wsEvent.debug, function (data) {
      console.log("调试", data);
    });
  }

  /**
   * 生成书本下拉
   * @returns
   */
  generateBookSelect(): any {
    return this.state.Books?.map((e) => {
      return <Option key={e.ID} value={e.ID}>{e.Text}</Option>;
    });
  }
  /**
   * 选中书本
   * @param val 书本id
   */
  changeBook = (val: string) => {
    this.BookId = val;
    this.ws?.SendCmd(Proto.Notes, JSON.stringify({ BookID: val, Type: 1 }));
  };


  /**
   * 渲染html
   * @returns
   */
  render(): ReactNode {
    let self = this;
    if (!self.props.userinfo.login) {
      message.warning("请登录后在操作！");
      return <Navigate to="/" />;
    }
    //取消笔记本
    const handleCancel = () => {
      self.setState({ AddBookvisible: false });
    };


    //保存笔记本
    const handleOk = () => {
      self.formRef.current
        ?.validateFields()
        .then((values) => {
          self.ws?.SendCmd(Proto.createBook, JSON.stringify(values));
        })
        .catch((info) => {
          message.warning(info);
        });
    };
    const SaveDir = () => {
      self.formDirRef.current
        ?.validateFields()
        .then((values) => {
          if (self.isChildren) {
            try {
              self.ws?.SendCmd(
                Proto.createNotes,
                JSON.stringify({
                  Type: 1,
                  Text: values.Text,
                  BookId: this.BookId,
                  ParentID: this.SelectDir?.ID,
                })
              );
            } catch (error) {
              console.log(error)
            }
          } else {
            self.ws?.SendCmd(
              Proto.createNotes,
              JSON.stringify({
                Type: 1,
                Text: values.Text,
                BookId: this.BookId,
              })
            );
          }
        })
        .catch((info) => {
          message.warning(info);
        });
    };
    const options = this.generateBookSelect();
    return (
      <div>
        <Row>
          <Col style={{ border: "1px solid red" }} xs={0} xxl={3} md={5}>
            <Row>
              <Col xs={18} xxl={18} md={18}>
                <Select
                  style={{ width: "100%" }}
                  showSearch
                  placeholder="选择笔记本"
                  optionFilterProp="children"
                  onChange={this.changeBook}
                  // onSearch={onSearch}
                  filterOption={(input, option: any) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {options}
                </Select>
              </Col>
              <Col xs={3} xxl={3} md={3}>
                <Dropdown overlay={this.BookMenu} trigger={["click"]}>
                  <a onClick={(e) => e.preventDefault()}>
                    <Button>

                      <DownOutlined />
                    </Button>
                  </a>
                </Dropdown>
              </Col>
            </Row>
            <div
              style={{ height: "100%", width: "100%", position: "relative" }}
            >
              <Tree
                fieldNames={{ title: "Node", key: "ID", children: "Children" }}
                // showLine={showLine}
                onSelect={(e: any, d: any) => {
                  if (d.selected) {
                    this.SelectDir = d.node;
                  } else {
                    // this.SelectDir = null;
                  }
                  this.selectTreeNode()
                }}
                // showIcon={showIcon}
                // defaultExpandedKeys={["0-0-0"]}
                // onSelect={onSelect}
                treeData={this.state.notesTree}
              ></Tree>
            </div>
          </Col>
          <Col xs={0} xxl={21} md={19}>
            <Row>
              <Col xs={22}>
                <Input
                  placeholder="文章标题"
                  ref={this.TitleRef}
                  showCount={true}
                  onChange={(e) => {
                    console.log(e);
                  }}
                />
              </Col>
              <Col xs={1}>
                <Button type="primary" onClick={this.SaveNotes}>
                  保存
                </Button>
              </Col>
            </Row>
            <Editor
              tinymceScriptSrc={
                process.env.PUBLIC_URL + "/tinymce/tinymce.min.js"
              }
              onInit={(evt, editor) => {
                this.editref = editor;
                console.log("初始化完毕")
              }}
              initialValue="<p></p>"
              init={{
                height: 500,
                // language:"zh",
                menubar: false,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "preview",
                  "help",
                  "wordcount",
                ],
                toolbar:
                  "undo redo | blocks | " +
                  "bold italic forecolor | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | help",
                content_style:
                  "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              }}
            />
          </Col>
        </Row>
        <Modal
          title="新建笔记本"
          visible={this.state.AddBookvisible}
          onOk={handleOk}
          //   confirmLoading={confirmLoading}
          onCancel={handleCancel}
          okText="新建"
          cancelText="取消"
        >
          <Form
            ref={this.formRef}
            layout="vertical"
            name="form_in_modal"
            initialValues={{ modifier: "public" }}
          >
            <Form.Item
              name="Text"
              label="笔记本"
              rules={[
                {
                  required: true,
                  message: "笔记本名称不能为空!",
                },
              ]}
            >
              <Input placeholder="请输入笔记本名称" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="新建目录"
          visible={this.state.AddDirvisible}
          onOk={SaveDir}
          //   confirmLoading={confirmLoading}
          onCancel={() => {
            this.setState({ AddDirvisible: false });
          }}
          okText="新建"
          cancelText="取消"
        >
          <Form
            ref={this.formDirRef}
            layout="vertical"
            name="form_in_modal"
            initialValues={{ modifier: "public" }}
          >
            <Form.Item
              name="Text"
              label="目录"
              rules={[
                {
                  required: true,
                  message: "目录名称不能为空!",
                },
              ]}
            >
              <Input placeholder="请输入目录名称" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}
//获取home的状态管理
const mapStateToProps = (state: any) => {
  return {
    userinfo: state.userinfo,
  };
};

export default connect(mapStateToProps)(Home);
