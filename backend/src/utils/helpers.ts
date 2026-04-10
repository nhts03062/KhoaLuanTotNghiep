import { addDays, addMonths } from 'date-fns';

const bcrypt = require('bcrypt');
const saltRounds = 10;

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getExpirationTime = (minutes: number = 10) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const calcEndAt = (
  startAt: Date,
  unit: 'DAY' | 'MONTH',
  durationValue: number,
) => {
  return unit === 'DAY'
    ? addDays(startAt, durationValue)
    : addMonths(startAt, durationValue);
};
