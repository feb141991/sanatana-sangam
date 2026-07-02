-- ─── Migration v56 — Initial Akasha Sync Content Library ──────────────

-- 1. Insert Gita 2.47 with full metadata
INSERT INTO public.shlokas (id, name, devanagari, translation, sync_metadata)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Gita 2.47',
    'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन । मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.',
    '[
        {"start": 0,    "end": 800,  "word": "कर्मण्ये"},
        {"start": 800,  "end": 1800, "word": "वाधिकारस्ते"},
        {"start": 1800, "end": 2400, "word": "मा"},
        {"start": 2400, "end": 3200, "word": "फलेषु"},
        {"start": 3200, "end": 4200, "word": "कदाचन"},
        {"start": 4200, "end": 5000, "word": "।"},
        {"start": 5000, "end": 5800, "word": "मा"},
        {"start": 5800, "end": 6800, "word": "कर्मफलहेतुर्भूर्मा"},
        {"start": 6800, "end": 7400, "word": "ते"},
        {"start": 7400, "end": 8200, "word": "सङ्गोऽस्त्वकर्मणि"},
        {"start": 8200, "end": 9000, "word": "।।"}
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Hanuman Chalisa Intro (Shri Guru Charan Saroj Raj)
INSERT INTO public.shlokas (id, name, devanagari, translation, sync_metadata)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Hanuman Chalisa Intro',
    'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि । बरनऊ रघुबर बिमल जसु जो दायकु फल चारि ॥',
    'Having cleansed the mirror of my mind with the dust of my Guru’s lotus feet, I describe the pure glory of Lord Rama.',
    '[
        {"start": 0,    "end": 1000, "word": "श्रीगुरु"},
        {"start": 1000, "end": 1800, "word": "चरन"},
        {"start": 1800, "end": 2600, "word": "सरोज"},
        {"start": 2600, "end": 3400, "word": "रज"},
        {"start": 3400, "end": 4200, "word": "निज"},
        {"start": 4200, "end": 5000, "word": "मनु"},
        {"start": 5000, "end": 5800, "word": "मुकुरु"},
        {"start": 5800, "end": 6600, "word": "सुਧਾਰਿ"},
        {"start": 6600, "end": 7400, "word": "।"},
        {"start": 7400, "end": 8200, "word": "ਬਰਨਊ"},
        {"start": 8200, "end": 9000, "word": "ਰਘੁਬਰ"},
        {"start": 9000, "end": 9800, "word": "ਬਿਮਲ"},
        {"start": 9800, "end": 10600, "word": "ਜਸੁ"},
        {"start": 10600, "end": 11400, "word": "ਜੋ"},
        {"start": 11400, "end": 12200, "word": "ਦਾਯਕੁ"},
        {"start": 12200, "end": 13000, "word": "ਫਲ"},
        {"start": 13000, "end": 14000, "word": "ਚਾਰਿ"},
        {"start": 14000, "end": 15000, "word": "॥"}
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
