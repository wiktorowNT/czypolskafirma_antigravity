// Bezpiecznik dla `npm run save`.
//
// Poprzednia wersja skryptu w package.json to bylo:
//   git add . && git commit -m "auto-save" && git push
// czyli bez zadnego hamulca. Jedno roztargnienie na galezi main oznaczalo
// natychmiastowy deploy produkcji, a CLAUDE.md zakazuje jakichkolwiek zmian
// na main. `git add .` dorzucalo przy okazji wszystko, co lezalo w drzewie.
//
// Ta wersja:
//   1. odmawia pracy poza galezia develop,
//   2. nie robi `git add .` - pokazuje, co jest do dodania, i czeka na
//      potwierdzenie,
//   3. pozwala podac wlasny opis commita.
//
// Uzycie:
//   npm run save
//   npm run save -- "opis commita"
//   npm run save -- --yes            (bez pytania, do wlasnych skrotow)

import { execFileSync, execSync } from "node:child_process";
import readline from "node:readline";

const GALAZ_DOZWOLONA = "develop";
const GALEZIE_ZAKAZANE = ["main", "master"];

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function przerwij(powod) {
  console.error(`\n  npm run save przerwany: ${powod}\n`);
  process.exit(1);
}

// --- 1. Na jakiej galezi jestesmy -----------------------------------------

let galaz;
try {
  galaz = git("branch", "--show-current");
} catch {
  przerwij("nie udalo sie odczytac galezi (to w ogole repozytorium git?).");
}

if (!galaz) {
  przerwij(
    "jestes w stanie detached HEAD, bez galezi.\n" +
      `  Przejdz na ${GALAZ_DOZWOLONA}: git switch ${GALAZ_DOZWOLONA}`
  );
}

if (GALEZIE_ZAKAZANE.includes(galaz)) {
  przerwij(
    `jestes na galezi "${galaz}". To produkcja.\n` +
      "  CLAUDE.md zabrania commitowania i pushowania na main.\n" +
      `  Przejdz na ${GALAZ_DOZWOLONA}: git switch ${GALAZ_DOZWOLONA}`
  );
}

if (galaz !== GALAZ_DOZWOLONA) {
  przerwij(
    `jestes na galezi "${galaz}", a ten skrypt dziala tylko na "${GALAZ_DOZWOLONA}".\n` +
      `  Przejdz na ${GALAZ_DOZWOLONA}: git switch ${GALAZ_DOZWOLONA}\n` +
      "  Albo zacommituj recznie, jesli swiadomie pracujesz na galezi roboczej:\n" +
      "    git add <konkretne pliki> && git commit && git push -u origin " +
      galaz
  );
}

// --- 2. Co jest do zapisania ----------------------------------------------

const status = git("status", "--porcelain");
if (!status) {
  console.log("\n  Nie ma czego zapisywac, drzewo jest czyste.\n");
  process.exit(0);
}

const argumenty = process.argv.slice(2);
const bezPytania = argumenty.includes("--yes") || argumenty.includes("-y");
const opis =
  argumenty.filter((a) => a !== "--yes" && a !== "-y").join(" ").trim() ||
  "auto-save";

console.log(`\n  Galaz: ${galaz}`);
console.log(`  Opis commita: ${opis}`);
console.log("\n  Zmiany, ktore zostana zapisane:\n");
console.log(
  status
    .split("\n")
    .map((linia) => `    ${linia}`)
    .join("\n")
);

const nieSledzone = status
  .split("\n")
  .filter((l) => l.startsWith("??"))
  .map((l) => l.slice(3));
if (nieSledzone.length > 0) {
  console.log(
    `\n  Uwaga: ${nieSledzone.length} nowych, niesledzonych sciezek (powyzej z "??").`
  );
  console.log("  Sprawdz, czy nie ma tam plikow, ktore nie powinny trafic do repo.");
}

console.log("\n  Skrypt doda WSZYSTKIE powyzsze pliki (git add -A).");
console.log("  Jesli chcesz zapisac tylko czesc, przerwij i zrob to recznie:");
console.log("    git add <konkretne pliki> && git commit -m \"...\" && git push\n");

// --- 3. Potwierdzenie -----------------------------------------------------

if (!bezPytania) {
  if (!process.stdin.isTTY) {
    przerwij(
      "brak terminala interaktywnego, a potwierdzenie jest wymagane.\n" +
        "  Jesli naprawde chcesz zapisac bez pytania, uzyj: npm run save -- --yes"
    );
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const odpowiedz = await new Promise((resolve) =>
    rl.question("  Zapisac i wypchnac? [t/N] ", (a) => {
      rl.close();
      resolve(a.trim().toLowerCase());
    })
  );

  if (odpowiedz !== "t" && odpowiedz !== "tak" && odpowiedz !== "y") {
    console.log("\n  Anulowane, nic nie zostalo zmienione.\n");
    process.exit(0);
  }
}

// --- 4. Zapis -------------------------------------------------------------

// Ostatnia kontrola galezi: miedzy wypisaniem statusu a potwierdzeniem
// ktos mogl przelaczyc galaz w innym oknie.
if (git("branch", "--show-current") !== GALAZ_DOZWOLONA) {
  przerwij("galaz zmienila sie w trakcie dzialania skryptu.");
}

try {
  console.log("");
  execSync("git add -A", { stdio: "inherit" });
  execFileSync("git", ["commit", "-m", opis], { stdio: "inherit" });
  execSync(`git push -u origin ${GALAZ_DOZWOLONA}`, { stdio: "inherit" });
  console.log(`\n  Zapisane i wypchniete na ${GALAZ_DOZWOLONA}.\n`);
} catch {
  przerwij("git zwrocil blad (szczegoly powyzej).");
}
