import puppeteer from 'puppeteer';

export const monitorTickets = async (bot, ownerID, siteURL) => {
  console.log('🎫 Запуск мониторинга билетов...');

  const browser = await puppeteer.launch({
    // headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Основной цикл мониторинга
    while (true) {
      try {
        // Генерируем случайное время ожидания от 2 до 10 секунд
        const randomDelay = Math.random() * 8000 + 2000; // 2000-10000 мс
        console.log(
          `⏰ Следующая проверка через: ${(randomDelay / 1000).toFixed(2)} сек`,
        );
        await new Promise((resolve) => setTimeout(resolve, randomDelay));

        console.log('🌐 Загружаем страницу...');

        // Пытаемся загрузить страницу с таймаутом 30 секунд
        await page.goto(siteURL, {
          waitUntil: 'load', // Ждем полной загрузки
          timeout: 30000,
        });

        console.log('✅ Страница загружена, ищем текст...');

        // Проверяем наличие текста "Билеты закончились"
        const ticketsAvailable = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          return !bodyText.includes('Билеты закончились'); // true если надписи НЕТ
        });

        if (ticketsAvailable) {
          console.log(
            '🎉 Билеты снова в продаже!',
          );
          await notifyUsers(ownerID, bot, siteURL);
        } else {
          console.log('✅ Билетов еще нет, продолжаем мониторинг...');
        }
      } catch (error) {
        if (error.name === 'TimeoutError') {
          console.log(
            '⏰ Таймаут загрузки страницы (30 сек), пробуем снова...',
          );
        } else {
          console.error('💥 Ошибка при загрузке страницы:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    await bot.telegram.sendMessage(
      ownerID,
      `❌ Ошибка в работе мониторинга: ${error.message}`,
    );
  } finally {
    await browser.close();
  }
};

// Функция уведомления пользователей (с защитой от ошибок)
async function notifyUsers(ownerID, bot, siteURL) {
  console.log(`📤 Отправляем уведомления для пользователей...`);

  try {
    await bot.telegram.sendMessage(
      ownerID,
      `🚨 БИЛЕТЫ ЗАКОНЧИЛИСЬ! 🚨\n\nНа сайте появилась надпись "Билеты закончились"\n\nПроверьте: ${siteURL}`,
    );

    console.log(`✅ Уведомление отправлено пользователю: ${ownerID}`);
  } catch (error) {
    console.error(`❌ Ошибка отправки пользователю ${ownerID}:`, error.message);

    // Если чат не найден, удаляем пользователя из списка
    if (
      error.message.includes('chat not found') ||
      error.message.includes('400')
    ) {
      console.log(`🗑️ Удаляем несуществующего пользователя: ${ownerID}`);
    }
  }
}

export default monitorTickets;
