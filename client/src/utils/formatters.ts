export const formatCurrency = (value: number) => {
  const normalizedValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(normalizedValue) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(normalizedValue);
};
