# Datenbank: Spielstände und Bestenliste

## Was es schon gibt

| Daten | Wo gespeichert | Einrichtung |
|---|---|---|
| Spielstand (Sterne, Edelsteine, Upgrades) | Auf CrazyGames über deren SDK im Konto des Spielers, sonst im Browser | keine, läuft automatisch |
| Weltweite Bestenliste (Endlos-Modus) | **Supabase** (kostenlose Datenbank) | einmalig ca. 10 Minuten, siehe unten |

Solange Supabase nicht eingerichtet ist, bleibt der Knopf „Bestenliste“ ausgeblendet. Das Spiel funktioniert auch ohne.

## Supabase einrichten

1. Auf **supabase.com** ein kostenloses Konto anlegen und ein neues Projekt erstellen. Region: *Central EU (Frankfurt)*, wegen der DSGVO.
2. Links auf **SQL Editor** gehen, folgendes einfügen und **Run** drücken:

```sql
create table public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 14),
  wave int not null check (wave between 1 and 300),
  map int not null default 0 check (map between 0 and 4),
  created_at timestamptz not null default now()
);
alter table public.scores enable row level security;
create policy "alle duerfen lesen" on public.scores for select to anon using (true);
create policy "alle duerfen eintragen" on public.scores for insert to anon
  with check (char_length(name) between 2 and 14 and wave between 1 and 300);
create index scores_best on public.scores (wave desc, created_at);
```

3. Unter **Project Settings → API** zwei Werte kopieren:
   - *Project URL* (z. B. `https://abcd1234.supabase.co`)
   - *anon public* Key (der lange Schlüssel, **nicht** der `service_role`-Key)
4. Beide Werte an mich schicken oder in `publish/angaben.json` bei `SUPABASE_URL` und `SUPABASE_ANON_KEY` eintragen, danach `python3 build.py` ausführen.

Der *anon*-Key darf öffentlich im Spiel stehen, dafür ist er gedacht. Die Regeln oben erlauben nur Lesen und neue Einträge, kein Ändern oder Löschen. Den *service_role*-Key niemals weitergeben.

## Pflege

- **Unpassende Namen löschen:** Im Supabase-Dashboard unter *Table Editor → scores* die Zeile löschen.
- **Schummler:** Ohne eigenen Server kann ein technisch versierter Spieler falsche Werte eintragen. Die Datenbank lässt höchstens Welle 300 zu, unrealistische Einträge löschst du einfach.
- **Datenschutz:** Gespeichert werden nur der selbst gewählte Spielername, die Welle und die Uhrzeit. Ergänze in der Datenschutzerklärung einen Absatz über Supabase als Auftragsverarbeiter. Den Text dafür schreibe ich dir, sobald Supabase aktiv ist.
