function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is not defined`);
	}
	return value;
}

export const ENV = {
	MANAGER_URL: requireEnv("MANAGER_URL"),
};
