// Функция для получения списка подписоты
export const getUsersList = (users) =>
  Object.values(users)
    .map((e) => `${e.tag}`)
    .join(', ') ?? 'пуст';

// let workDaysCount = 0;

// Счетчик количества рабочих дней
export const getWorkDaysCount = (startDate) =>
  Math.floor((new Date() - startDate) / (24 * 60 * 60 * 1000)); // Разницу дат в милисекундах делим на количество миллисекунд в одном дне

// Функция - проверка работоспособности бота в 11 часов
export const checkAvailabilityBotTime = (
  date,
  startBotDate,
  startBotTime,
  bot,
  ownerID,
  users,
) => {
  setInterval(() => {
    const currentHour = new Date().getHours();

    if (currentHour >= 12 && currentHour < 13) {
      bot.telegram.sendMessage(
        ownerID,
        `Бот работает с ${startBotDate} ${startBotTime}, дней работы: ${getWorkDaysCount(date)}. Список ждунов: ${getUsersList(users)}`,
      );
    }
  }, 3600000); // раз в ~час
};

export const notifyUsers = async (ownerID, bot, siteURL, popoverContent) => {
  console.log('📤 Отправляем уведомление...');

  try {
    // await bot.telegram.sendMessage(
    //   81480497, // артем
    //   `${popoverContent}\n\n🎉 НАЙДЕНЫ СЛОТЫ! 🎉\n\nСкорее переходи: ${siteURL}`,
    // );
    // console.log(`✅ Уведомление отправлено Артему`);

    await bot.telegram.sendMessage(
      ownerID,
      `${popoverContent}\n\n🎉 НАЙДЕНЫ СЛОТЫ! 🎉\n\nСкорее переходи: ${siteURL}`,
    );

    console.log(`✅ Уведомление отправлено пользователю: ${ownerID}`);
  } catch (error) {
    console.error(`❌ Ошибка отправки:`, error.message);
  }
};
