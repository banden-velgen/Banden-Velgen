-- Insert sample tire data
INSERT INTO public.products (id, type, brand, model, specifications, price, stock) VALUES
('MICH-PS4-22555R17', 'tire', 'Michelin', 'Pilot Sport 4', '225/55R17', 189.99, 24),
('CONT-SC6-19545R16', 'tire', 'Continental', 'SportContact 6', '195/45R16', 159.99, 8),
('BRID-LM005-21550R17', 'tire', 'Bridgestone', 'Blizzak LM005', '215/50R17', 179.99, 32);

-- Insert sample rim data
INSERT INTO public.products (id, type, brand, model, specifications, price, stock) VALUES
('OZ-RACING-17X7', 'rim', 'OZ Racing', 'Ultraleggera', '17x7 ET42 5x108', 299.99, 12),
('BBS-CH-R-18X8', 'rim', 'BBS', 'CH-R', '18x8 ET35 5x120', 459.99, 6),
('ENKEI-RPF1-17X8', 'rim', 'Enkei', 'RPF1', '17x8 ET45 5x114.3', 189.99, 18);
