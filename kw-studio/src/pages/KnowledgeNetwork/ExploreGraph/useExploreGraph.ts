import { useEffect } from 'react';

type EventAction = {
  type: string;
  [key: string]: any;
};

let subscribers: any = [];
const subscribe = (filter: string, callback: (event: EventAction) => void) => {
  if (filter === undefined || filter === null) return undefined;
  if (callback === undefined || callback === null) return undefined;
  subscribers = [...subscribers, [filter, callback]];
  return () => {
    subscribers = subscribers.filter((subscriber: any) => subscriber[1] !== callback);
  };
};

const dispatch = (event: any) => {
  let { type } = event;
  if (typeof event === 'string') type = event;
  const args: any = [];
  if (typeof event === 'string') args.push({ type });
  else args.push(event);

  subscribers.forEach(([filter, callback]: any) => {
    if (typeof filter === 'string' && filter !== type) return;
    if (typeof filter === 'function' && !filter(...args)) return;
    callback(...args);
  });
};

const destroy = () => {
  subscribers = null;
};

const useExploreGraph = (type: string, callback: (event: EventAction) => void, deps: any[] = []) => {
  useEffect(() => subscribe(type, callback), deps);
  return dispatch;
};

export default useExploreGraph;
export { dispatch, destroy };
