import moment from 'moment';

export const formatTime = (time: string | number) => (time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '- -');
