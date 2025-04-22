// Chuyển số nguyên sang chữ tiếng Việt tự nhiên (ví dụ: 1234 -> "một nghìn hai trăm ba mươi bốn")
// Hỗ trợ số âm, số 0, số lớn đến hàng tỷ

const unit = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
const numberWords = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function group3(num: string): string[] {
  // Chia số thành các nhóm 3 số từ phải sang trái
  const arr = [];
  let i = num.length;
  while (i > 0) {
    arr.unshift(num.substring(Math.max(i - 3, 0), i));
    i -= 3;
  }
  return arr;
}

function read3Digits(num: string, full: boolean): string {
  // Đọc 3 số, num luôn có độ dài 1-3
  let [a, b, c] = num.padStart(3, '0').split('').map(Number);
  let result = '';
  if (a === 0 && b === 0 && c === 0) return '';
  if (a !== 0 || full) result += numberWords[a] + ' trăm';
  if (b === 0 && c !== 0) result += ' lẻ';
  if (b === 1) result += ' mười';
  if (b > 1) result += ' ' + numberWords[b] + ' mươi';
  if (c === 1 && b > 1) result += ' mốt';
  else if (c === 5 && b !== 0) result += ' lăm';
  else if (c !== 0 && !(c === 1 && b > 1) && !(c === 5 && b !== 0)) result += ' ' + numberWords[c];
  return result.trim();
}

export function numberToVietnameseText(num: number|string): string {
  let n = typeof num === 'number' ? num : parseInt(num.toString().replace(/[^\d-]/g, ''));
  if (isNaN(n)) return '';
  if (n === 0) return 'không';
  let negative = n < 0;
  n = Math.abs(n);
  let parts = group3(n.toString());
  let text = '';
  for (let i = 0; i < parts.length; i++) {
    let full = i !== 0 && parseInt(parts[i]) !== 0;
    let partText = read3Digits(parts[i], full);
    if (partText) text += partText + unit[parts.length - 1 - i] + ' ';
  }
  text = text.trim().replace(/  +/g, ' ');
  return negative ? 'âm ' + text : text;
}
