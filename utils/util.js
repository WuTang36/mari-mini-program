/**
 * 工具函数
 */

/** 格式化日期 */
function formatDate(date, fmt = 'YYYY-MM-DD') {
  if (typeof date === 'string') date = new Date(date.replace(/-/g, '/'));
  if (!(date instanceof Date)) date = new Date(date);
  const o = {
    'YYYY': date.getFullYear(),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'DD': String(date.getDate()).padStart(2, '0'),
    'hh': String(date.getHours()).padStart(2, '0'),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'ss': String(date.getSeconds()).padStart(2, '0')
  };
  return fmt.replace(/YYYY|MM|DD|hh|mm|ss/g, (k) => o[k]);
}

/** 计算年龄 */
function calcAge(birthday, estimateAge) {
  // 估算年龄
  if (estimateAge && estimateAge > 0) {
    return '约 ' + estimateAge + ' 岁';
  }
  // 未知生日
  if (!birthday) return '未知';

  const now = new Date();
  const birth = new Date(birthday.replace(/-/g, '/'));
  const yearDiff = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;
  if (totalMonths < 1) {
    const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    return days + '天';
  }
  if (totalMonths < 12) return totalMonths + '个月';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return months > 0 ? years + '岁' + months + '个月' : years + '岁';
}

/** 计算距今天数 */
function daysFromNow(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr.replace(/-/g, '/'));
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/** 按月份分组 */
function groupByMonth(list, dateKey) {
  const groups = {};
  list.forEach(item => {
    const raw = item && item[dateKey];
    // 容错：跳过无日期或非法日期的记录，避免崩溃
    if (!raw || typeof raw !== 'string') return;
    const d = new Date(raw.replace(/-/g, '/'));
    if (isNaN(d.getTime())) return;
    const key = d.getFullYear() + '年' + (d.getMonth() + 1) + '月';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(k => ({
    month: k,
    items: groups[k]
  }));
}

module.exports = { formatDate, calcAge, daysFromNow, groupByMonth };
