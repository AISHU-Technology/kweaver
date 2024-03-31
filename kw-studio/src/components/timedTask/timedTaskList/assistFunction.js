import React from 'react';
import intl from 'react-intl-universal';

/**
 * @description 频率国际化
 */
const setFrequency = text => {
  if (text === 'one') {
    return intl.get('graphList.time');
  }

  if (text === 'day') {
    return intl.get('graphList.day');
  }

  if (text === 'week') {
    return intl.get('graphList.week');
  }

  if (text === 'month') {
    return intl.get('graphList.month');
  }
};

/**
 * @description 详情国际化
 */
const setDetail = record => {
  if (record.cycle === 'one') {
    return <div className="detail-data">{intl.get('graphList.Runat', { time: record.datetime })}</div>;
  }

  if (record.cycle === 'day') {
    return <div className="detail-data">{intl.get('graphList.RunatDay', { time: record.datetime })}</div>;
  }

  if (record.cycle === 'week') {
    if (record.date_list.length === 7) {
      return <div className="detail-data">{intl.get('graphList.allWeek', { time: record.datetime })}</div>;
    }

    let detail = intl.get('graphList.weekF');

    record.date_list.forEach((item, index) => {
      if (index + 1 < record.date_list.length) {
        detail = `${detail}${intl.get(`graphList.e${item}`)}${intl.get('graphList.commaZH')}`;
      } else {
        detail = `${detail}${intl.get(`graphList.e${item}`)}`;
      }
    });

    detail = `${detail}${intl.get('graphList.de')}${record.datetime}${intl.get('graphList.runF')}`;

    record.date_list.forEach((item, index) => {
      if (index + 1 < record.date_list.length) {
        detail = `${detail}${intl.get(`graphList.week${item}`)}${intl.get('graphList.commaEN')}`;
      } else {
        detail = `${detail}${intl.get(`graphList.week${item}`)}`;
      }
    });

    return <div className="detail-data">{detail}</div>;
  }

  if (record.cycle === 'month') {
    if (record.date_list.length === 31) {
      return <div className="detail-data">{intl.get('graphList.allMonth', { time: record.datetime })}</div>;
    }

    let detail = intl.get('graphList.monthF');

    record.date_list.forEach((item, index) => {
      if (index + 1 < record.date_list.length) {
        detail = `${detail}${intl.get('graphList.numberZH', { number: item })}${intl.get('graphList.commaZH')}`;
      } else {
        detail = `${detail}${intl.get('graphList.numberZH', { number: item })}${intl.get('graphList.de')}`;
      }
    });

    detail = `${detail}${record.datetime}${intl.get('graphList.runF')}${intl.get('graphList.the')}`;

    record.date_list.forEach((item, index) => {
      if (index + 1 < record.date_list.length) {
        if (item === 1 || item === 21 || item === 31) {
          detail = `${detail}${intl.get('graphList.stE', { number: item })}${intl.get('graphList.commaEN')}`;

          return;
        }

        if (item === 2 || item === 22) {
          detail = `${detail}${intl.get('graphList.ndE', { number: item })}${intl.get('graphList.commaEN')}`;

          return;
        }

        if (item === 3 || item === 23) {
          detail = `${detail}${intl.get('graphList.rdE', { number: item })}${intl.get('graphList.commaEN')}`;

          return;
        }

        detail = `${detail}${intl.get('graphList.thE', { number: item })}${intl.get('graphList.commaEN')}`;
      } else {
        if (item === 1 || item === 21 || item === 31) {
          detail = `${detail}${intl.get('graphList.stE', { number: item })}`;

          return;
        }

        if (item === 2 || item === 22) {
          detail = `${detail}${intl.get('graphList.ndE', { number: item })}`;

          return;
        }

        if (item === 3 || item === 23) {
          detail = `${detail}${intl.get('graphList.rdE', { number: item })}`;

          return;
        }

        detail = `${detail}${intl.get('graphList.thE', { number: item })}`;
      }
    });

    detail = `${detail}${intl.get('graphList.MonthE')}`;

    return <div className="detail-data">{detail}</div>;
  }
};

/**
 * @description 更新类型国际化
 */
const setType = text => {
  if (text === 'full') {
    return intl.get('task.fu');
  }

  return intl.get('task.iu');
};

export { setFrequency, setDetail, setType };
