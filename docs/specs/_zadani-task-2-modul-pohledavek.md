# Task 2: Obecný modul pohledávek

## Cíl
Vytvořit obecný systém pohledávek, který bude použitelný pro:
- sezónní příspěvek
- dresy
- pokuty
- přátelské zápasy
- jakékoliv budoucí platby

## Datový model

### Receivable
id
playerId
title
description
amount
dueDate
status (pending, partially_paid, paid, cancelled)
sourceType (season, jersey, friendly_match, manual)
sourceId
createdAt

### Payment
id
receivableId
amount
paidAt
note
createdAt

## Pravidla
Pohledávka může být uhrazena jednou nebo více platbami.
Status se počítá automaticky podle součtu plateb.

## Akceptační kritéria

### AC1
Lze vytvořit pohledávku ručně.

### AC2
Lze vytvořit pohledávku ze sezónního výpočtu.

### AC3
Lze evidovat více plateb k jedné pohledávce.

### AC4
Status se aktualizuje automaticky.

### AC5
Lze zobrazit seznam dlužníků.

## Mimo rozsah
- QR kódy
- bankovní API
- automatické párování
- notifikace
- upomínky
