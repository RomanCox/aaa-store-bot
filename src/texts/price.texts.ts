export const PRICE_TEXTS = {
	ENTER_RUB_TO_BYN: "Введи курс RUB к BYN (за 100 RUB), текущий курс: ",
	ENTER_RUB_TO_USD: "Введи курс RUB к USD, текущий курс: ",
	ENTER_USD_TO_BYN: "Введи курс USD к BYN, текущий курс: ",
	ENTER_RETAIL_MULT: "Введи множитель для розничной наценки, текущий множитель: ",
	ENTER_WHOLESALE_MULT: "Введи множитель для оптовой наценки, текущий множитель: ",
	ENTER_RUB_TO_BYN_EDIT_SUCCESSFUL: "✅ Курс RUB к BYN успешно изменен на: ",
	ENTER_RUB_TO_USD_EDIT_SUCCESSFUL: "✅ Курс RUB к USD успешно изменен на: ",
	ENTER_USD_TO_BYN_EDIT_SUCCESSFUL: "✅ Курс USD к BYN успешно изменен на: ",
	ENTER_RETAIL_MULT_EDIT_SUCCESSFUL: "✅ Розничная наценка успешно изменена на: ",
	ENTER_WHOLESALE_MULT_EDIT_SUCCESSFUL: "✅ Оптовая наценка успешно изменена на: ",
};

export const PRICE_ERRORS = {
	ERROR_STATE: "❌ state.mode неправильный: ",
	PRICE_FORMAT_ERROR: "❌ Значение должно быть числом, введите заново:",
	ERROR_PRICE_FORMATION_EDIT: "❌ Не удалось изменить цену",
}
const MARKUP_ROLE_LABELS = { wholesale: "опт", retail: "розн" };

function markupAmount(value?: number): string {
	return value === undefined ? "—" : `${value}$`;
}

export const CONFIG_MARKUP_TEXTS = {
	tierValues: (wholesale?: number, retail?: number) =>
		`${MARKUP_ROLE_LABELS.wholesale} ${markupAmount(wholesale)} · ${MARKUP_ROLE_LABELS.retail} ${markupAmount(retail)}`,
	changedValue: (type: keyof typeof MARKUP_ROLE_LABELS, before?: number, after?: number) =>
		`${MARKUP_ROLE_LABELS[type]} <s>${markupAmount(before)}</s> → <b>${markupAmount(after)}</b>`,
};
