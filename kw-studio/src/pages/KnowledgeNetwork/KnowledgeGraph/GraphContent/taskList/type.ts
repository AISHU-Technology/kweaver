export const TASK_STATUS: Array<any> = [
  { intl: 'task.all', value: 'all' },
  { intl: 'task.complete', value: 'normal' },
  { intl: 'task.termination', value: 'stop' },
  { intl: 'task.running', value: 'running' },
  { intl: 'task.waiting', value: 'waiting' },
  { intl: 'task.failed', value: 'failed' }
];

export const TRIGGER_TYPE: Record<string, string> = {
  all: 'task.all',
  0: 'task.manualB',
  1: 'task.automaticB',
  2: 'task.realTime'
};

export const BUILD_TYPE: Array<any> = [
  { intl: 'task.all', value: 'all' },
  { intl: 'task.iu', value: 'increment' },
  { intl: 'task.fu', value: 'full' }
];
