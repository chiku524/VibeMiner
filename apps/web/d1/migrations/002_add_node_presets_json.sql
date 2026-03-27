-- Multiple node run modes per listing (validator, full node, etc.)
alter table network_listings add column node_presets_json text;
