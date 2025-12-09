function isDateInRange(start, end) {
  const now = /* @__PURE__ */ new Date();
  if (!start && !end) return true;
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  return true;
}

export { isDateInRange as i };
//# sourceMappingURL=date-Bw6Y8X9p.mjs.map
