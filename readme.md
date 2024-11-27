Для запуска на сервере без GUI надо:
1. Установить chromium executablePath. Один из вариантов:
sudo apt-get install -y snapd
sudo snap install chromium
2. В pupeeteer.launch добавить атрибут executablePath: '/snap/bin/chromium'