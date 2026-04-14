Attribute VB_Name = "BaustellenAngebote"
Option Explicit

' =====================================================================
' Baustellen-Angebote-Sige-Gesamt 2026.xlsx
' Makros zum Einfuegen neuer Angebotszeilen, ohne das Deckblatt (A-H)
' zu verschieben, sowie zur Fixierung des Datumsformats in Spalte I.
' =====================================================================

' Konfiguration: ab welcher Spalte eingefuegt wird und welche Spalte
' das Datum traegt. Anpassen falls sich das Layout aendert.
Private Const INSERT_START_COL As String = "I"   ' Einfuegen erst ab Spalte I
Private Const DATE_COL         As String = "I"   ' "Suche"-Datumsspalte
Private Const HEADER_ROWS      As Long = 1       ' Anzahl Kopfzeilen ueber den Daten

'====================================================================
' Fuegt n neue Zeilen NUR im Bereich ab Spalte I ein.
' Die Zellen A-H bleiben an Ort und Stelle (Deckblatt unveraendert).
' Aufruf: per Button oder Alt+F8; fragt nach Position und Anzahl.
'====================================================================
Public Sub NeueAngebotszeileEinfuegen()
    Dim ws As Worksheet
    Set ws = ActiveSheet

    Dim startRow As Variant
    startRow = Application.InputBox( _
        Prompt:="Vor welcher Zeile soll eingefuegt werden?", _
        Title:="Neue Angebotszeile", _
        Default:=ActiveCell.Row, Type:=1)
    If VarType(startRow) = vbBoolean Then Exit Sub
    If startRow <= HEADER_ROWS Then
        MsgBox "Einfuegen innerhalb oder oberhalb der Kopfzeile nicht erlaubt.", vbExclamation
        Exit Sub
    End If

    Dim nRows As Variant
    nRows = Application.InputBox( _
        Prompt:="Wie viele Zeilen einfuegen?", _
        Title:="Anzahl", Default:=1, Type:=1)
    If VarType(nRows) = vbBoolean Then Exit Sub
    If nRows < 1 Then Exit Sub

    Dim lastCol As Long
    lastCol = ws.Cells.SpecialCells(xlCellTypeLastCell).Column
    If lastCol < ws.Range(INSERT_START_COL & "1").Column Then
        lastCol = ws.Range(INSERT_START_COL & "1").Column
    End If

    Dim rngShift As Range
    Set rngShift = ws.Range( _
        ws.Cells(CLng(startRow), INSERT_START_COL), _
        ws.Cells(CLng(startRow) + CLng(nRows) - 1, lastCol))

    Application.ScreenUpdating = False
    rngShift.Insert Shift:=xlShiftDown, CopyOrigin:=xlFormatFromLeftOrAbove

    ' Datumsformat und Spaltenbreite nach dem Einfuegen sicherstellen
    DatumsformatFixieren
    Application.ScreenUpdating = True
End Sub

'====================================================================
' Setzt die Datumsspalte (I) auf TT.MM.JJJJ und passt die Breite an.
' Wandelt vorhandene Texte wie "14.04" in echte Datumswerte um.
'====================================================================
Public Sub DatumsformatFixieren()
    Dim ws As Worksheet
    Set ws = ActiveSheet

    Dim lastRow As Long
    lastRow = ws.Cells(ws.Rows.Count, DATE_COL).End(xlUp).Row
    If lastRow <= HEADER_ROWS Then Exit Sub

    Dim r As Long, v As Variant, d As Date
    For r = HEADER_ROWS + 1 To lastRow
        v = ws.Cells(r, DATE_COL).Value
        If VarType(v) = vbString And Len(Trim$(CStr(v))) > 0 Then
            If TryParseDate(CStr(v), d) Then
                ws.Cells(r, DATE_COL).Value = d
            End If
        End If
    Next r

    ws.Range(ws.Cells(HEADER_ROWS + 1, DATE_COL), _
             ws.Cells(lastRow, DATE_COL)).NumberFormat = "TT.MM.JJJJ"
    ws.Columns(DATE_COL).AutoFit
    If ws.Columns(DATE_COL).ColumnWidth < 12 Then
        ws.Columns(DATE_COL).ColumnWidth = 12
    End If
End Sub

Private Function TryParseDate(ByVal s As String, ByRef outDate As Date) As Boolean
    On Error GoTo fail
    Dim parts() As String
    Dim dd As Integer, mm As Integer, yy As Integer
    parts = Split(Trim$(s), ".")
    Select Case UBound(parts)
        Case 1  ' "14.04" -> Jahr der Arbeitsmappe
            dd = CInt(parts(0))
            mm = CInt(parts(1))
            yy = Year(Date)
            outDate = DateSerial(yy, mm, dd)
            TryParseDate = True
        Case 2  ' "02.03.2026"
            dd = CInt(parts(0))
            mm = CInt(parts(1))
            yy = CInt(parts(2))
            outDate = DateSerial(yy, mm, dd)
            TryParseDate = True
        Case Else
            TryParseDate = False
    End Select
    Exit Function
fail:
    TryParseDate = False
End Function
