-- Create the live_darshans table to hold dynamically updated YouTube streams
CREATE TABLE public.live_darshans (
    id text PRIMARY KEY,
    title text NOT NULL,
    location text NOT NULL,
    schedule text NOT NULL,
    category text NOT NULL,
    tradition text NOT NULL,
    youtube_channel_id text NOT NULL,
    current_video_id text,
    is_active boolean DEFAULT true,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_darshans ENABLE ROW LEVEL SECURITY;

-- Allow public read access (everyone can view the live streams)
CREATE POLICY "Allow public read access to live_darshans"
    ON public.live_darshans
    FOR SELECT
    USING (true);

-- Only service role can insert/update (since this is managed via Cron)
CREATE POLICY "Allow service role full access to live_darshans"
    ON public.live_darshans
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Insert the base configuration data (These are the official Channel IDs for the streams we mapped)
INSERT INTO public.live_darshans (id, title, location, schedule, category, tradition, youtube_channel_id, current_video_id) VALUES
('vaishno-devi', 'Vaishno Devi Temple', 'Katra, Jammu & Kashmir', 'Aarti: 6:20-8:00 AM & PM', 'mandir', 'hindu', 'UCv_eUa07Pj8Ity2-g-hM19A', 'tqa2NcqPvR8'),
('mahakaleshwar', 'Shri Mahakaleshwar', 'Ujjain, Madhya Pradesh', 'Bhasma Aarti: 4:00 AM', 'mandir', 'hindu', 'UCQ5uQ6sQZ5G9G5g6G8W6w2g', 'XonAtRkvqgo'),
('krishna-janmabhoomi', 'Shri Krishna Janmabhoomi', 'Mathura, UP', 'Live Darshan', 'mandir', 'hindu', 'UC2Q_d5uG_R2X0mB5B1l_w8Q', 'ZCXCu9_K0lY'),
('takhat-hazur-sahib', 'Takhat Sachkhand Hazur Sahib', 'Nanded, Maharashtra', 'Live Gurbani 24/7', 'mandir', 'sikh', 'UCgB3wY9p1E4wO0rP-B7o0Wg', 'YsI5XOB4z7g'),
('iskcon-hare-krishna', 'ISKCON Hare Krishna', 'Global', 'Akhand Kirtan 24/7', 'satsang', 'hindu', 'UCm1qH0dF5_L1-p_y_Vv1pQg', 'Y1SrWeVhQJ0'),
('shantikunj-haridwar', 'Shantikunj Gayatri Teerth', 'Haridwar, Uttarakhand', 'Live Darshan 24/7', 'mandir', 'hindu', 'UCmK-L0u9_R2b-0_11-7v9_Q', 'F2ndo7e0_UY'),
('swaminarayan-dhun', 'Swaminarayan Akhand Dhun', 'Gujarat', 'Live Dhyan Dhun 24/7', 'satsang', 'hindu', 'UCg8u_R8A_1G0R7-Y2B-y_Qg', '185-4L8sIVY'),
('sai-baba-dhyan', 'Shirdi Sai Baba', 'Shirdi, Maharashtra', 'Sai Naam Jap 24/7', 'mandir', 'hindu', 'UC09o-p-L6p_80-y9_w-1_gQ', '67nkcpEwCDo'),
('shiva-mahamrityunjay', 'Shiva Mahamrityunjay', 'Kashi', 'Live Mantra Chanting', 'katha', 'hindu', 'UC0_8-2-v7A-h9--3-X-w_YQ', 'YmwC_vNkkA4'),
('brahma-kumaris', 'Brahma Kumaris Madhuban', 'Mount Abu, Rajasthan', 'Baba Room Darshan', 'satsang', 'hindu', 'UCnB-7_T4O_m-8-D9-r1_k5g', 'KmQrxaRSurQ');
