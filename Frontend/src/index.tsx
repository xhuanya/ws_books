import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { Router, Route } from "react-router";
import { Layout, Spin, Switch } from "antd";
import { BrowserRouter, Routes, useNavigate } from "react-router-dom";
import Home from "./pages/home";
import { Content, Footer, Header } from "antd/lib/layout/layout";
import { Provider, useSelector } from "react-redux";
import { store } from "./store";
import Login from "./pages/login";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

function App() {
  const wsChck = useSelector((e: any) => e.userinfo);
  const nav = useNavigate();
  return (
    <Spin tip="正在连接服务器..." spinning={!wsChck.wsStatus}>
      <Layout className="layout">
        <Header>title</Header>
        <Content>
          <Routes>
            <Route path="/" element={<Login nav={nav} />} />
            <Route path="home" element={<Home />} />
            <Route path="invoices" />
          </Routes>
        </Content>
        <Footer style={{ textAlign: "center" }}>幻笔记</Footer>
      </Layout>
    </Spin>
  );
}
root.render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
