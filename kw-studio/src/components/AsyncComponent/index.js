/**
 * @description 动态加载组件高阶函数
 */
import React, { Component } from 'react';

const asyncComponent = loadComponent =>
  class AsyncComponent extends Component {
    state = { Component: null };

    componentDidMount() {
      this.getComponent();
    }

    getComponent = async () => {
      if (this.hasLoadedComponent()) return;
      const module = await loadComponent();
      const Component = module.default ? module.default : module;
      this.setState({ Component });
    };

    hasLoadedComponent = () => {
      return this.state.Component !== null;
    };

    render() {
      const { Component } = this.state;
      return Component ? <Component {...this.props} /> : null;
    }
  };

export default asyncComponent;
