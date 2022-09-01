/* eslint-disable */

/**
 * @description graphQL 客户端配置
 *
 * @author Eden
 * @date 2020/05.27
 *
 */

import ApolloClient from 'apollo-client';
import fetch from 'unfetch';
import intl from 'react-intl-universal';
import { onError } from 'apollo-link-error';
import { ApolloLink, from } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { message } from 'antd';

import { handleBack } from './errorHandle';

const cache = new InMemoryCache();

const controller = window.AbortController ? new AbortController() : new XMLHttpRequest();
const { signal } = controller;

// 自定义fetch请求
const customFetch = (uri, options) => {
  options.signal = signal;

  return fetch(uri, options);
};

// 请求头设置，设置token

const graphQLLink = createHttpLink({
  uri: '/api/engine/v1/kg/',
  fetch: customFetch // 兼容IE11
});

const exploreLink = createHttpLink({
  uri: '/api/engine/v1/explore/',
  fetch: customFetch // 兼容IE11
});

// 请求头设置
const middlewareAuthLink = new ApolloLink((operation, forward) => {
  // 获取用户token并放入请求头中
  operation.setContext({
    headers: {}
  });
  return forward(operation);
});

// 请求头设置
const middlewareLoopAuthLink = new ApolloLink((operation, forward) => {
  // 获取用户token并放入请求头中

  // 设置请求头的authorization（用户token）
  operation.setContext({
    headers: { loop: '1' }
  });

  return forward(operation);
});

// 获取响应头配置,如果有token更新，则更新token放入cookie
const afterwareLink = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    const context = operation.getContext();
    const {
      response: { headers }
    } = context;

    return response;
  });
});

const errorLink = onError(({ networkError, response }) => {
  if (networkError && networkError.statusCode === 403) {
    if (networkError.result.ErrorCode === 'Gateway.PlatformAuth.AuthError') {
      message.error('认证失败');
      return;
    }
  }

  if (response && response.errors && response.errors[0].message) {
    if (response.errors[0].extensions) {
      if (response.errors[0].extensions.ErrorCode === 'EngineServer.ErrRightsErr') {
        message.error(intl.get('graphList.authErr'));
        handleBack();
        return;
      }

      if (response.errors[0].extensions.ErrorCode === 'EngineServer.ErrNebulaStatsErr') {
        message.error(intl.get('graphQL.errNebulaStatsErr'));
        return;
      }

      if (response.errors[0].extensions.ErrorCode === 'EngineServer.ErrInternalErr') {
        message.error(intl.get('graphList.hasBeenDel'));
        handleBack();
        return;
      }

      // 图谱运行中稍后再试
      if (response.errors[0].extensions.ErrorCode === 'EngineServer.ErrNebulaNotFoundSpace') {
        message.error(intl.get('search.runningErr'));
        return networkError;
      }

      if (
        response.errors[0].extensions.ErrorCode === 'EngineServer.ErrOrientDBErr' ||
        response.errors[0].extensions.ErrorCode === 'EngineServer.ErrGraphStatusErr'
      ) {
        const pathname = window?.location?.pathname || '';
        if (!(pathname.includes('/home/graph-list') || pathname.includes('/knowledge'))) {
          setTimeout(() => {
            window.location.replace('/home/graph-list');
          }, 2000);
        }
      }
    }
  }

  if (
    response &&
    response.errors[0].extensions &&
    response.errors[0].extensions.ErrorCode === 'EngineServer.ErrVClassErr'
  ) {
    message.error(intl.get('graphQL.e500500'));
    return networkError;
  }
  // 屏蔽掉这个报错
  if (
    response &&
    response.errors[0] &&
    response.errors[0].message === '[EngineServer.ErrOrientDBErr] Msg: OrientDB error'
  ) {
    return networkError;
  }

  response && message.error(response.errors[0].message);
  return networkError;
});

const clientForKg = new ApolloClient({
  cache,
  link: errorLink.concat(from([middlewareAuthLink, afterwareLink, graphQLLink]))
});

const clientForLoopKg = new ApolloClient({
  cache,
  link: errorLink.concat(from([middlewareLoopAuthLink, afterwareLink, graphQLLink]))
});

const clientForExplore = new ApolloClient({
  cache,
  link: errorLink.concat(from([middlewareAuthLink, afterwareLink, exploreLink]))
});

export { clientForKg, clientForExplore, clientForLoopKg };
