import puppeteer from 'puppeteer';

export const monitorTickets = async (bot, ownerID, siteURL) => {
  console.log('🎫 Запуск мониторинга регистрации...');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1200,800',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    while (true) {
      try {
        const randomDelay = Math.random() * 8000 + 2000;
        console.log(
          `⏰ Следующая проверка через: ${(randomDelay / 1000).toFixed(2)} сек`,
        );
        await new Promise((resolve) => setTimeout(resolve, randomDelay));

        console.log('🌐 Загружаем страницу...');
        await page.goto(siteURL, {
          waitUntil: 'load',
          timeout: 30000,
        });

        // ждем секунду ответа с бэка и отработки скриптов
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('🔍 Ищем временные слоты на странице"');

        const timeInputText = await page.evaluate(() => {
          // Ищем инпут с временными слотами
          const elements = Array.from(document.querySelectorAll('*')).filter(
            (el) => {
              const className = el.className || '';
              return (
                typeof className === 'string' &&
                className.includes('filterButtonPopoverNota')
              );
            },
          );

          if (elements.length > 0) {
            return elements[0].textContent?.trim() || '';
          }

          return '';
        });

        if (timeInputText !== 'Время') {
          notifyUsers(ownerID, bot, siteURL, timeInputText);
        } else {
          console.log('Пока не появились свободные слоты');
        }

        console.log('🔄 Обновляем страницу...');
      } catch (error) {
        if (error.name === 'TimeoutError') {
          console.log('⏰ Таймаут загрузки страницы, пробуем снова...');
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

async function notifyUsers(ownerID, bot, siteURL, timeInputText) {
  console.log('📤 Отправляем уведомление...');

  try {
    await bot.telegram.sendMessage(
      ownerID,
      `${timeInputText}\n\n🎉 РЕГИСТРАЦИЯ ОТКРЫТА! 🎉\n\nСкорее переходи: ${siteURL}`,
    );

    console.log(`✅ Уведомление отправлено пользователю: ${ownerID}`);
  } catch (error) {
    console.error(`❌ Ошибка отправки:`, error.message);
  }
}

export default monitorTickets;
