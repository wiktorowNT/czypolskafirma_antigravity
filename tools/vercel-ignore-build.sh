#!/bin/bash
# Ignored Build Step dla Vercela (vercel.json -> ignoreCommand).
# Kod wyjścia 0 = pomiń build, 1 = buduj.
#
# Każde wdrożenie produkcji zmienia nazwy plików JS, a stare zwracają 404.
# Google pobiera HTML i renderuje go z opóźnieniem — jeśli w międzyczasie weszło
# nowe wdrożenie, strona pokazuje tylko ogólny komunikat Next.js, a Google klastruje
# ją z obcymi serwisami (problem „Duplikat” w GSC, październik 2026). Dlatego commity, które
# nie zmieniają strony (dokumentacja, narzędzia, pliki robocze), nie budują wdrożenia.
#
# Porównujemy z ostatnim udanym wdrożeniem, a nie z HEAD^ — push kilku commitów
# naraz sprawdza tylko ostatni, więc commit z kodem schowany za commitem z docs
# by się nie wdrożył. Przy jakiejkolwiek niepewności budujemy.

BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"

if [ -z "$BASE" ] || ! git cat-file -e "${BASE}^{commit}" 2>/dev/null; then
  echo "Brak poprzedniego wdrożenia w historii klonu — buduję."
  exit 1
fi

if git diff --quiet "$BASE" HEAD -- . \
  ':(exclude)docs' \
  ':(exclude)tools' \
  ':(exclude)data/robocze' \
  ':(exclude)data/panel' \
  ':(exclude)scratch' \
  ':(exclude)CLAUDE.md' \
  ':(exclude)README.md' \
  ':(exclude)README_BACKUP.md'; then
  echo "Zmiany tylko w dokumentacji, narzędziach lub plikach roboczych — pomijam build."
  exit 0
fi

echo "Zmiany w kodzie lub danych strony — buduję."
exit 1
