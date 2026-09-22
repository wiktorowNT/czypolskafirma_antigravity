-- Nowa kategoria "Edukacja" (backlog 2026-09, zadanie 3). Uruchom w Supabase SQL Editor.
-- Ikona GraduationCap jest zmapowana w components/category-icon.tsx (inna nazwa -> Tag).
-- Automat firm (tools/firmy/) czyta kategorie z bazy, więc po wstawieniu sam zacznie jej używać.
insert into categories (name, slug, description, icon)
select
  'Edukacja',
  'edukacja',
  'Szkoły i uczelnie prywatne, szkoły językowe, platformy e-learningowe, korepetycje i kursy online, wydawnictwa edukacyjne i podręcznikowe, organizatorzy szkoleń i certyfikacji. Nie zaliczamy: księgarni i sieci sprzedaży książek (Handel), wydawnictw prasowych i beletrystyki (Media i Rozrywka), oprogramowania dla szkół, jeśli firma nie prowadzi zajęć ani nie tworzy treści edukacyjnych (IT-Technologie).',
  'GraduationCap'
where not exists (select 1 from categories where slug = 'edukacja');
