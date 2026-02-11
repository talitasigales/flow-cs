-- Update the orphan profile to point to the new auth user
UPDATE profiles SET user_id = '06a05a59-d8c9-4a7c-97da-836e278ffb81', password_changed = false 
WHERE user_id = '8505e40f-c122-4ff7-8a1b-138484a99829';

-- Delete the auto-created duplicate profile from the trigger
DELETE FROM profiles WHERE user_id = '06a05a59-d8c9-4a7c-97da-836e278ffb81' 
AND id != '3db2151c-83a7-4d81-95e1-646e33a9fddb';

-- Update user_roles if any
UPDATE user_roles SET user_id = '06a05a59-d8c9-4a7c-97da-836e278ffb81' 
WHERE user_id = '8505e40f-c122-4ff7-8a1b-138484a99829';