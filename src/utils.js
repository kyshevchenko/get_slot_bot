// Функция для получения списка подписоты
export const getUsersList = (users) =>
  Object.values(users)
    .map((e) => `${e.tag}`)
    .join(", ") ?? "пуст";

// let workDaysCount = 0;

// Счетчик количества рабочих дней
export const getWorkDaysCount = (startDate) =>
  Math.floor((new Date() - startDate) / (24 * 60 * 60 * 1000)); // Разницу дат в милисекундах делим на количество миллисекунд в одном дне

// Функция - ежедневный чек работы бота в 11 часов
// const checkAvailabilityBotTime = () => {
//   const currentDate = new Date();
//   const startCheckPeriodTime = new Date(currentDate);
//   startCheckPeriodTime.setHours(11, 0, 0, 0);
//   const endCheckPeriodTime = new Date(currentDate);
//   endCheckPeriodTime.setHours(11, 0, 30, 0);
//   const isCheckBotTime =
//     startCheckPeriodTime < currentDate && currentDate <= endCheckPeriodTime;

//   if (isCheckBotTime) {
//     workDaysCount += 1;
//     bot.telegram.sendMessage(
//       ownerID,
//       `Бот работает с ${startBotDate} ${startBotTime}, дней работы: ${workDaysCount}. Список ждунов: ${getUsersList()}`
//     );
//   }
// };
