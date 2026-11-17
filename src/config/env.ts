function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is not defined`);
	}
	return value;
}

export const ENV = {
  RETAIL_MANAGER_URL: requireEnv("RETAIL_MANAGER_URL"),
  WHOLESALE_MANAGER_URL: requireEnv("WHOLESALE_MANAGER_URL"),
	GOOGLE_APPLICATION_CREDENTIALS: requireEnv("GOOGLE_APPLICATION_CREDENTIALS"),
	SPREADSHEET_CONFIG_ID: requireEnv("SPREADSHEET_CONFIG_ID"),
	SPREADSHEET_WAREHOUSE_ID: requireEnv("SPREADSHEET_WAREHOUSE_ID"),
} as const;
