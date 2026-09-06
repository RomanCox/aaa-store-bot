export const START_TEXTS = {
	SELECT_ACTION: "Выберите действие 👇",
};

export function getWelcomeText(
	name: string,
	isAdmin: boolean,
): string {
	if (isAdmin) {
		return (
			`Добро пожаловать, ${name} 👋\n\n` +
			`Вы вошли как администратор.\n`
		);
	}

	return (
		`Приветствую в магазине электронных товаров, ${name} 👋\n\n` +
		`Здесь вы можете посмотреть актуальные цены и наличие.\n`
	);
}
