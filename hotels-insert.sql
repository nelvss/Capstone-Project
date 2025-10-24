-- SQL INSERT statements for hotels table
-- Execute these in your Supabase SQL Editor

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'Ilaya Resort',
  'Beachfront resort with modern amenities and stunning ocean views. Perfect for families and couples seeking relaxation.',
  2500,
  '["Images/ilaya.jpg", "Images/ilaya2.jpg", "Images/ilaya3.jpg", "Images/ilaya4.jpg"]'::jsonb
);

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'Bliss Beach Resort',
  'Luxury beachfront resort offering premium accommodations with world-class service and breathtaking sunset views.',
  3200,
  '["Images/bliss.jpg", "Images/bliss2.jpg", "Images/bliss3.jpg", "Images/bliss4.jpg", "Images/bliss5.jpg"]'::jsonb
);

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'The Mangyan Grand Hotel',
  'Elegant hotel featuring spacious rooms, modern facilities, and exceptional hospitality in the heart of Puerto Galera.',
  4500,
  '["Images/the_mangyan_grand_hotel.png"]'::jsonb
);

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'Mindoro Transient House',
  'Comfortable and affordable accommodation perfect for budget-conscious travelers. Also known as Casa De Honcho.',
  1800,
  '["Images/mangyan.jpg", "Images/mangyan2.jpg", "Images/mangyan3.jpg", "Images/mangyan4.jpg", "Images/mangyan5.jpg", "Images/mangyan6.jpg", "Images/mangyan7.jpg", "Images/mangyan8.jpg"]'::jsonb
);

INSERT INTO hotels (name, description, base_price_per_night, image_urls)
VALUES (
  'Southview Lodge',
  'Cozy lodge with panoramic views of the surrounding landscape. Ideal for nature lovers and adventure seekers.',
  2200,
  '["Images/southview.jpg", "Images/southview2.jpg", "Images/southview3.jpg", "Images/southview4.jpg", "Images/southview5.jpg", "Images/southview6.jpg"]'::jsonb
);
