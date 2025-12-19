# ☁️ Strategia Backupu (Google Drive)

Zamiast trzymać zrzuty bazy w repozytorium, zapisujemy je bezpośrednio na chmurze Google.

## 📂 Lokalizacja

* **Dysk:** Google Drive (zamontowany jako dysk w systemie, np. `G:`)
* **Folder:** `zapisy supabase czypolskafirma`

## 📝 Procedura Backupu (TablePlus)

1. Kliknij **Backup database...** w TablePlus.
2. Wybierz połączenie i bazę `postgres`.
3. **KLUCZOWE:** W polu `File name` zmień nazwę na format daty!
   * ✅ Dobrze: `backup_2025-12-15`
   * ❌ Źle: `postgres` (nadpisze poprzedni plik!)
4. Jako miejsce zapisu wybierz folder na Dysku Google.

## 🔄 Odtwarzanie (Restore)

Aby przywrócić bazę, użyj opcji **Restore** w TablePlus i wskaż odpowiedni plik z datą z Dysku Google.

---

> **💡 Tip:** Regularnie sprawdzaj folder na Dysku Google, aby upewnić się, że backupy są tworzone prawidłowo.
