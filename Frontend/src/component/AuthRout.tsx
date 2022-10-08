import { Component } from "react";
import { Route } from "react-router-dom";

class AuthRout extends Component {
  props!: {
    path: string;
    element?: React.ReactNode | null;
    children?: React.ReactNode;
  };
  render() {
    console.log(this.props);
    return <Route path={this.props.path} element={this.props.element} />;
  }
}
export default AuthRout;
