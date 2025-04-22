import { numberToVietnameseText } from "./number2text-vi";

const mathMap: Record<string, string> = {
  "+": "cộng",
  "-": "trừ",
  "*": "nhân",
  "/": "chia",
  "=": "bằng",
  "%": "phần trăm",
  "^": "mũ",
  "√": "căn",
  "<": "nhỏ hơn",
  ">": "lớn hơn",
  "≤": "nhỏ hơn hoặc bằng",
  "≥": "lớn hơn hoặc bằng",
  "≠": "không bằng",
};

const latinMap: Record<string, string> = {
  "A": "a",
  "B": "bê",
  "C": "xê",
  "D": "đê",
  "E": "e",
  "F": "ép",
  "G": "giê",
  "H": "hát",
  "I": "i",
  "J": "giê",
  "K": "ca",
  "L": "en",
  "M": "em",
  "N": "en",
  "O": "o",
  "P": "pê",
  "Q": "quy",
  "R": "e-rờ",
  "S": "ét",
  "T": "tê",
  "U": "u",
  "V": "vê",
  "W": "vê kép",
  "X": "ích",
  "Y": "i dài",
  "Z": "dét",
};

// Hàm phiên âm thông minh: chuyển số thành chữ, ký hiệu toán học, chữ latin, giữ nguyên từ tiếng Việt
export function phonemizeVietnamese(input: string): string {
  return input.replace(/\d+/g, (num) => numberToVietnameseText(num))
    .split(/(\s+|[,.!?;:()\[\]{}"'-])/)
    .map(token => {
      if (/^\d+$/.test(token)) return numberToVietnameseText(token); // số nguyên
      if (mathMap[token]) return mathMap[token];
      if (latinMap[token.toUpperCase()]) return latinMap[token.toUpperCase()];
      return token;
    })
    .join("");
}

