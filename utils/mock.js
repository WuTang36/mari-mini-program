/**
 * Mock 数据（已清空，用于手工测试）
 */
const { formatDate, daysFromNow } = require('./util');

const now = new Date();
const today = formatDate(now);

const pets = [];

const reminders = [];

const diaries = [];

module.exports = { pets, reminders, diaries, today };
