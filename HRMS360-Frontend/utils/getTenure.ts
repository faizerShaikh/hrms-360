export function getTenure(start_date: string, end_date: string) {
  if (start_date && end_date) {
    let startDate = new Date(start_date);
    let endDate = new Date(end_date);

    return (
      endDate.getMonth() -
      startDate.getMonth() +
      12 * (endDate.getFullYear() - startDate.getFullYear())
    );
  }
  return 0;
}
