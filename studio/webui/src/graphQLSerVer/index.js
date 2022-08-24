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
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { onError } from 'apollo-link-error';
import { ApolloLink, from } from 'apollo-link';
import { print } from 'graphql/language/printer';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { message } from 'antd';

import { openAppId } from '@/utils/crypto/sha256';

import { getParam, localStore } from '@/utils/handleFunction';
import { sessionStore } from '@/utils/handleFunction';

import { handleBack } from './errorHandle';

const cache = new InMemoryCache();

const controller = window.AbortController ? new AbortController() : new XMLHttpRequest();
const { signal } = controller;

//是否是iframe访问页面
const iframe = window.location.pathname.includes('iframe');
// openapi 的认证方式
const apiToken = iframe ? getParam('apiToken') : '';
// 自定义fetch请求
const customFetch = (uri, options) => {
  options.signal = signal;

  return fetch(uri, options);
};

// 请求头设置，设置token

const graphQLLink = createHttpLink({
  uri: iframe ? (apiToken ? '/api/engine/v1/kgservice/kg/' : '/api/engine/v1/open/kg/') : '/api/engine/v1/kg/',
  fetch: customFetch // 兼容IE11
});

const exploreLink = createHttpLink({
  uri: iframe
    ? apiToken
      ? '/api/engine/v1/kgservice/explore/'
      : '/api/engine/v1/open/explore/'
    : '/api/engine/v1/explore/',
  fetch: customFetch // 兼容IE11
});

// 请求头设置
const middlewareAuthLink = new ApolloLink((operation, forward) => {
  // 获取用户token并放入请求头中

  const sessionid = Cookie.get('sessionid');
  const uuid = Cookie.get('uuid');

  if (
    sessionStore.get('sessionid') &&
    Cookie.get('sessionid') &&
    sessionStore.get('sessionid') !== Cookie.get('sessionid')
  ) {
    sessionStore.set('sessionid', Cookie.get('sessionid'));
    window.location.reload();
  }

  // 设置请求头的authorization（用户token）
  if (iframe) {
    // 产品id 认证方式需要
    const pid = iframe ? getParam('pid') : '';

    // 用户appid
    const appid = getParam('appid');

    let timestamp = Date.parse(new Date()).toString();
    timestamp = timestamp.substr(0, 10);
    // 请求体
    const body = {
      operationName: operation.operationName,
      variables: operation.variables,
      query: print(operation.query)
    };
    //  appkey 的方式访问openapi
    const appkey = appid ? openAppId(appid, timestamp, JSON.stringify(body)) : '';

    operation.setContext(
      apiToken
        ? {
            headers: {
              pid,
              apiToken
            }
          }
        : {
            headers: {
              timestamp,
              appkey,
              appid
            }
          }
    );
  } else {
    operation.setContext({
      headers: {
        // authorization
        sessionid,
        uuid
      }
    });
  }

  return forward(operation);
});

// 请求头设置
const middlewareLoopAuthLink = new ApolloLink((operation, forward) => {
  // 获取用户token并放入请求头中

  const sessionid = Cookie.get('sessionid');
  const uuid = Cookie.get('uuid');

  if (
    sessionStore.get('sessionid') &&
    Cookie.get('sessionid') &&
    sessionStore.get('sessionid') !== Cookie.get('sessionid')
  ) {
    sessionStore.set('sessionid', Cookie.get('sessionid'));
    window.location.reload();
  }

  // 设置请求头的authorization（用户token）
  operation.setContext({
    headers: { sessionid, uuid, loop: '1' }
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

    if (headers) {
      const authorization = headers.get('authorization');
      // 如果authorization（用户token）更新，则重新设置authorization
      if (authorization) {
        Cookie.set('authorization', authorization);
      }
    }

    return response;
  });
});

const errorLink = onError(({ networkError, response }) => {
  if (networkError && networkError.statusCode === 401) {
    Cookie.remove('sessionid');
    Cookie.remove('uuid');
    localStore.remove('userInfo');

    if (networkError.result.ErrorCode === 'Gateway.AdminResetAccess.LoginInfoMatchError') {
      window.location.replace('/login');
      return;
    }

    message.error([intl.get('login.loginOutTip')]);
    setTimeout(() => {
      window.location.replace('/login');
    }, 2000);
  }

  if (networkError && networkError.statusCode === 403) {
    if (networkError.result.ErrorCode === 'Gateway.PlatformAuth.AuthError') {
      message.error('认证失败');
      return;
    }
  }

  if (networkError && networkError.result && networkError.result.ErrorCode) {
    // TODO engine 和 manager ？
    if (networkError.result.ErrorCode === '400006') {
      Cookie.remove('sessionid');
      Cookie.remove('uuid');
      localStore.remove('userInfo');

      message.error([intl.get('login.loginOutTip')]);

      setTimeout(() => {
        window.location.replace('/login');
      }, 2000);
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
        if (window.location.pathname.includes('iframe')) {
          return;
        }
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
