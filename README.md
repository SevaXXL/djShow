# djShow (v2.2.1)

С помощью программы djShow танго-диджей на милонге может транслировать название и исполнителя композиции на различные устройства: мониторы, планшеты, телефоны. Программа работает под Windows, Mac и Linux, имеет пользовательские настройки и полностью автоматизирована.

## Принцип работы

Музыкальный проигрыватель записывает в текстовый файл информацию об исполняемой композиции. На этом же компьютере запускается простой http-сервер. По адресу: http://IP-компьютера в локальной сети можно видеть файл index.html, который отображает название и исполнителя, самостоятельно обновляясь при изменении файла с данными. Пример работы см. на видео: https://youtu.be/WGIcBXKJPKI


## Пошаговая инструкция

**Шаг 1. Готовим файл с данными**

Файл NowPlaying.txt обновляется музыкальным проигрывателем при смене исполняемой композиции. Файл должен быть в кодировке UTF-8 и содержать следующую информацию:

    <title>...</title><artist>...</artist>
или

    Title: ...
    Artist: ...

Протестированные решения под Windows:
- Для Aimp необходим плагин Current track info to file - http://www.aimp.ru/index.php?do=catalog&rec_id=358
- Для Foobar2000 - плагин Now Playing Simple - http://skipyrich.com/wiki/Foobar2000:Now_Playing_Simple

Под Mac:
- Для iTunes, Swinsian и VOX - скрипты NowPlaying[...].app, приложены в папке additional. Для других поригрывателей под Mac можно написать аналогичные скрипты самостоятельно (смотрите код).
- В плейере Djay файл NowPlaying.txt создается автоматически и лежит в папке /Users/%username%/Music/djay

**Шаг 2. Включаем мини-сервер**

Устанавливаем Nodejs с официального сайта http://nodejs.org. При установке можем выбрать, что нам нужна только сама программа, без дополнений. Запускаем скрипт `server.js`:
- Windows - создаем файл start.bat с содержимым: `"C:\Program Files\nodejs\node.exe" server.js`
- Mac и Linux - `$ sudo node  путь_к_скрипту/server.js`.

На этом этапе программа уже работает по адресу: http://localhost или http://127.0.0.1. Можно открыть эту страницу в браузере и подключить второй экран или проектор.

**Шаг 3. Создаем сеть**

Включаем wifi-роутер. С любого устройства в сети переходим по адресу: http://IP-компьютера.

## Контакты

Если есть вопросы, пожалуйста, обращайтесь по email: adeinega@mail.ru или https://www.facebook.com/adeinega Группа проекта djShow на Facebook - https://www.facebook.com/groups/448365622022494/


## Версии

2.2.x - Новые возможности в API.

2.1.x - Добавлена возможность расширять возможности программы сторонними сценариями.

2.0.x - Миграция на Nodejs и переход на Server-Sent Events.

1.x.x - Первые версии пограммы работали с помощью ajax-запросов. Сервер отдавал только статику.