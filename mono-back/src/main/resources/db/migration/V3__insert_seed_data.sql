-- Demo seed: 45 users so paging is visible (3 pages at the default page size of 20). login_id,
-- full_name, and updated_at are given independent orders (hence the two row_number() orderings)
-- so that sorting by each one visibly reorders the list.

WITH family_name (ord, name) AS (
    VALUES (1, 'Tanaka'), (2, 'Suzuki'), (3, 'Sato'), (4, 'Watanabe'), (5, 'Yamamoto')
),
given_name (ord, name) AS (
    VALUES (1, 'Taro'), (2, 'Hanako'), (3, 'Kenji'), (4, 'Misaki'), (5, 'Ryo'),
           (6, 'Naoki'), (7, 'Yuko'), (8, 'Daisuke'), (9, 'Emi')
),
numbered AS (
    SELECT
        family_name.name || ' ' || given_name.name AS full_name,
        row_number() OVER (ORDER BY family_name.ord, given_name.ord) AS register_seq,
        row_number() OVER (ORDER BY given_name.ord, family_name.ord) AS update_seq
    FROM family_name CROSS JOIN given_name
)
INSERT INTO app.users (id, login_id, full_name, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'user' || to_char(register_seq, 'FM000'),
    full_name,
    TIMESTAMPTZ '2026-01-06 09:00:00+09' + (register_seq - 1) * INTERVAL '1 day',
    TIMESTAMPTZ '2026-05-01 09:00:00+09' - (update_seq - 1) * INTERVAL '1 day'
FROM numbered;
