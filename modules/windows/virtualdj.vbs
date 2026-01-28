' =============================================================================
'
' Описание:
'   - Отслеживает изменения файла tracklist.txt.
'   - При изменении читает последнюю непустую строку.
'   - Отправляет её POST‑запросом на http://localhost:<Port>/data.
'   - Порт задаётся через аргумент командной строки.
'
' Запуск:
'   cscript //nologo virtualdj.vbs [Port]
'   Пример: cscript //nologo virtualdj.vbs 3000
'
' Зависимости:
'   - WScript (встроен в Windows).
'   - MSXML2.XMLHTTP (для HTTP‑запросов).
' =============================================================================

' Настройки по умолчанию
Const CHECK_INTERVAL = 4000  ' мс (4 секунды)

' Получение порта из аргументов
Dim port, url
port = WScript.Arguments(0)
url = "http://localhost:" & port & "/data"

' Инициализация объектов
Dim fso, http, file, lastWriteTime, objShell
Set fso = CreateObject("Scripting.FileSystemObject")
Set http = CreateObject("MSXML2.XMLHTTP")
Set objShell = CreateObject("WScript.Shell")

' Раскрываем переменную %LOCALAPPDATA% (путь к AppData\Local)
localAppDataPath = objShell.ExpandEnvironmentStrings("%LOCALAPPDATA%")

' Формируем полный путь к файлу
filePath = localAppDataPath & "\VirtualDJ\History\tracklist.txt"

' Проверка существования файла
If Not fso.FileExists(filePath) Then
    WScript.Echo "ERROR: File not found: " & filePath
    WScript.Quit 1
End If

WScript.Echo "Monitoring file: " & filePath
WScript.Echo "POST URL: " & url
WScript.Echo "Check interval: " & CHECK_INTERVAL/1000 & " sec. Press Ctrl+C to stop."


' Получение начального времени изменения
Set file = fso.GetFile(filePath)
lastWriteTime = file.DateLastModified

' Основная петля
Do While True
    On Error Resume Next
    Err.Clear

    ' Проверка существования файла
    If Not fso.FileExists(filePath) Then
        WScript.Echo "WARNING: File no longer exists: " & filePath
        Exit Do
    End If

    Set file = fso.GetFile(filePath)
    Dim currentWriteTime
    currentWriteTime = file.DateLastModified


    ' Если время изменения поменялось — файл обновился
    If currentWriteTime <> lastWriteTime Then
        lastWriteTime = currentWriteTime
        WScript.Echo VbCrLf & "--- CHANGED: " & FormatDateTime(Now, vbLongTime) & " ---"

        ' Чтение последних 10 строк (имитация -Tail 10)
        Dim lines, lastNonEmpty
        lines = ReadFileUTF8(filePath, 10)
        lastNonEmpty = GetLastNonEmptyLine(lines)


        If Not IsEmpty(lastNonEmpty) Then
            WScript.Echo "Last entry: " & lastNonEmpty


            ' Отправка POST‑запроса с UTF‑8
            SendPostRequest url, lastNonEmpty
        Else
            WScript.Echo "(no non‑empty last line found)"
        End If
    End If

    On Error Goto 0
    WScript.Sleep CHECK_INTERVAL
Loop

' =============================================================================
' Вспомогательные функции
' =============================================================================

Function ReadFileUTF8(filePath, maxLines)
    Dim stream, content, lines
    Set stream = CreateObject("ADODB.Stream")
    
    ' Настройка потока для чтения UTF‑8
    stream.Type = 2  ' Text
    stream.Charset = "UTF-8"
    stream.Open
    stream.LoadFromFile(filePath)
    content = stream.ReadText
    stream.Close


    lines = Split(content, vbLf)
    If UBound(lines) >= maxLines Then
        ' Возвращаем последние maxLines строк
        ReadFileUTF8 = MidArray(lines, UBound(lines) - maxLines + 1)
    Else
        ReadFileUTF8 = lines
    End If
End Function

Function MidArray(arr, startIndex)
    Dim result(), i, j
    ReDim result(UBound(arr) - startIndex)
    j = 0
    For i = startIndex To UBound(arr)
        result(j) = arr(i)
        j = j + 1
    Next
    MidArray = result
End Function

Function GetLastNonEmptyLine(lineArray)
    Dim i, line
    For i = UBound(lineArray) To 0 Step -1
        line = Trim(lineArray(i))
        If Len(line) > 0 Then
            GetLastNonEmptyLine = line
            Exit Function
        End If
    Next
    GetLastNonEmptyLine = Empty
End Function

Sub SendPostRequest(url, data)
    On Error Resume Next
    Err.Clear

    http.Open "POST", url, False  ' False = синхронный запрос
    http.SetRequestHeader "Content-Type", "text/plain; charset=utf-8"
    http.Send "<player>VirtualDJ</player>" & data

    If Err.Number = 0 And http.Status = 200 Then
        WScript.Echo "POST success (HTTP " & http.Status & ")"
    ElseIf Err.Number <> 0 Then
        WScript.Echo "POST failed: " & Err.Description
    Else
        WScript.Echo "POST failed: HTTP " & http.Status & " " & http.StatusText
    End If

    On Error Goto 0
End Sub
