# djShow (v2.4.0)

С помощью программы djShow танго-диджей на милонге может транслировать название и исполнителя композиции на различные устройства: мониторы, планшеты, телефоны. Программа кроссплатформенная, имеет пользовательские настройки и не создает нагрузки при работе.


## Принцип работы

Музыкальный проигрыватель с помощью плагина экспортирует информацию об исполняемой композиции. На этом же компьютере запускается простой http-сервер. По адресу: http://IP-компьютера в локальной сети можно видеть файл index.html, который отображает название и исполнителя, автоматически обновляясь при появлении новых данных. Пример работы см. на видео: https://youtu.be/WGIcBXKJPKI


## Пошаговая инструкция

### Шаг 1. Готовим экспорт данных из плейера

Необходимо настроить музыкальный проигрыватель так, чтобы он экспортировал информацию об исполняемой композиции. Это можно сделать с помощью плагинов к плейеру или скриптов.

Протестированные решения под Windows:
- Для **Aimp** необходим плагин [Current track info to file](https://github.com/SevaXXL/djShow/wiki/Export-from-Aimp-Windows)
- Для **Foobar2000** - плагин [Now Playing Simple](https://github.com/SevaXXL/djShow/wiki/Export-from-Foobar2000-Windows)
- Для **MusicBee** - плагин [Now Playing to External Files](https://github.com/SevaXXL/djShow/wiki/Export-from-MusicBee-Windows)
- Для **iTunes, Winamp** и **Windows Media Player** существует несколько решений - уточните в группе проекта.
- Для **Traktor** - скрипт в папке scripts.

Под Mac:
- Для **iTunes, Swinsian, Traktor** и **VOX** данные в файл экспортируют соответствующие скрипты из папки scripts. Для других проигрывателей под Mac можно написать аналогичные скрипты самостоятельно (смотрите код).
- В плейере **Djay** файл NowPlaying.txt создается автоматически и лежит в папке ~/Music/djay

Под Linux
- Для **Audacious, Clementine, Deadbeef** и **Rhythmbox** - соответствующие скрипты в папке scripts.

### Шаг 2. Копируем файлы и включаем мини-сервер

Скачиваем файлы djShow кнопкой `Download ZIP` и распаковываем в любое удобное место на компьютере, например, `D:\djShow` (Windows), или `~/djShow` (Mac, Linux). Для работы также необходима небольшая программа NodeJS, которую устанавливаем с официального сайта http://nodejs.org (можно установить в минимальной комплектации без npm и пр.). Итак, имеем папку с файлами проекта и программу NodeJS в системе. С помощью NodeJS запускаем скрипт из папки проекта `server.js`:
- Windows - создаем файл start.bat с содержимым: `"C:\Program Files\nodejs\node.exe" server.js`
- Mac и Linux - в Терминале пишем: `$ sudo node ~/djShow/server.js`

На этом этапе сервер уже работает по адресу: http://127.0.0.1. Можно открыть эту страницу в браузере и подключить второй экран или проектор. Если страница не открывается, возможно, что 80-й порт уже занят другой программой. Можно назначить новый порт, указав его при старте: `node.exe server.js 8000` http://127.0.0.1:8000

### Шаг 3. Создаем сеть

Включаем wifi-роутер. С любого устройства в сети переходим по адресу: http://IP-компьютера.


## Контакты

Если есть вопросы, пожалуйста, обращайтесь по email: adeinega@mail.ru, или пишите в группе проекта djShow на Facebook - https://www.facebook.com/groups/448365622022494/


## Версии

2.4.x - Возможность подключения внешних модулей в работе сервера.

2.3.x - Мультиязычность.

2.2.x - Новые возможности в API.

2.1.x - Добавлена возможность расширять возможности программы сторонними сценариями.

2.0.x - Миграция на Nodejs и переход на Server-Sent Events.

1.x.x - Первые версии пограммы работали с помощью ajax-запросов. Сервер отдавал только статику.