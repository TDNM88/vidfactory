// Hàm làm sạch mô tả ảnh: loại bỏ cụm "một bức ảnh" đầu câu nếu có
export function cleanDescription(desc: string) {
  return desc.replace(/^một bức ảnh\s*(,|:|-)?\s*/i, "");
}
