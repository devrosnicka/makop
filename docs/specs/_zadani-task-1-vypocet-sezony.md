# Task 1: Výpočet sezónního příspěvku

## Cíl
Umožnit správci týmu vytvořit sezónu, vybrat hráče, zadat náklady sezóny a vypočítat příspěvek na jednoho hráče.

Výsledek výpočtu musí být uložen jako samostatný záznam, který se po potvrzení již automaticky nepřepočítává.

## Uživatelský scénář
1. Správce založí novou sezónu.
2. Vybere hráče, kteří se sezóny zúčastní.
3. Zadá vstupní parametry:
   - poplatek za jednoho hráče
   - cena za odpískání jednoho zápasu
   - počet zápasů k odpískání
4. Systém spočítá:
   - náklady za registraci hráčů
   - náklady za pískání
   - celkové náklady sezóny
   - příspěvek na jednoho hráče
5. Správce výpočet potvrdí.
6. Výsledek se uloží jako snapshot sezóny.

## Výpočtová logika

### Vstupy
selectedPlayersCount
playerRegistrationFee
refereeMatchFee
refereeMatchCount

### Výpočet
registrationCost = selectedPlayersCount * playerRegistrationFee

refereeCost = refereeMatchFee * refereeMatchCount

totalSeasonCost = registrationCost + refereeCost

playerContribution = ceil(totalSeasonCost / selectedPlayersCount)

Poznámka:
Zaokrouhlování nahoru zajistí, že na účtu týmu nebude chybět žádná částka.
Přebytek zůstává na účtu týmu.

## Datový model

### Season
id
name
createdAt
createdBy

### SeasonCalculation
id
seasonId
playerRegistrationFee
refereeMatchFee
refereeMatchCount
selectedPlayersCount
registrationCost
refereeCost
totalSeasonCost
playerContribution
isLocked
createdAt

### SeasonCalculationPlayer
id
seasonCalculationId
playerId
playerNameSnapshot

## Pravidla

### Výběr hráčů
- do výpočtu vstupují pouze ručně vybraní hráči
- počet hráčů musí být alespoň 1

### Uzamčení
Po potvrzení:
isLocked = true

Po uzamčení:
- nelze měnit vstupní parametry
- nelze měnit seznam hráčů
- nelze automaticky přepočítat částku

### Pozdější přidání hráče
Není součástí této verze.
Pokud se hráč přidá do týmu později:
- výpočet se nepřepočítává
- stávající příspěvky se nemění

### Oprava chyby
Pokud správce udělal chybu:
- smaže výpočet
- vytvoří nový

Editace zamčeného výpočtu není podporována.

## Akceptační kritéria
### AC1
Po zadání vstupních parametrů systém spočítá:
- registrační náklady
- náklady za pískání
- celkové náklady
- příspěvek na hráče

### AC2
Po potvrzení vznikne záznam SeasonCalculation.

### AC3
Po potvrzení vznikne snapshot všech vybraných hráčů.

### AC4
Po uzamčení nelze měnit vstupní parametry.

### AC5
Po uzamčení nelze měnit seznam hráčů.

### AC6
Nový hráč přidaný do týmu neovlivní existující výpočet.

## Mimo rozsah
- QR platby
- bankovní párování
- částečné platby
- individuální slevy
- různé příspěvky pro různé hráče
- automatické přepočty
- úpravy uzamčeného výpočtu
