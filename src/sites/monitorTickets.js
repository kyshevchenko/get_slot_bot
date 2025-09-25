import puppeteer from 'puppeteer';

export const monitorTickets = async (bot, ownerID, siteURL) => {
  console.log('🎫 Start monitoring...');

  const browser = await puppeteer.launch({
    headless: "new",
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
          `⏰ Next check: ${(randomDelay / 1000).toFixed(2)} сек`,
        );
        await new Promise((resolve) => setTimeout(resolve, randomDelay));

        console.log('🌐 Download page...');
        await page.goto(siteURL, {
          waitUntil: 'load',
          timeout: 30000,
        });

        // ждем секунду ответа с бэка и отработки скриптов
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('🔍 Searching for element with filterButtonPopoverNota...');

        const popoverContent = await page.evaluate(async () => {
          // Ищем ОДИН элемент с filterButtonPopoverNota
          const filterButton = Array.from(document.querySelectorAll('*')).find(
            (el) => {
              const className = el.className || '';
              return (
                typeof className === 'string' &&
                className.includes('filterButtonPopoverNota')
              );
            },
          );

          if (filterButton) {
            // Кликаем на элемент
            filterButton.click();

            // Ждем появления модалки (даем время на анимацию)
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Ищем элемент с filterSelectedTime
            const popoverElements = Array.from(
              document.querySelectorAll('*'),
            ).filter((el) => {
              const className = el.className || '';
              return (
                typeof className === 'string' &&
                className.includes('FilterSelectTime_item')
              );
            });

            if (popoverElements.length > 0) {
              const combinedText = popoverElements
                .map((el) => el.textContent?.trim() || '')
                .filter((text) => text !== '')
                .join('\n');

              return combinedText;
            }
          }

          return '';
        });

        if (popoverContent) {
          console.log('📋 Text from popoverContent:', popoverContent);
          await notifyUsers(ownerID, bot, siteURL, popoverContent);
        } else {
          console.log('❌ Popover not found');
        }

        console.log('🔄 Reload page...');
      } catch (error) {
        if (error.name === 'TimeoutError') {
          console.log('⏰ Page laoding timeout, page reload...');
        } else {
          console.error('💥 Error while page loading', error.message);
        }
      }
    }
  } catch (error) {
    console.error('💥 Critical error:', error.message);
    await bot.telegram.sendMessage(
      ownerID,
      `❌ Monitoring error: ${error.message}`,
    );
  } finally {
    await browser.close();
  }
};

async function notifyUsers(ownerID, bot, siteURL, popoverContent) {
  console.log('📤 Sending notify...');

  try {
    await bot.telegram.sendMessage(
      ownerID,
      `${popoverContent}\n\n🎉 НАЙДЕНЫ СЛОТЫ! 🎉\n\nСкорее переходи: ${siteURL}`,
    );

    console.log(`✅ Notify sended to user: ${ownerID}`);
  } catch (error) {
    console.error(`❌ Send error:`, error.message);
  }
}

export default monitorTickets;
