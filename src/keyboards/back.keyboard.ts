export function backKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "⬅️ Назад", callback_data: "back" }]
    ]
  };
}
