-- V48__seed_full_flashcards_for_typing_game.sql
-- Bổ sung đầy đủ 50-60 từ vựng phong phú cho các bộ thẻ cơ bản (Fruits, Animals, Colors) 
-- Phục vụ tính năng Luyện Gõ (Typing Game) với 5 - 10 mốc chơi (10 từ/mốc) và tăng dần độ dài
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET @admin_id = COALESCE((SELECT id FROM users WHERE username = 'admin' LIMIT 1), 1);

-- =========================================================================
-- 1. BỘ THẺ: Trái cây cơ bản (Fruits) - deck_code = 'FRUITS-001' (hoặc id = 1)
-- =========================================================================
SET @deck_fruits_id = COALESCE((SELECT id FROM decks WHERE deck_code = 'FRUITS-001' OR slug = 'tu-vung-trai-cay' LIMIT 1), 1);

INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, part_of_speech, definition, example_text, example_translation, card_order, is_active, created_by, version)
SELECT @deck_fruits_id, val.front_text, val.back_text, val.phonetic, val.part_of_speech, val.definition, val.example_text, val.example_translation, val.card_order, true, @admin_id, 0
FROM (
    -- Từ ngắn 3-4 ký tự (Mốc 1)
    SELECT 'Fig' AS front_text, 'Quả sung / vả' AS back_text, '/fɪɡ/' AS phonetic, 'noun' AS part_of_speech, 'A sweet soft fruit with many seeds' AS definition, 'Fresh figs are delicious.' AS example_text, 'Sung tươi rất ngon.' AS example_translation, 6 AS card_order UNION ALL
    SELECT 'Nut', 'Hạt / Quả hạch', '/nʌt/', 'noun', 'A dry fruit consisting of a hard shell', 'He cracked the nut open.', 'Anh ấy đập vỡ vỏ quả hạch.', 7 UNION ALL
    SELECT 'Plum', 'Quả mận', '/plʌm/', 'noun', 'A round fruit with sweet flesh and a stone', 'Ripe plums are purple and sweet.', 'Những quả mận chín có màu tím và ngọt.', 8 UNION ALL
    SELECT 'Pear', 'Quả lê', '/peər/', 'noun', 'A sweet juicy fruit that is narrow at the stalk', 'She sliced a sweet pear for lunch.', 'Cô ấy cắt quả lê ngọt cho bữa trưa.', 9 UNION ALL
    SELECT 'Lime', 'Quả chanh xanh', '/laɪm/', 'noun', 'A round green citrus fruit', 'Squeeze some lime juice on the fish.', 'Vắt thêm ít nước chanh xanh lên cá.', 10 UNION ALL
    SELECT 'Date', 'Quả chà là', '/deɪt/', 'noun', 'The sweet fruit of various date palms', 'Dates are very popular in the Middle East.', 'Chà là rất phổ biến ở Trung Đông.', 11 UNION ALL
    SELECT 'Kiwi', 'Quả kiwi', '/ˈkiː.wiː/', 'noun', 'An oval fruit with brown skin and green flesh', 'Kiwi is packed with vitamin C.', 'Kiwi chứa rất nhiều vitamin C.', 12 UNION ALL
    
    -- Từ 5-6 ký tự (Mốc 2 - 3)
    SELECT 'Grape', 'Quả nho', '/ɡreɪp/', 'noun', 'Small green or purple fruit growing in bunches', 'They grow sweet grapes in the valley.', 'Họ trồng những trái nho ngọt ngào trong thung lũng.', 13 UNION ALL
    SELECT 'Guava', 'Quả ổi', '/ˈɡwɑː.və/', 'noun', 'A tropical fruit with pink or white flesh', 'Guava juice is very fragrant.', 'Nước ép ổi rất thơm.', 14 UNION ALL
    SELECT 'Lemon', 'Quả chanh vàng', '/ˈlem.ən/', 'noun', 'A yellow oval citrus fruit with sour juice', 'Add a slice of lemon to your tea.', 'Thêm một lát chanh vàng vào trà của bạn.', 15 UNION ALL
    SELECT 'Mango', 'Quả xoài', '/ˈmæŋ.ɡəʊ/', 'noun', 'A fleshy tropical fruit with yellowish-red skin', 'Sweet mangoes are harvested in summer.', 'Xoài ngọt được thu hoạch vào mùa hè.', 16 UNION ALL
    SELECT 'Melon', 'Quả dưa gang / dưa lưới', '/ˈmel.ən/', 'noun', 'A large sweet fruit with a thick skin', 'This honeydew melon is sweet.', 'Trái dưa lưới này rất ngọt.', 17 UNION ALL
    SELECT 'Peach', 'Quả đào', '/piːtʃ/', 'noun', 'A round fruit with soft skin and yellow-pink flesh', 'The peach has a lovely fragrance.', 'Quả đào có hương thơm thật dễ chịu.', 18 UNION ALL
    SELECT 'Berry', 'Quả mọng', '/ˈber.i/', 'noun', 'Any small juicy fruit without a stone', 'Birds love eating wild berries.', 'Chim rất thích ăn các loại quả mọng hoang dã.', 19 UNION ALL
    SELECT 'Cherry', 'Quả anh đào', '/ˈtʃer.i/', 'noun', 'A small round soft red or black fruit', 'A bowl of cherries sat on the counter.', 'Một bát anh đào đặt trên bàn bếp.', 20 UNION ALL
    SELECT 'Papaya', 'Quả đu đủ', '/pəˈpaɪ.ə/', 'noun', 'A large tropical fruit with orange flesh', 'Papaya is great for digestion.', 'Đu đủ rất tốt cho hệ tiêu hóa.', 21 UNION ALL
    SELECT 'Banana', 'Quả chuối', '/bəˈnæn.ə/', 'noun', 'A long curved fruit with a yellow skin', 'Monkeys love eating ripe bananas.', 'Khỉ rất thích ăn chuối chín.', 22 UNION ALL
    SELECT 'Orange', 'Quả cam', '/ˈɒr.ɪndʒ/', 'noun', 'A round citrus fruit with a thick skin', 'Drinking fresh orange juice gives energy.', 'Uống nước cam tươi mang lại nhiều năng lượng.', 23 UNION ALL
    
    -- Từ 7-8 ký tự (Mốc 4 - 5)
    SELECT 'Coconut', 'Quả dừa', '/ˈkəʊ.kə.nʌt/', 'noun', 'A large fruit like a nut with a hard shell', 'Fresh coconut water is very cooling.', 'Nước dừa tươi rất thanh mát.', 24 UNION ALL
    SELECT 'Avocado', 'Quả bơ', '/ˌæv.əˈkɑː.dəʊ/', 'noun', 'A pear-shaped fruit with green skin and oily flesh', 'Avocado toast is a popular breakfast.', 'Bánh mì nướng quả bơ là món ăn sáng phổ biến.', 25 UNION ALL
    SELECT 'Apricot', 'Quả mơ', '/ˈeɪ.prɪ.kɒt/', 'noun', 'A round soft fruit of a yellow-orange color', 'Dried apricots make a healthy snack.', 'Mơ sấy khô là món ăn vặt lành mạnh.', 26 UNION ALL
    SELECT 'Kumquat', 'Quả quất / tắc', '/ˈkʌm.kwɒt/', 'noun', 'A small citrus fruit that looks like a tiny orange', 'Kumquat trees are popular during Tet.', 'Cây quất rất được ưa chuộng vào dịp Tết.', 27 UNION ALL
    SELECT 'Durian', 'Quả sầu riêng', '/ˈdʒʊə.ri.ən/', 'noun', 'A spiky tropical fruit with a strong odor', 'Durian is known as the king of fruits.', 'Sầu riêng được mệnh danh là vua của các loài trái cây.', 28 UNION ALL
    SELECT 'Lychee', 'Quả vải', '/ˈlaɪ.tʃiː/', 'noun', 'A small rounded fruit with sweet white flesh', 'Sweet lychees are in season now.', 'Những trái vải ngọt đang vào mùa.', 29 UNION ALL
    SELECT 'Longan', 'Quả nhãn', '/ˈlɒŋ.ɡən/', 'noun', 'A fruit with a thin brown shell and translucent flesh', 'Longan fruit is sweet and juicy.', 'Quả nhãn rất ngọt và mọng nước.', 30 UNION ALL
    SELECT 'Custard', 'Mãng cầu / Na', '/ˈkʌs.təd/', 'noun', 'A sweet tropical fruit with knobby skin', 'Custard apple is very fragrant.', 'Quả na rất thơm ngon.', 31 UNION ALL
    SELECT 'Soursop', 'Mãng cầu xiêm', '/ˈsaʊə.sɒp/', 'noun', 'A large spiny green tropical fruit', 'Soursop smoothie is refreshing.', 'Sinh tố mãng cầu xiêm rất thanh nhiệt.', 32 UNION ALL
    SELECT 'Mandarin', 'Quả quýt', '/ˈmæn.dər.ɪn/', 'noun', 'A small sweet citrus fruit like an orange', 'Sweet mandarins are easy to peel.', 'Quýt ngọt rất dễ bóc vỏ.', 33 UNION ALL
    SELECT 'Mulberry', 'Quả dâu tằm', '/ˈmʌl.bər.i/', 'noun', 'A small dark purple or white fruit', 'The tree was full of ripe mulberries.', 'Cây trĩu đầy những quả dâu tằm chín mọng.', 34 UNION ALL
    SELECT 'Rambutan', 'Quả chôm chôm', '/ræmˈbuː.tən/', 'noun', 'A red tropical fruit with soft spines', 'Rambutans are sweet and juicy.', 'Chôm chôm vừa ngọt vừa mọng nước.', 35 UNION ALL

    -- Từ dài 9-12 ký tự (Mốc 6)
    SELECT 'Pineapple', 'Quả dứa / thơm', '/ˈpaɪnˌæp.əl/', 'noun', 'A large tropical fruit with prickly skin', 'Fresh pineapple is sweet and tangy.', 'Dứa tươi có vị chua ngọt thơm lừng.', 36 UNION ALL
    SELECT 'Tangerine', 'Quả quýt ngọt', '/ˌtæn.dʒəˈriːn/', 'noun', 'A small citrus fruit with loose peel', 'She peeled a juicy tangerine.', 'Cô ấy bóc một quả quýt mọng nước.', 37 UNION ALL
    SELECT 'Grapefruit', 'Quả bưởi chùm', '/ˈɡreɪp.fruːt/', 'noun', 'A large round yellow citrus fruit with sour pulp', 'Grapefruit is great for breakfast.', 'Bưởi chùm rất tuyệt cho bữa sáng.', 38 UNION ALL
    SELECT 'Watermelon', 'Quả dưa hấu', '/ˈwɔː.təˌmel.ən/', 'noun', 'A large melon with sweet watery pink flesh', 'Watermelon cools down hot summer days.', 'Dưa hấu làm dịu đi những ngày hè oi ả.', 39 UNION ALL
    SELECT 'Strawberry', 'Quả dâu tây', '/ˈstrɔː.bər.i/', 'noun', 'A sweet red fruit with small seeds on surface', 'Strawberries with cream are a classic dessert.', 'Dâu tây ăn cùng kem tươi là món tráng miệng kinh điển.', 40 UNION ALL
    SELECT 'Cantaloupe', 'Dưa lưới ruột cam', '/ˈkæn.tə.luːp/', 'noun', 'A melon with sweet orange flesh', 'Sweet cantaloupe is perfect for fruit salads.', 'Dưa lưới ruột cam hoàn hảo cho món salad hoa quả.', 41 UNION ALL
    SELECT 'Blackberry', 'Quả mâm xôi đen', '/ˈblæk.bər.i/', 'noun', 'A soft black edible fruit with clusters of seeds', 'Wild blackberries grow along the hedge.', 'Mâm xôi đen mọc dọc bờ rào.', 42 UNION ALL
    SELECT 'Blueberry', 'Quả việt quất', '/ˈbluːˌber.i/', 'noun', 'A small sweet dark-blue berry', 'Blueberries are rich in antioxidants.', 'Việt quất rất giàu chất chống oxy hóa.', 43 UNION ALL
    SELECT 'Cranberry', 'Quả nam việt quất', '/ˈkræn.bər.i/', 'noun', 'A small sour red berry used in sauces', 'Cranberry juice is tart and refreshing.', 'Nước nam việt quất có vị chua thanh sảng khoái.', 44 UNION ALL
    SELECT 'Gooseberry', 'Quả lý gai', '/ˈɡʊz.bər.i/', 'noun', 'A small green tart fruit', 'Gooseberry jam is delicious.', 'Mứt lý gai rất thơm ngon.', 45 UNION ALL
    SELECT 'Raspberry', 'Quả mâm xôi đỏ', '/ˈrɑːz.bər.i/', 'noun', 'An edible soft red fruit', 'Raspberry tart is her favorite treat.', 'Bánh tart mâm xôi đỏ là món yêu thích của cô ấy.', 46 UNION ALL
    SELECT 'Mangosteen', 'Quả măng cụt', '/ˈmæŋ.ɡə.stiːn/', 'noun', 'A tropical fruit with thick reddish-purple rind', 'Mangosteen is often called the queen of fruits.', 'Măng cụt thường được gọi là nữ hoàng của các loài hoa quả.', 47 UNION ALL
    SELECT 'Pomegranate', 'Quả lựu', '/ˈpɒm.ɪˌɡræn.ɪt/', 'noun', 'A round fruit with a thick red skin and ruby seeds', 'Pomegranate seeds sparkle like gems.', 'Hạt lựu lấp lánh như những viên ngọc quý.', 48 UNION ALL
    SELECT 'Dragonfruit', 'Quả thanh long', '/ˈdræɡ.ən.fruːt/', 'noun', 'A bright pink fruit with white or red seed-speckled flesh', 'Dragonfruit has a refreshing mild taste.', 'Thanh long có vị thanh mát nhẹ nhàng.', 49 UNION ALL
    SELECT 'Passionfruit', 'Quả chanh leo', '/ˈpæʃ.ən.fruːt/', 'noun', 'An edible tropical fruit with aromatic pulp', 'Passionfruit adds rich flavor to desserts.', 'Chanh leo mang lại hương vị thơm ngát cho các món tráng miệng.', 50 UNION ALL
    SELECT 'Jackfruit', 'Quả mít', '/ˈdʒæk.fruːt/', 'noun', 'A very large tropical fruit with sweet yellow segments', 'Ripe jackfruit fills the house with sweetness.', 'Mít chín lan tỏa hương thơm ngào ngạt khắp gian nhà.', 51 UNION ALL
    SELECT 'Starfruit', 'Quả khế', '/ˈstɑː.fruːt/', 'noun', 'A five-pointed star-shaped tropical fruit', 'Starfruit slices look like pretty stars.', 'Những lát khế cắt ngang trông như những vì sao xinh xắn.', 52 UNION ALL
    SELECT 'Persimmon', 'Quả hồng', '/pəˈsɪm.ən/', 'noun', 'An edible orange or red fruit resembling a tomato', 'Crispy persimmons are popular in autumn.', 'Hồng giòn rất được ưa chuộng vào mùa thu.', 53
) val
WHERE NOT EXISTS (
    SELECT 1 FROM flashcards f WHERE f.deck_id = @deck_fruits_id AND f.front_text = val.front_text
);

-- Cập nhật total_cards cho Fruits
UPDATE decks SET total_cards = (SELECT COUNT(*) FROM flashcards WHERE deck_id = @deck_fruits_id AND is_active = true) WHERE id = @deck_fruits_id;


-- =========================================================================
-- 2. BỘ THẺ: Động vật thông dụng (Animals) - deck_code = 'DECK-EN-ANIMALS'
-- =========================================================================
SET @deck_animals_id = (SELECT id FROM decks WHERE deck_code = 'DECK-EN-ANIMALS' OR slug = 'tu-vung-dong-vat' LIMIT 1);

INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, part_of_speech, definition, example_text, example_translation, card_order, is_active, created_by, version)
SELECT @deck_animals_id, val.front_text, val.back_text, val.phonetic, val.part_of_speech, val.definition, val.example_text, val.example_translation, val.card_order, true, @admin_id, 0
FROM (
    -- Từ ngắn 3-4 ký tự (Mốc 1)
    SELECT 'Cat' AS front_text, 'Con mèo' AS back_text, '/kæt/' AS phonetic, 'noun' AS part_of_speech, 'A small domesticated carnivorous mammal' AS definition, 'The playful cat caught a mouse.' AS example_text, 'Chú mèo tinh nghịch đã bắt được một con chuột.' AS example_translation, 6 AS card_order UNION ALL
    SELECT 'Dog', 'Con chó', '/dɒɡ/', 'noun', 'A domesticated carnivorous mammal', 'A loyal dog guards the house.', 'Chú chó trung thành canh giữ ngôi nhà.', 7 UNION ALL
    SELECT 'Pig', 'Con lợn / heo', '/pɪɡ/', 'noun', 'A domesticated hoofed animal with a flat snout', 'Pigs are very intelligent animals.', 'Loài heo là những loài động vật rất thông minh.', 8 UNION ALL
    SELECT 'Cow', 'Con bò', '/kaʊ/', 'noun', 'A fully grown female animal of a domesticated breed of ox', 'Cows graze peacefully in the meadow.', 'Đàn bò thong dong gặm cỏ trên đồng cỏ xanh.', 9 UNION ALL
    SELECT 'Fox', 'Con cáo', '/fɒks/', 'noun', 'A carnivorous mammal with a pointed snout and bushy tail', 'The clever fox sneaked through the woods.', 'Chú cáo ranh mãnh len lỏi qua cánh rừng.', 10 UNION ALL
    SELECT 'Bat', 'Con dơi', '/bæt/', 'noun', 'A mammal capable of true flight', 'Bats hunt for insects at night.', 'Dơi săn côn trùng vào ban đêm.', 11 UNION ALL
    SELECT 'Bee', 'Con ong', '/biː/', 'noun', 'A flying insect closely related to wasps and ants', 'Busy bees gather nectar from flowers.', 'Những chú ong chăm chỉ thu thập mật hoa.', 12 UNION ALL
    SELECT 'Ant', 'Con kiến', '/ænt/', 'noun', 'A small social insect living in colonies', 'Ants can carry items heavier than themselves.', 'Kiến có thể mang vật nặng hơn cơ thể chúng rất nhiều.', 13 UNION ALL
    SELECT 'Owl', 'Con cú mèo', '/aʊl/', 'noun', 'A nocturnal bird of prey with large eyes', 'The wise owl hooted in the night.', 'Chú cú thông thái cất tiếng kêu trong đêm tối.', 14 UNION ALL
    SELECT 'Rat', 'Con chuột cống', '/ræt/', 'noun', 'A rodent that resembles a large mouse', 'The rat scampered across the floor.', 'Con chuột chạy biến qua sàn nhà.', 15 UNION ALL
    SELECT 'Duck', 'Con vịt', '/dʌk/', 'noun', 'A waterbird with a broad blunt bill and webbed feet', 'Ducks swim across the quiet pond.', 'Đàn vịt bơi lội trên mặt hồ tĩnh lặng.', 16 UNION ALL
    SELECT 'Bear', 'Con gấu', '/beər/', 'noun', 'A large heavy mammal that walks on the soles of its feet', 'The brown bear caught a fish in the river.', 'Con gấu nâu bắt được một con cá dưới sông.', 17 UNION ALL
    SELECT 'Lion', 'Con sư tử', '/ˈlaɪ.ən/', 'noun', 'A large tawny-colored cat with a mane', 'The lion roared across the savanna.', 'Con sư tử gầm vang khắp thảo nguyên hoang dã.', 18 UNION ALL
    SELECT 'Wolf', 'Con chó sói', '/wʊlf/', 'noun', 'A wild carnivorous mammal of the dog family', 'A wolf howled under the full moon.', 'Chó sói cất tiếng hú dưới vầng trăng tròn.', 19 UNION ALL
    SELECT 'Frog', 'Con ếch', '/frɒɡ/', 'noun', 'A tailless amphibian with long legs', 'The green frog leaped into the water.', 'Chú ếch xanh nhảy tõm xuống làn nước.', 20 UNION ALL
    SELECT 'Deer', 'Con hươu / nai', '/dɪər/', 'noun', 'A hoofed grazing mammal with antlers', 'A gentle deer drank from the stream.', 'Chú nai hiền lành uống nước bên bờ suối.', 21 UNION ALL
    SELECT 'Goat', 'Con dê', '/ɡəʊt/', 'noun', 'A hardy domesticated ruminant animal with horns', 'Mountain goats climb steep cliffs easily.', 'Dê núi leo trèo qua vách đá dốc đứng một cách dễ dàng.', 22 UNION ALL
    SELECT 'Crab', 'Con cua', '/kræb/', 'noun', 'A crustacean with a broad carapace and pincer claws', 'The crab walked sideways on the beach.', 'Con cua bò ngang trên bãi cát ven biển.', 23 UNION ALL

    -- Từ 5-6 ký tự (Mốc 2 - 3)
    SELECT 'Tiger', 'Con hổ', '/ˈtaɪ.ɡər/', 'noun', 'A very large solitary cat with a striped coat', 'The majestic tiger stalked its prey.', 'Con hổ oai vệ rình rập con mồi.', 24 UNION ALL
    SELECT 'Horse', 'Con ngựa', '/hɔːs/', 'noun', 'A large domesticated solid-hoofed mammal', 'The wild horse ran free on the plain.', 'Chú ngựa hoang tung vó tự do trên thảo nguyên.', 25 UNION ALL
    SELECT 'Zebra', 'Con ngựa vằn', '/ˈzeb.rə/', 'noun', 'An African wild horse with black-and-white stripes', 'Zebras travel in large herds for safety.', 'Ngựa vằn di chuyển theo bầy lớn để đảm bảo an toàn.', 26 UNION ALL
    SELECT 'Panda', 'Gấu trúc', '/ˈpæn.də/', 'noun', 'A large bearlike mammal with black and white markings', 'The giant panda munched on fresh bamboo.', 'Gấu trúc khổng lồ nhai ngon lành những cành tre non.', 27 UNION ALL
    SELECT 'Koala', 'Gấu túi Koala', '/kəʊˈɑː.lə/', 'noun', 'A bearlike Australian marsupial', 'The sleepy koala clung to the eucalyptus tree.', 'Chú gấu koala buồn ngủ bám chặt vào thân cây khuynh diệp.', 28 UNION ALL
    SELECT 'Camel', 'Con lạc đà', '/ˈkæm.əl/', 'noun', 'A large long-necked mammal with one or two humps', 'Camels can survive without water for weeks.', 'Lạc đà có thể sống sót nhiều tuần mà không cần nước.', 29 UNION ALL
    SELECT 'Sheep', 'Con cừu', '/ʃiːp/', 'noun', 'A domesticated ruminant animal with a thick woolly coat', 'The shepherd led his sheep up the hill.', 'Người chăn cừu dắt đàn cừu lên sườn đồi.', 30 UNION ALL
    SELECT 'Shark', 'Cá mập', '/ʃɑːk/', 'noun', 'A large predatory sea fish with sharp teeth', 'The great white shark glided through deep water.', 'Cá mập trắng khổng lồ lướt đi trong lòng đại dương sâu thẳm.', 31 UNION ALL
    SELECT 'Whale', 'Cá voi', '/weɪl/', 'noun', 'A very large marine mammal', 'The blue whale is the largest animal on Earth.', 'Cá voi xanh là loài động vật lớn nhất trên Trái Đất.', 32 UNION ALL
    SELECT 'Eagle', 'Chim đại bàng', '/ˈiː.ɡəl/', 'noun', 'A large bird of prey with a massive hooked bill', 'The eagle soared high above the mountains.', 'Đại bàng chao lượn trên đỉnh núi cao vời vợi.', 33 UNION ALL
    SELECT 'Otter', 'Rái cá', '/ˈɒt.ər/', 'noun', 'A semi-aquatic fish-eating mammal with dense fur', 'The playful otter slid down the riverbank.', 'Chú rái cá tinh nghịch trượt dài trên bờ sông.', 34 UNION ALL
    SELECT 'Rabbit', 'Con thỏ', '/ˈræb.ɪt/', 'noun', 'A burrowing gregarious plant-eating mammal with long ears', 'A small white rabbit hopped in the garden.', 'Một chú thỏ trắng nhỏ nhảy nhót trong khu vườn.', 35 UNION ALL
    SELECT 'Monkey', 'Con khỉ', '/ˈmʌŋ.ki/', 'noun', 'A small to medium-sized primate with a tail', 'The curious monkey swung from branch to branch.', 'Chú khỉ tò mò đu mình từ cành này sang cành khác.', 36 UNION ALL
    SELECT 'Parrot', 'Con vẹt', '/ˈpær.ət/', 'noun', 'A bird with a curved beak and vivid feathers', 'The colorful parrot repeated every word.', 'Chú vẹt sặc sỡ nhại lại từng câu từng chữ.', 37 UNION ALL
    SELECT 'Turtle', 'Con rùa', '/ˈtɜː.təl/', 'noun', 'A slow-moving reptile with a bony shell', 'The sea turtle swam toward the coral reef.', 'Rùa biển bơi thong thả hướng về phía rạn san hô.', 38 UNION ALL
    SELECT 'Lizard', 'Con thằn lằn', '/ˈlɪz.əd/', 'noun', 'A reptile with a long body and tail', 'A little lizard basked in the warm sun.', 'Chú thằn lằn nhỏ sưởi ấm dưới ánh nắng chan hòa.', 39 UNION ALL

    -- Từ 7-9 ký tự (Mốc 4 - 5)
    SELECT 'Dolphin', 'Cá heo', '/ˈdɒl.fɪn/', 'noun', 'A highly intelligent aquatic mammal', 'Friendly dolphins jumped beside the boat.', 'Đàn cá heo thân thiện nhảy múa bên mạn thuyền.', 40 UNION ALL
    SELECT 'Penguin', 'Chim cánh cụt', '/ˈpeŋ.ɡwɪn/', 'noun', 'A flightless black-and-white seabird of southern hemisphere', 'Penguins waddled across the snowy ice.', 'Những chú chim cánh cụt lạch bạch bước đi trên băng tuyết.', 41 UNION ALL
    SELECT 'Giraffe', 'Hươu cao cổ', '/dʒɪˈrɑːf/', 'noun', 'A very tall African mammal with an extremely long neck', 'The tall giraffe reached for tender leaves.', 'Chú hươu cao cổ vươn mình hái những chiếc lá non trên ngọn.', 42 UNION ALL
    SELECT 'Gorilla', 'Khỉ đột', '/ɡəˈrɪl.ə/', 'noun', 'The largest living primate of African forests', 'The powerful gorilla protected its family.', 'Chú khỉ đột dũng mãnh bảo vệ gia đình của mình.', 43 UNION ALL
    SELECT 'Cheetah', 'Báo săn', '/ˈtʃiː.tə/', 'noun', 'A large spotted cat known as the fastest land animal', 'The cheetah sprinted across the dry grass.', 'Báo săn bứt tốc như bay trên đồng cỏ khô cằn.', 44 UNION ALL
    SELECT 'Leopard', 'Báo hoa mai', '/ˈlep.əd/', 'noun', 'A large solitary cat with rosetted spots', 'A silent leopard rested in the tall tree.', 'Chú báo hoa mai nghỉ ngơi lặng lẽ trên cành cây cao.', 45 UNION ALL
    SELECT 'Octopus', 'Bạch tuộc', '/ˈɒk.tə.pəs/', 'noun', 'An eight-armed mollusk living on the ocean floor', 'The clever octopus changed color to hide.', 'Con bạch tuộc thông minh đổi màu để ngụy trang ẩn nấp.', 46 UNION ALL
    SELECT 'Peacock', 'Con công', '/ˈpiː.kɒk/', 'noun', 'A male peafowl with brilliant iridescent tail feathers', 'The peacock displayed its stunning feathers.', 'Chú công khoe bộ lông rực rỡ lộng lẫy tuyệt đẹp.', 47 UNION ALL
    SELECT 'Hamster', 'Chuột hamster', '/ˈhæm.stər/', 'noun', 'A burrowing rodent with large cheek pouches', 'The tiny hamster stuffed food into its cheeks.', 'Chú chuột hamster nhét đầy thức ăn vào hai bên má.', 48 UNION ALL
    SELECT 'Elephant', 'Con voi', '/ˈel.ɪ.fənt/', 'noun', 'A very large mammal with a trunk and ivory tusks', 'An elephant never forgets its friends.', 'Loài voi không bao giờ quên những người bạn của mình.', 49 UNION ALL
    SELECT 'Kangaroo', 'Chuột túi', '/ˌkæŋ.ɡərˈuː/', 'noun', 'A large Australian herbivore that hops on strong legs', 'A mother kangaroo carried her joey in the pouch.', 'Chuột túi mẹ âu yếm chở con trong chiếc túi ấm áp.', 50 UNION ALL
    SELECT 'Squirrel', 'Con sóc', '/ˈskwɪr.əl/', 'noun', 'A tree-dwelling rodent with a bushy tail', 'The busy squirrel buried nuts for winter.', 'Chú sóc bận rộn giấu những hạt dẻ để dành cho mùa đông.', 51 UNION ALL
    SELECT 'Flamingo', 'Chim hồng hạc', '/fləˈmɪŋ.ɡəʊ/', 'noun', 'A tall wading bird with pink feathers and long legs', 'Flamingos stood gracefully in the shallow lake.', 'Đàn hồng hạc đứng kiêu sa giữa lòng hồ nước cạn.', 52 UNION ALL
    SELECT 'Hedgehog', 'Con nhím gai', '/ˈhedʒ.hɒɡ/', 'noun', 'A small mammal with spiny coat', 'The cautious hedgehog rolled into a tight ball.', 'Chú nhím thận trọng cuộn tròn lại thành một quả cầu gai.', 53 UNION ALL

    -- Từ dài 10-12 ký tự (Mốc 6)
    SELECT 'Chimpanzee', 'Vượn tinh tinh', '/ˌtʃɪm.pænˈziː/', 'noun', 'An intelligent African ape closely related to humans', 'Chimpanzees use simple tools to find food.', 'Tinh tinh biết dùng các công cụ đơn giản để tìm kiếm thức ăn.', 54 UNION ALL
    SELECT 'Rhinoceros', 'Tê giác', '/raɪˈnɒs.ər.əs/', 'noun', 'A massive heavy herbivore with one or two horns', 'The rare rhinoceros roamed the protected reserve.', 'Chú tê giác quý hiếm dạo bước trong khu bảo tồn an toàn.', 55 UNION ALL
    SELECT 'Hippopotamus', 'Hà mã', '/ˌhɪp.əˈpɒt.ə.məs/', 'noun', 'A large amphibious mammal native to sub-Saharan Africa', 'The massive hippopotamus submerged in the river.', 'Chú hà mã khổng lồ ngâm mình dưới làn nước mát.', 56 UNION ALL
    SELECT 'Chameleon', 'Tắc kè hoa', '/kəˈmiː.li.ən/', 'noun', 'A slow-moving lizard famous for changing colors', 'The chameleon blended perfectly with the green branch.', 'Tắc kè hoa hòa mình hoàn hảo vào cành lá màu xanh.', 57 UNION ALL
    SELECT 'Salamander', 'Kỳ nhông / Sa giông', '/ˈsæl.ə.mæn.dər/', 'noun', 'A lizard-like amphibian with porous skin', 'The fire salamander lives in damp forests.', 'Sa giông lửa sinh sống trong những khu rừng rậm ẩm ướt.', 58 UNION ALL
    SELECT 'Woodpecker', 'Chim gõ kiến', '/ˈwʊdˌpek.ər/', 'noun', 'A bird that pecks tree trunks to find insects', 'A woodpecker tapped rhythmically on the bark.', 'Chim gõ kiến gõ nhịp nhàng vào thân cây gỗ.', 59 UNION ALL
    SELECT 'Grasshopper', 'Con châu chấu', '/ˈɡrɑːsˌhɒp.ər/', 'noun', 'A plant-eating insect with long hind legs for leaping', 'The grasshopper hopped high among the tall grass.', 'Chú châu chấu bật nhảy thoăn thoắt giữa đám cỏ cao.', 60
) val
WHERE @deck_animals_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM flashcards f WHERE f.deck_id = @deck_animals_id AND f.front_text = val.front_text
);

-- Cập nhật total_cards cho Animals
UPDATE decks SET total_cards = (SELECT COUNT(*) FROM flashcards WHERE deck_id = @deck_animals_id AND is_active = true) WHERE id = @deck_animals_id;


-- =========================================================================
-- 3. BỘ THẺ: Màu sắc (Colors) - deck_code = 'DECK-COLORS'
-- =========================================================================
SET @deck_colors_id = (SELECT id FROM decks WHERE deck_code = 'DECK-COLORS' OR slug = 'tu-vung-mau-sac' LIMIT 1);

INSERT INTO flashcards (deck_id, front_text, back_text, phonetic, part_of_speech, definition, example_text, example_translation, card_order, is_active, created_by, version)
SELECT @deck_colors_id, val.front_text, val.back_text, val.phonetic, val.part_of_speech, val.definition, val.example_text, val.example_translation, val.card_order, true, @admin_id, 0
FROM (
    SELECT 'Red' AS front_text, 'Màu đỏ' AS back_text, '/red/' AS phonetic, 'adjective' AS part_of_speech, 'Of color resembling blood' AS definition, 'She wore a bright red dress.' AS example_text, 'Cô ấy mặc một chiếc váy đỏ tươi thắm.' AS example_translation, 6 AS card_order UNION ALL
    SELECT 'Tan', 'Màu nâu rám nắng', '/tæn/', 'adjective', 'A light brown color', 'He wore tan leather shoes.', 'Anh ấy đi đôi giày da màu nâu rám nắng.', 7 UNION ALL
    SELECT 'Blue', 'Màu xanh da trời', '/bluː/', 'adjective', 'Of color like the clear sky', 'The summer sky was deep blue.', 'Bầu trời mùa hè mang một màu xanh thẳm.', 8 UNION ALL
    SELECT 'Pink', 'Màu hồng', '/pɪŋk/', 'adjective', 'Of a pale red color', 'Pink cherry blossoms bloomed in spring.', 'Hoa anh đào màu hồng nở rộ trong mùa xuân.', 9 UNION ALL
    SELECT 'Teal', 'Màu xanh mòng két', '/tiːl/', 'adjective', 'A dark greenish-blue color', 'The walls were painted soft teal.', 'Bức tường được sơn màu xanh mòng két dịu mắt.', 10 UNION ALL
    SELECT 'Cyan', 'Màu xanh lơ', '/ˈsaɪ.æn/', 'adjective', 'A greenish-blue color in printer models', 'Cyan ink was used in printing.', 'Mực xanh lơ được dùng trong in ấn.', 11 UNION ALL
    SELECT 'Gold', 'Màu vàng kim', '/ɡəʊld/', 'adjective', 'A bright yellow color like gold metal', 'The morning sun cast a gold glow.', 'Ánh bình minh tỏa một quầng sáng màu vàng kim.', 12 UNION ALL
    SELECT 'Rust', 'Màu gỉ sắt', '/rʌst/', 'adjective', 'A reddish-brown color', 'The old car turned rust brown.', 'Chiếc xe cũ đã chuyển sang màu gỉ sắt.', 13 UNION ALL
    SELECT 'Navy', 'Màu xanh hải quân', '/ˈneɪ.vi/', 'adjective', 'A dark shade of blue', 'Officers wore dark navy uniforms.', 'Các sĩ quan mặc đồng phục màu xanh hải quân trang trọng.', 14 UNION ALL
    SELECT 'Plum', 'Màu mận chín', '/plʌm/', 'adjective', 'A deep reddish-purple color', 'Her lips were painted dark plum.', 'Đôi môi cô ấy thoa màu mận chín quyến rũ.', 15 UNION ALL
    SELECT 'Ruby', 'Màu đỏ hồng ngọc', '/ˈruː.bi/', 'adjective', 'A precious deep red color', 'The ruby necklace sparkled in the candlelight.', 'Chuỗi vòng cổ đỏ hồng ngọc lấp lánh dưới ánh nến.', 16 UNION ALL
    SELECT 'Grey', 'Màu xám', '/ɡreɪ/', 'adjective', 'Of color intermediate between black and white', 'Rain fell from heavy grey clouds.', 'Cơn mưa rơi xuống từ những đám mây xám nặng trĩu.', 17 UNION ALL
    
    -- Từ 5-6 ký tự (Mốc 2 - 3)
    SELECT 'Green', 'Màu xanh lá cây', '/ɡriːn/', 'adjective', 'Of color between blue and yellow', 'The emerald grass was lush and green.', 'Đồng cỏ xanh tươi mơn mởn.', 18 UNION ALL
    SELECT 'Black', 'Màu đen', '/blæk/', 'adjective', 'Of the darkest color without light', 'A sleek black cat crossed the quiet path.', 'Chú mèo mun đen tuyền băng qua lối đi vắng.', 19 UNION ALL
    SELECT 'White', 'Màu trắng', '/waɪt/', 'adjective', 'Of the color of fresh milk or snow', 'Pure white snow blanketed the quiet town.', 'Tuyết trắng tinh khôi bao phủ thị trấn yên bình.', 20 UNION ALL
    SELECT 'Brown', 'Màu nâu', '/braʊn/', 'adjective', 'Of a color produced by mixing red, yellow, and blue', 'He bought a sturdy brown leather jacket.', 'Anh ấy mua một chiếc áo khoác da màu nâu bền bỉ.', 21 UNION ALL
    SELECT 'Amber', 'Màu hổ phách', '/ˈæm.bər/', 'adjective', 'A honey-yellow color', 'Streetlights glowed with warm amber light.', 'Đèn đường tỏa ra ánh sáng màu hổ phách ấm áp.', 22 UNION ALL
    SELECT 'Beige', 'Màu be', '/beɪʒ/', 'adjective', 'A pale sandy yellowish-brown color', 'The living room featured warm beige curtains.', 'Phòng khách nổi bật với tấm rèm màu be nhã nhặn.', 23 UNION ALL
    SELECT 'Coral', 'Màu san hô', '/ˈkɒr.əl/', 'adjective', 'A pinkish-orange color', 'The sunset turned the ocean sky coral.', 'Hoàng hôn nhuộm bầu trời biển một sắc san hô dịu dàng.', 24 UNION ALL
    SELECT 'Cream', 'Màu trắng kem', '/kriːm/', 'adjective', 'A thick yellowish-white color', 'The bride wore a classic cream silk gown.', 'Cô dâu diện chiếc váy lụa màu trắng kem cổ điển.', 25 UNION ALL
    SELECT 'Ivory', 'Màu trắng ngà', '/ˈaɪ.vər.i/', 'adjective', 'A creamy-white color of elephant tusk', 'The grand piano had ivory keys.', 'Cây đại dương cầm sở hữu những phím đàn màu trắng ngà.', 26 UNION ALL
    SELECT 'Olive', 'Màu xanh ô liu', '/ˈɒl.ɪv/', 'adjective', 'A dark yellowish-green color', 'He wore an olive green military jacket.', 'Anh ấy khoác chiếc áo quân đội màu xanh ô liu.', 27 UNION ALL
    SELECT 'Silver', 'Màu bạc', '/ˈsɪl.vər/', 'adjective', 'A shiny greyish-white color', 'The full moon shone like polished silver.', 'Vầng trăng tròn tỏa sáng như một đĩa bạc sáng loáng.', 28 UNION ALL
    SELECT 'Purple', 'Màu tím', '/ˈpɜː.pəl/', 'adjective', 'Of color between red and blue', 'Rich purple velvet covered the royal chair.', 'Tấm nhung tím quý phái phủ lên chiếc ngai hoàng gia.', 29 UNION ALL
    SELECT 'Violet', 'Màu tím hoa cà', '/ˈvaɪə.lət/', 'adjective', 'A bluish-purple color', 'Gentle violet wildflowers dotted the hillside.', 'Những bông hoa dại màu tím hoa cà điểm xuyết trên sườn đồi.', 30 UNION ALL
    SELECT 'Yellow', 'Màu vàng', '/ˈjel.əʊ/', 'adjective', 'Of color resembling lemons or sunflowers', 'A field of yellow sunflowers faced the light.', 'Cánh đồng hoa hướng dương vàng rực hướng về phía ánh mặt trời.', 31 UNION ALL
    SELECT 'Orange', 'Màu cam', '/ˈɒr.ɪndʒ/', 'adjective', 'A bright reddish-yellow color', 'Autumn leaves turned brilliant orange.', 'Lá mùa thu chuyển sang màu cam rực rỡ.', 32 UNION ALL
    SELECT 'Indigo', 'Màu chàm', '/ˈɪn.dɪ.ɡəʊ/', 'adjective', 'A deep rich blue color', 'Night sky faded into velvet indigo.', 'Màn đêm buông xuống chuyển dần sang sắc chàm như nhung.', 33 UNION ALL
    SELECT 'Maroon', 'Màu nâu đỏ', '/məˈruːn/', 'adjective', 'A dark brownish-red color', 'Students wore traditional maroon blazers.', 'Các bạn học sinh diện áo khoác đồng phục màu nâu đỏ truyền thống.', 34 UNION ALL
    SELECT 'Bronze', 'Màu đồng đỏ', '/brɒnz/', 'adjective', 'A yellowish-brown alloy color', 'The bronze statue honored the ancient poet.', 'Bức tượng màu đồng uy nghiêm tưởng nhớ người thi sĩ xưa.', 35 UNION ALL

    -- Từ 7-9 ký tự (Mốc 4 - 5)
    SELECT 'Crimson', 'Màu đỏ thẫm', '/ˈkrɪm.zən/', 'adjective', 'A deep rich red color with a touch of purple', 'Crimson roses lined the garden path.', 'Những đóa hồng đỏ thẫm trải dọc lối đi trong vườn.', 36 UNION ALL
    SELECT 'Emerald', 'Màu xanh ngọc bích', '/ˈem.ər.əld/', 'adjective', 'A bright rich green gemstone color', 'The valley sparkled with emerald hills.', 'Thung lũng sáng rực với những quả đồi màu xanh ngọc bích.', 37 UNION ALL
    SELECT 'Magenta', 'Màu đỏ cánh sen', '/məˈdʒen.tə/', 'adjective', 'A vivid purplish-red color', 'Digital prints used bright magenta ink.', 'Bản in kỹ thuật số sử dụng màu mực đỏ cánh sen rực rỡ.', 38 UNION ALL
    SELECT 'Scarlet', 'Màu đỏ tươi', '/ˈskɑː.lət/', 'adjective', 'A brilliant red color with orange tint', 'Autumn maples display scarlet foliage.', 'Những cây phong mùa thu khoe sắc lá đỏ tươi lộng lẫy.', 39 UNION ALL
    SELECT 'Charcoal', 'Màu than củi', '/ˈtʃɑː.kəʊl/', 'adjective', 'A dark grey color of burnt wood', 'He purchased an elegant charcoal suit.', 'Anh ấy chọn mua một bộ âu phục màu than củi lịch thiệp.', 40 UNION ALL
    SELECT 'Turquoise', 'Màu xanh ngọc lam', '/ˈtɜː.kwɔɪz/', 'adjective', 'A greenish-blue color like the gemstone', 'Tropical island lagoons boast turquoise waters.', 'Đầm phá nhiệt đới sở hữu làn nước xanh ngọc lam trong vắt.', 41 UNION ALL
    SELECT 'Lavender', 'Màu hoa oải hương', '/ˈlæv.ɪn.dər/', 'adjective', 'A pale blue-purple color', 'Rolling fields of lavender smelled divine.', 'Cánh đồng hoa oải hương màu tím nhạt ngát hương thơm tuyệt diệu.', 42 UNION ALL
    SELECT 'Burgundy', 'Màu đỏ rượu vang', '/ˈbɜː.ɡən.di/', 'adjective', 'A deep red wine color', 'Velvet burgundy curtains blocked the sun.', 'Rèm nhung màu đỏ rượu vang che bớt ánh nắng chói chang.', 43 UNION ALL
    SELECT 'Platinum', 'Màu bạch kim', '/ˈplæt.ɪ.nəm/', 'adjective', 'A silvery-white metallic sheen color', 'The wedding rings were crafted in platinum.', 'Đôi nhẫn cưới được chế tác tinh xảo bằng bạch kim sáng ngời.', 44 UNION ALL
    SELECT 'Cerulean', 'Màu xanh da trời sâu', '/səˈruː.li.ən/', 'adjective', 'A deep sky-blue color', 'The artist painted a cerulean sea.', 'Người họa sĩ vẽ nên một bức tranh biển màu xanh da trời sâu lắng.', 45 UNION ALL

    -- Từ dài 10-12 ký tự (Mốc 6)
    SELECT 'Aquamarine', 'Màu xanh ngọc biển', '/ˌæk.wə.məˈriːn/', 'adjective', 'A light bluish-green gemstone color', 'The crystal-clear bay was stunning aquamarine.', 'Vịnh biển trong vắt ánh lên sắc xanh ngọc biển tuyệt mỹ.', 46 UNION ALL
    SELECT 'Chartreuse', 'Màu xanh lục ánh vàng', '/ʃɑːˈtrɜːz/', 'adjective', 'A bright yellow-green liquor color', 'Chartreuse leaves glowed under spring sunshine.', 'Những chiếc lá màu lục ánh vàng bừng sáng dưới nắng xuân.', 47 UNION ALL
    SELECT 'Periwinkle', 'Màu xanh tím hoa dừa', '/ˈper.ɪˌwɪŋ.kəl/', 'adjective', 'A pale indigo-violet pastel color', 'She decorated her room in periwinkle blue.', 'Cô ấy trang trí căn phòng của mình bằng gam màu xanh tím hoa dừa dịu ngọt.', 48 UNION ALL
    SELECT 'Vermilion', 'Màu đỏ son', '/vəˈmɪl.jən/', 'adjective', 'A brilliant red or scarlet pigment color', 'Traditional temple gates were painted vermilion.', 'Những cánh cổng đền chùa cổ kính được sơn màu đỏ son rạng rỡ.', 49 UNION ALL
    SELECT 'Ultramarine', 'Màu lam sẫm tuyệt đối', '/ˌʌl.trə.məˈriːn/', 'adjective', 'A brilliant deep blue mineral pigment', 'Painters prized pure ultramarine powder.', 'Các danh họa luôn trân quý bột khoáng màu lam sẫm tuyệt mỹ.', 50
) val
WHERE @deck_colors_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM flashcards f WHERE f.deck_id = @deck_colors_id AND f.front_text = val.front_text
);

-- Cập nhật total_cards cho Colors
UPDATE decks SET total_cards = (SELECT COUNT(*) FROM flashcards WHERE deck_id = @deck_colors_id AND is_active = true) WHERE id = @deck_colors_id;
