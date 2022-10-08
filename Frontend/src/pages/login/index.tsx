import { Action } from "@reduxjs/toolkit";
import { Card, Col, Row, Input, Spin, message } from "antd";
import { Component, ReactNode, useEffect, useState } from "react";
import { connect } from "react-redux";
import { Navigate, NavigateFunction, useNavigate } from "react-router-dom";
import {
  GetHuanSocket,
  HuanWebSocket,
  Proto,
  wsEvent,
} from "../../component/Websocket";
import { changeStatus } from "../../redux/userinfo";
import './App.css'
const { Search } = Input;

interface Prop {
  userinfo: any;
  dispatch: any;
  nav: NavigateFunction;
}

class Login extends Component<Prop> {
  ws?: HuanWebSocket;
  constructor(props: Prop) {
    super(props);
    this.ws = GetHuanSocket();
    this.init();
  }
  wsCkLogin = (data: any) => {
    if (data.status == 200) {
      message.success(data.message);
      this.props.nav("/home");
    } else {
      message.error(data.message);
    }
  };
  wsOpen = () => {
    this.props.dispatch(
      changeStatus({ type: "changeWsStatus", wsStatus: true })
    );
    this.props.dispatch(
      changeStatus({ type: "changeLoginStatus", login: true })
    );
  };
  wsErr = (data: any) => {
    message.error(data.message);
  };
  init() {
    let self = this;
    this.ws?.on(wsEvent.Open, this.wsOpen);
    //绑定登录事件
    self.ws?.on(wsEvent.Login, this.wsCkLogin);
    self.ws?.on(wsEvent.Error, this.wsErr);
    self.ws?.on(wsEvent.Message, (data) => {
      message.success(data.message);
    });
  }
  componentWillUnmount() {
    //移除登录监听
    this.ws?.removeListener(wsEvent.Login, this.wsCkLogin);
  }
  render(): ReactNode {
    let self = this;
    const onLogin = (value: string) => {
      if (!value) {
        message.info("密码不能为空！");
        return;
      }
      self.ws?.SendCmd(Proto.login, value);
    };
    return (
      <div className="login">
        <Row>
          <Col
            xs={{ span: 24 }}
            xxl={{ span: 8, push: 8 }}
            md={{ span: 10, push: 6 }}
          >
            <Card>
              <Search
                placeholder="请输入密码"
                allowClear
                enterButton="登录"
                size="large"
                onSearch={onLogin}
                type="password"
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}
const mapStateToProps = (state: any) => {
  return {
    userinfo: state.userinfo,
  };
};

export default connect(mapStateToProps)(Login);
