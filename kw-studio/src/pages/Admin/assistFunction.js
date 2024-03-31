import moment from 'moment';

/**
 * 剩余天数
 */
export const expireDate = data => {
  const newDate = Date.parse(moment(data * 1000).format('YYYY-MM-DD'));
  const nowDate = new Date();
  const days = moment(nowDate).format('YYYY-MM-DD');
  const nowDay = Date.parse(days);
  const diffDate = newDate - nowDay;
  const totalDays = Math.floor(diffDate / (1000 * 3600 * 24));
  if (totalDays >= 0 && totalDays <= 10) {
    return totalDays;
  }
  return totalDays;
};
