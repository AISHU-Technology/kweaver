import _ from 'lodash';
import intl from 'react-intl-universal';

const NORMAL = 'normal';
const WAITING = 'waiting';
const RUNNING = 'running';
const FAIL = 'failed';
const CONFIGURATION = 'edit';
const STOP = 'stop';

const LIST = [NORMAL, WAITING, RUNNING, FAIL, CONFIGURATION, STOP];

const LABEL = {
  [NORMAL]: intl.get('graphDetail.normal'),
  [WAITING]: intl.get('graphDetail.waiting'),
  [RUNNING]: intl.get('graphDetail.running'),
  [FAIL]: intl.get('graphDetail.failed'),
  [CONFIGURATION]: intl.get('graphDetail.config'),
  [STOP]: intl.get('graphDetail.config')
};

type KeyType = keyof typeof LABEL;
const KEY_VALUE_LIST = _.map(LIST, key => ({ id: key, label: LABEL[key as KeyType] || '' }));

const KEY_VALUE_COLOR = {
  [NORMAL]: {
    label: LABEL[NORMAL],
    color: 'var(--kw-success-color)',
    background: 'rgba(var(--kw-success-color-rgb), 0.06)'
  },
  [WAITING]: { label: LABEL[WAITING], color: 'var(--kw-text-color-secondary)', background: 'rgba(0,0,0, 0.06)' },
  [RUNNING]: {
    label: LABEL[RUNNING],
    color: 'var(--kw-warning-color)',
    background: 'rgba(var(--kw-warning-color-rgb), 0.06)'
  },
  [FAIL]: { label: LABEL[FAIL], color: 'var(--kw-error-color)', background: 'rgba(var(--kw-error-color-rgb), 0.06)' },
  [CONFIGURATION]: {
    label: LABEL[CONFIGURATION],
    color: 'var(--kw-primary-color)',
    background: 'rgba(var(--kw-primary-color-rgb), 0.06)'
  },
  [STOP]: {
    label: LABEL[STOP],
    color: 'var(--kw-primary-color)',
    background: 'rgba(var(--kw-primary-color-rgb), 0.06)'
  }
};

const getList = () => _.cloneDeep(LIST);
const getLabel = () => _.cloneDeep(LABEL);
const getKeyValueList = () => _.cloneDeep(KEY_VALUE_LIST);
const getKeyValueColor = () => _.cloneDeep(KEY_VALUE_COLOR);

const GRAPH_STATUS = {
  NORMAL,
  WAITING,
  RUNNING,
  FAIL,
  CONFIGURATION,
  STOP,
  getList,
  getLabel,
  getKeyValueList,
  getKeyValueColor
};

export default GRAPH_STATUS;
