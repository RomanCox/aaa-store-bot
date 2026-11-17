import { ENV } from "./env";

export const Spreadsheet = {
    Config: "config",
    Warehouse: "warehouse",
} as const;

export type SpreadsheetKey = (typeof Spreadsheet)[keyof typeof Spreadsheet];

export const SPREADSHEET_IDS: Record<SpreadsheetKey, string> = {
    [Spreadsheet.Config]: ENV.SPREADSHEET_CONFIG_ID,
    [Spreadsheet.Warehouse]: ENV.SPREADSHEET_WAREHOUSE_ID,
};