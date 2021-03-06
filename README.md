# djShow (v2.6.1)

С помощью программы djShow диджей на милонге может транслировать название и исполнителя композиции на различные экраны: мониторы, планшеты, телефоны. Программа кроссплатформенная (Linux, Mac, Windows). Основное предназначение - ненавязчивая помощь танцующим ориентироваться в танго-оркестрах и исполнителях. С помощью дополнительных модулей функционал программы можно расширить.


## Принцип работы

Музыкальный проигрыватель с помощью плагина автоматически экспортирует информацию об исполняемой композиции при смене трека. На этом же компьютере запускается простой http-сервер. По адресу: http://IP-компьютера в локальной сети (интернет не нужен) можно видеть файл index.html, который отображает название и исполнителя, обновляясь при появлении новых данных. Пример работы см. на видео: https://youtu.be/WGIcBXKJPKI


## Плейеры, осуществляющие автоматический экспорт данных

- **Linux:** Audacious, Clementine, DeadBeef, JRiver, Mixxx, Rhythmbox.
- **MacOS:** Djay, Embrace, JRiver, iTunes, Mixxx, Swinsian, Traktor, VOX.
- **Windows:** Aimp, JRiver, iTunes, Foobar2000, MediaMonkey, Mixxx, MusicBee, Traktor, Winamp, Windows media player.


## Пошаговая инструкция

### Шаг 1. Скачиваем программу

Пользователям Windows достаточно скачать один архив https://147427.selcdn.ru/img/djShow-2.6.1.zip

Пользователям Linux и MacOS необходимо установить NodeJS с официального сайта http://nodejs.org в минимальной комплектации и скачать скрипт программы. Для скачивания можно нажать на ссылку `Download ZIP` вверху справа или выполнить команду в терминале, которая разархивирует скрипт в папку ~/djShow:

`cd ~/Downloads && curl -L -O https://github.com/SevaXXL/djShow/archive/master.zip && unzip master.zip && rm master.zip && mv djShow-master ~/djShow`

Запускаем скрипт `server.js`:
- Windows - startx86.bat или start_x64.bat для 64-разрядной Windows. Для удобства можно создать ярлык на рабочий стол, запустив сценарий createshortcut.vbs;
- Mac и Linux - в терминале переходим к папке скрипта, например `cd ~/djShow` и пишем: `node server 8888`.

На этом этапе сервер уже работает по адресу: http://127.0.0.1:8888. Можно открыть эту страницу в браузере и подключить второй экран или проектор. При изменении файла `NowPlaying.txt` будет менятся и отображение.


### Шаг 2. Готовим экспорт данных из плейера

Необходимо настроить музыкальный проигрыватель так, чтобы он автоматически экспортировал информацию об исполняемой композиции при смене трека. Это можно сделать с помощью плагинов к плейеру или скриптов. Инструкцию по настройке читайте в [Wiki](https://github.com/SevaXXL/djShow/wiki).

Протестированные решения под Windows:
- Для **Aimp** необходим плагин Current track info to file - [инструкция](https://github.com/SevaXXL/djShow/wiki/Export-from-Aimp)
- Для **Foobar2000** - плагин Now Playing Simple - [инструкция](https://github.com/SevaXXL/djShow/wiki/Export-from-Foobar2000)
- Для **MediaMonkey** - скрипт OutputTextFile.vbs - [инструкция](https://github.com/SevaXXL/djShow/wiki/Export-from-MediaMonkey)
- Для **Mixxx** - скрипт icecast.js в папке scripts
- Для **MusicBee** - плагин Now Playing to External Files - [инструкция](https://github.com/SevaXXL/djShow/wiki/Export-from-MusicBee)
- Для **iTunes, Winamp** и **Windows Media Player** существует несколько решений - уточните в группе проекта
- Для **Traktor** - скрипт icecast.js в папке scripts - [инструкция](https://github.com/SevaXXL/djShow/wiki/Export-from-Traktor)

Под Mac:
- Для **Embrace, iTunes, Swinsian** и **VOX** данные в файл экспортируют соответствующие apple-скрипты из папки scripts
- В плейере **Djay** файл NowPlaying.txt создается автоматически и лежит в папке ~/Music/djay
- Для **Mixxx** - скрипт icecast.js в папке scripts
- Для **Traktor** под Mac [инструкция](https://github.com/SevaXXL/djShow/wiki/Export-from-Traktor) такая же, как и под Windows

Под Linux
- Для **Audacious** достаточно [прописать команду](https://github.com/SevaXXL/djShow/wiki/Export-from-Audacious) в настройках
- Для **Clementine** и **Deadbeef** необходимо [запустить соответствующий скрипт](https://github.com/SevaXXL/djShow/wiki/Child-process) в папке scripts
- Для **Mixxx** - скрипт icecast.js в папке scripts
- Для **Rhythmbox** - плагин в папке scripts


### Шаг 3. Создаем сеть

Включаем wifi-роутер. С любого устройства в сети переходим по адресу: http://IP-компьютера. Узнать IP можно при старте программы с включенной сетью. Также сеть можно создать с помощью телефона, планшета или ноутбука.


## Контакты

Автор программы - Александр Дейнега. Если есть вопросы, пожалуйста, обращайтесь
- личным сообщением в соцсети: https://www.facebook.com/adeinega
- в группе проекта djShow на Facebook: https://www.facebook.com/groups/448365622022494/
- по email: adeinega@mail.ru

Мне очень важна обратная связь. Я с удовольствием помогу вам настроить программу и отвечу на все вопросы.


## Версии

2.6.x - Небольшие подкапотные изменения и переход на новую версию Nodejs.

2.5.x - Поддержка Windows Phone и старых браузеров.

2.4.x - Возможность подключения внешних модулей в работе сервера.

2.3.x - Мультиязычность.

2.2.x - Новые возможности в API.

2.1.x - Добавлена возможность расширять возможности программы сторонними сценариями.

2.0.x - Миграция на Nodejs и переход на Server Side Events.

1.x.x - Первые версии пограммы работали с помощью ajax-запросов. Сервер отдавал только статику.