# djShow (v2.3.0)

С помощью программы djShow танго-диджей на милонге может транслировать название и исполнителя композиции на различные устройства: мониторы, планшеты, телефоны. Программа работает под Windows, Mac и Linux, имеет пользовательские настройки, полностью автоматизирована и практически не создает нагрузки.


## Принцип работы

Музыкальный проигрыватель с помощью плагина или скрипта экспортирует информацию об исполняемой композиции. На этом же компьютере запускается простой http-сервер. По адресу: http://IP-компьютера в локальной сети можно видеть файл index.html, который отображает название и исполнителя, самостоятельно обновляясь при появлении новых данных. Пример работы см. на видео: https://youtu.be/WGIcBXKJPKI


## Пошаговая инструкция

**Шаг 1. Копируем файлы и включаем мини-сервер**

Скачиваем с Github'а файлы djShow кнопкой `Download ZIP` и разархивируем в любое удобное место на компьютере. Например, `D:\djShow` (Windows), или `~/djShow` (Mac, Linux). Расположение и название папки может быть любым. Для работы также необходима программа NodeJS, которую устанавливаем с официального сайта http://nodejs.org. Можно установить всё по умолчанию, а можно только саму программу (без npm и прочего). Итак, имеем папку с файлами проекта и программу NodeJS в системе. С помощью NodeJS запускаем скрипт из папки проекта `server.js`:
- Windows - создаем файл start.bat с содержимым: `"C:\Program Files\nodejs\node.exe" server.js`
- Mac и Linux - в Терминале пишем: `$ sudo node ~/djShow/server.js`

Если программа написала: "djShow running...", значит сервер уже работает. По адресу: http://127.0.0.1 можно открыть страницу в браузере и подключить второй экран или проектор и увидеть информацию из файла NowPlaying.txt.

**Шаг 2. Готовим экспорт данных из плейера**

Необходимо настроить музыкальный проигрыватель так, чтобы он экспортировал информацию об исполняемой композиции. Это можно сделать с помощью плагинов к плейеру или отдельных скриптов.

Протестированные решения под Windows:
- Для Aimp необходим плагин Current track info to file. Ссылка на плагин и инструкция по настройке: https://github.com/SevaXXL/djShow/wiki/Export-from-Aimp-Windows
- Для Foobar2000 - плагин Now Playing Simple. Ссылка на плагин и инструкция: https://github.com/SevaXXL/djShow/wiki/Export-from-Foobar2000-Windows
- Для iTunes, Winamp, Windows Media Player существует несколько решений - уточните в группе проекта.

Под Mac:
- Для iTunes, Swinsian и VOX - соответствующие скрипты, приложены в папке scripts. Для других поригрывателей под Mac можно написать аналогичные скрипты самостоятельно (смотрите код).
- В плейере Djay файл NowPlaying.txt создается автоматически и лежит в папке ~/Music/djay

Под Linux
- Для Clementine скрипт на python в папке scripts.

**Шаг 3. Создаем сеть**

Включаем wifi-роутер. С любого устройства в сети переходим по адресу: http://IP-компьютера.


## Контакты

Если есть вопросы, пожалуйста, обращайтесь по email: adeinega@mail.ru, или пишите в группе проекта djShow на Facebook - https://www.facebook.com/groups/448365622022494/


## Версии

2.3.x - Мультиязычность.

2.2.x - Новые возможности в API.

2.1.x - Добавлена возможность расширять возможности программы сторонними сценариями.

2.0.x - Миграция на Nodejs и переход на Server-Sent Events.

1.x.x - Первые версии пограммы работали с помощью ajax-запросов. Сервер отдавал только статику.