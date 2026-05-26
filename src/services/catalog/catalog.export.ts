import { Product, PRODUCT_XLSX_HEADERS, ProductCore, ProductForUI } from "../../types";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export function exportToCsv(products: ProductForUI[]) {
  const escape = (v: any) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;

  const keys = Object.keys(PRODUCT_XLSX_HEADERS) as (keyof ProductCore)[];

  const header = keys.map(k => PRODUCT_XLSX_HEADERS[k]);

  const rows = products.map(p =>
    keys.map(k => escape(p[k]))
  );

  const csv = [
    header.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  return "\uFEFF" + csv;
}

function productsToXlsxData(products: ProductForUI[]) {
  const headerRow = Object.values(PRODUCT_XLSX_HEADERS);

  const dataRows = products.map(product =>
    Object.keys(PRODUCT_XLSX_HEADERS).map(key => {
      const value = product[key as keyof Product];
      return value ?? "";
    })
  );

  return [headerRow, ...dataRows];
}

export function generateProductsXlsx(
  products: ProductForUI[],
  fileName = "price.xlsx"
): string {
  const sheetData = productsToXlsxData(products);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Прайс");

  const filePath = path.resolve("tmp", fileName);

  if (!fs.existsSync("tmp")) {
    fs.mkdirSync("tmp");
  }

  XLSX.writeFile(workbook, filePath);

  return filePath;
}