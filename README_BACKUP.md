# 🚀 One-Click Save - Backup Guide

## Szybkie użycie

```bash
npm run save
```

Automatycznie:
1. Dodaje wszystkie zmienione pliki (`git add .`)
2. Tworzy commit z datą i godziną
3. Pushuje na GitHub

---

## Jednorazowa konfiguracja GitHub

**Jeśli repozytorium NIE jest jeszcze podłączone do GitHub:**

### 1. Utwórz nowe repo na GitHub
- Wejdź na [github.com/new](https://github.com/new)
- Nazwa: np. `czypolskafirma`
- Pozostaw puste (bez README, .gitignore)
- Kliknij "Create repository"

### 2. Podłącz lokalne repo

```bash
# Zainicjuj git (jeśli jeszcze nie ma)
git init

# Dodaj zdalne repo (zamień YOUR_USERNAME na swoją nazwę)
git remote add origin https://github.com/YOUR_USERNAME/czypolskafirma.git

# Pierwszy push
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 3. Gotowe! 
Od teraz `npm run save` działa automatycznie.

---

## Alternatywna wiadomość commita

Jeśli chcesz własny opis zamiast daty:

```bash
git add . && git commit -m "feat: nowa funkcja wyszukiwania" && git push
```

---

## Troubleshooting

| Problem | Rozwiązanie |
|---------|-------------|
| `fatal: not a git repository` | Uruchom `git init` |
| `fatal: No configured push destination` | Dodaj remote: `git remote add origin URL` |
| `Authentication failed` | Użyj [GitHub CLI](https://cli.github.com/) lub [Personal Access Token](https://github.com/settings/tokens) |
