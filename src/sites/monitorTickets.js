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

        console.log('🔍 Ищем форму с классом "activityDetail_filters..."');
        const buttonInfo = await page.evaluate(() => {
          // Ищем ПЕРВУЮ форму/контейнер с классом, который содержит "activityDetail_filters"
          const forms = Array.from(document.querySelectorAll('div')).filter(
            (element) => {
              const className = element.className || '';
              return (
                typeof className === 'string' &&
                className.includes('activityDetail_filters')
              );
            },
          );

          if (forms.length > 0) {
            const form = forms[0]; // Берем первую найденную форму

            // Ищем кнопку "Зарегистрироваться" только внутри этой формы
            const buttons = form.querySelectorAll('button');

            for (const button of buttons) {
              const text = button.textContent?.trim() || '';
              if (text === 'Зарегистрироваться') {
                // Получаем ВЫЧИСЛЕННЫЙ цвет после всех скриптов
                const computedColor =
                  window.getComputedStyle(button).backgroundColor;
                console.log(
                  'button computed backgroundColor === ',
                  computedColor,
                );

                const hasDisabledAttr = button.hasAttribute('disabled');
                console.log(
                  'button.hasAttribute("disabled") === ',
                  hasDisabledAttr,
                );
                console.log(' button.disabled === ', button.disabled);

                const isDisabled =
                  button.disabled ||
                  hasDisabledAttr ||
                  button.getAttribute('aria-disabled') === 'true' ||
                  button.classList.contains('disabled') ||
                  button.style.pointerEvents === 'none' ||
                  button.style.opacity === '0.5';

                return {
                  exists: true,
                  disabled: isDisabled,
                  text: text,
                  color: computedColor,
                  formFound: true,
                };
              }
            }
            console.log(
              '❌ Кнопка "Зарегистрироваться" не найдена внутри формы',
            );
          } else {
            console.log('❌ Форма с activityDetail_filters не найдена');
          }

          return { exists: false, disabled: true, text: '', formFound: false };
        });

        if (buttonInfo.exists) {
          console.log(
            `🔍 Найдена кнопка: "${buttonInfo.text}". 🎨 Цвет: ${buttonInfo.color}. 📋 Состояние disabled: ${buttonInfo.disabled}`,
          );

          if (!buttonInfo.disabled) {
            console.log('🎉 Кнопка АКТИВНА! Регистрация открыта!');
            await notifyUsers(ownerID, bot, siteURL);

            try {
              // Кликаем через evaluate для точности
              await page.evaluate(() => {
                // Ищем первую форму с activityDetail_filters
                const forms = Array.from(document.querySelectorAll('*')).filter(
                  (element) => {
                    const className = element.className || '';
                    return (
                      typeof className === 'string' &&
                      className.includes('activityDetail_filters')
                    );
                  },
                );

                if (forms.length > 0) {
                  const form = forms[0];
                  const buttons = form.querySelectorAll('button');
                  for (const button of buttons) {
                    if (
                      button.textContent?.trim() === 'Зарегистрироваться' &&
                      !button.disabled
                    ) {
                      button.click();
                      return;
                    }
                  }
                }
              });
              console.log('✅ Клик по кнопке выполнен');
            } catch (clickError) {
              console.log(
                '⚠️ Не удалось кликнуть по кнопке:',
                clickError.message,
              );
            }
          } else {
            console.log('⏸️ Кнопка заблокирована, продолжаем мониторинг...');
          }
        } else {
          console.log(
            '❌ Кнопка "Зарегистрироваться" не найдена в целевой форме',
          );
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

async function notifyUsers(ownerID, bot, siteURL) {
  console.log('📤 Отправляем уведомление...');

  try {
    await bot.telegram.sendMessage(
      ownerID,
      `🎉 РЕГИСТРАЦИЯ ОТКРЫТА! 🎉\n\nКнопка "Зарегистрироваться" стала активной!\n\nСкорее переходи: ${siteURL}`,
    );

    console.log(`✅ Уведомление отправлено пользователю: ${ownerID}`);
  } catch (error) {
    console.error(`❌ Ошибка отправки:`, error.message);
  }
}

export default monitorTickets;
