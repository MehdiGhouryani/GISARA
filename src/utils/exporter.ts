/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Exporter Utility - Persian CSV/Excel Data Exporter with BOM support
 * Converts JSON arrays into Persian-friendly CSV files readable by Microsoft Excel.
 */

export class ExporterService {
  /**
   * Downloads a CSV file with Persian UTF-8 Byte Order Mark (BOM)
   */
  static exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(',')
      )
    ].join('\n');

    // Add UTF-8 BOM (\uFEFF) for Excel Persian text compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export Orders list to Excel/CSV
   */
  static exportOrders(orders: any[]): void {
    const headers = ['کد سفارش', 'خریدار', 'موبایل', 'تعداد آیتم‌ها', 'مبلغ کل (تومان)', 'وضعیت پرداخت', 'تاریخ ثبت'];
    const rows = orders.map(o => [
      o.id || o.orderId,
      o.userMobile || o.customerName || 'ناشناس',
      o.mobile || o.userMobile || '-',
      o.items?.length || 1,
      o.payableToman || o.totalPrice || 0,
      o.status === 'PAID' || o.status === 'COMPLETED' ? 'پرداخت شده' : 'در انتظار پرداخت',
      o.createdAt ? new Date(o.createdAt).toLocaleDateString('fa-IR') : 'امروز'
    ]);

    this.exportToCSV('gisara_orders', headers, rows);
  }

  /**
   * Export Workshop Requests list to Excel/CSV
   */
  static exportWorkshopRequests(requests: any[]): void {
    const headers = ['کد درخواست', 'نام متقاضی', 'موبایل', 'شهر', 'نوع دوره‌', 'وضعیت', 'تاریخ درخواست'];
    const rows = requests.map(r => [
      r.id,
      r.applicantName || r.fullName || 'نامشخص',
      r.mobile,
      r.cityName || r.city || '-',
      r.courseTitle || r.workshopType || '-',
      r.status === 'APPROVED' ? 'تایید شده' : r.status === 'DECLINED' ? 'رد شده' : 'در حال بررسی',
      r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('fa-IR') : 'امروز'
    ]);

    this.exportToCSV('gisara_workshop_requests', headers, rows);
  }
}
