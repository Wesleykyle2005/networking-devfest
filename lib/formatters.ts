export function formatCurrency(value: number, locale = "es-NI", currency = "NIO") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatQuantity(quantity: number) {
  if (quantity <= 0) {
    return "Sin inventario";
  }
  if (quantity < 5) {
    return `Quedan ${quantity}`;
  }
  return `Stock: ${quantity}`;
}
