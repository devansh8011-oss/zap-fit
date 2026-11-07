import json
import os

meals_raw = """
[VEGAN]
MEAL-01|Tofu Scramble with Spinach & Whole Wheat Toast|Vegan|380|42|24|12|Iron, Calcium, Magnesium|Gluten, Soy|Dairy, Eggs, Fish, Shellfish, Peanuts, Tree Nuts|Hypertrophy / Resistance|High protein plant starter, rich in iron for muscle stamina.|Tofu, Spinach, Whole wheat bread, Olive oil, Turmeric, Salt
MEAL-02|Oatmeal with Soy Protein Isolate, Chia & Berries|Vegan|420|58|26|10|Magnesium, Zinc, Antioxidants|Soy|Dairy, Eggs, Fish, Shellfish, Gluten, Tree Nuts, Peanuts|Endurance / HIIT|Complex carbs for glycogen recovery, omega-3s from chia seeds.|Rolled oats, Soy protein isolate, Chia seeds, Mixed berries, Water or oat milk
MEAL-03|Lentil & Quinoa Bowl with Tahini Dressing|Vegan|490|65|22|15|Iron, Potassium, Folate|Sesame|Dairy, Eggs, Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Leg Day / High Volume|Sustained fiber release, clean mineral profile for muscle repair.|Brown lentils, Quinoa, Tahini, Lemon juice, Cucumber, Cherry tomatoes
MEAL-04|Chickpea & Sweet Potato Curry with Brown Rice|Vegan|540|78|18|14|Potassium, Vitamin A, Iron|None|Top 9 Common Allergens (Allergen-Free)|Heavy Strength / Powerlifting|High potassium prevents cramps; dense carb replenishment.|Chickpeas, Sweet potato, Brown rice, Coconut milk, Curry powder, Spinach
MEAL-05|Edamame & Pea Protein Smoothie Bowl|Vegan|350|38|30|8|Iron, Magnesium, Phosphorus|Soy|Dairy, Eggs, Fish, Shellfish, Gluten, Peanuts, Tree Nuts|Post-Cardio / Conditioning|Rapidly digestible plant protein isolate with fruit antioxidants.|Shelled edamame, Pea protein powder, Banana, Blueberries, Flaxseeds
MEAL-06|Seitan Stir-fry with Broccoli & Cashews|Vegan|480|35|42|16|Zinc, Iron, Selenium|Gluten, Tree Nuts, Soy|Dairy, Eggs, Fish, Shellfish, Peanuts, Sesame|Hypertrophy / Resistance|Ultra-high protein density to stimulate muscle protein synthesis.|Seitan strips, Broccoli, Cashews, Soy sauce, Garlic, Ginger
MEAL-07|Black Bean & Avocado Burrito Bowl|Vegan|520|68|20|18|Potassium, Magnesium, Fiber|None|Top 9 Common Allergens (Allergen-Free)|Leg Day / High Volume|Healthy fats + slow-digesting carbs for heavy training fuel.|Black beans, Avocado, Brown rice, Sweet corn, Salsa, Coriander
MEAL-08|Tempeh Power Bowl with Quinoa & Kale|Vegan|460|45|28|16|Calcium, Manganese, Iron|Soy|Dairy, Eggs, Fish, Shellfish, Gluten, Peanuts, Tree Nuts|Strength & Conditioning|Fermented soy for gut health and superior nutrient uptake.|Tempeh, Quinoa, Kale, Olive oil, Lemon, Sunflower seeds
MEAL-09|Peanut Butter & Banana Protein Oatmeal|Vegan|510|62|22|20|Potassium, Magnesium|Peanuts|Dairy, Eggs, Fish, Shellfish, Gluten, Soy, Tree Nuts|Pre/Post Heavy Compound|Fast glycogen replenishment plus healthy monounsaturated fats.|Rolled oats, Peanut butter, Banana, Pea protein, Cinnamon
MEAL-10|Red Lentil Dahl with Whole Wheat Roti|Vegan|440|64|22|9|Iron, Folate, Zinc|Gluten|Dairy, Eggs, Fish, Shellfish, Soy, Peanuts, Tree Nuts|Endurance / HIIT|Easy-to-digest legumes with complex B-vitamin profile.|Red lentils, Whole wheat flour (roti), Cumin, Turmeric, Tomato, Coriander
MEAL-11|Buckwheat Pancakes with Hemp Protein & Syrup|Vegan|430|66|20|8|Magnesium, Manganese, Iron|None|Top 9 Common Allergens (Allergen-Free)|Leg Day / Refeed|Gluten-free complete amino acid profile from hemp.|Buckwheat flour, Hemp protein powder, Maple syrup, Almond milk (or oat), Baking powder
MEAL-12|Vegan Chili Sin Carne with Wild Rice|Vegan|490|70|24|11|Iron, Potassium, Zinc|None|Top 9 Common Allergens (Allergen-Free)|Heavy Strength / Powerlifting|Fiber-rich, high potassium meal supporting endurance recovery.|Kidney beans, Black beans, Wild rice, Tomatoes, Bell pepper, Cumin
MEAL-13|Crispy Air-Fried Tofu with Roasted Asparagus|Vegan|360|20|26|18|Calcium, Vitamin K, Iron|Soy|Dairy, Eggs, Fish, Shellfish, Gluten, Peanuts, Tree Nuts|Fat Loss / Hypertrophy|Low carb density, high amino density for cutting phase.|Firm tofu, Asparagus, Olive oil, Soy sauce, Garlic powder, Nutritional yeast
MEAL-14|Roasted Chickpea & Avocado Wrap|Vegan|470|58|18|18|Folate, Potassium, Magnesium|Gluten|Dairy, Eggs, Fish, Shellfish, Soy, Peanuts, Tree Nuts|Post-Cardio / Conditioning|Portable energy meal with heart-healthy fats.|Chickpeas, Avocado, Whole wheat tortilla, Lettuce, Tahini, Lemon
MEAL-15|Chia Seed Pudding with Almond Milk & Protein|Vegan|310|28|20|12|Calcium, Omega-3, Magnesium|Tree Nuts|Dairy, Eggs, Fish, Shellfish, Gluten, Soy, Peanuts|Light Mobility / Rest Day|High soluble fiber and anti-inflammatory healthy fats.|Chia seeds, Almond milk, Plant protein powder, Vanilla, Strawberries

[VEGETARIAN]
MEAL-01|Greek Yogurt Parfait with Honey & Granola|Vegetarian|380|45|28|8|Calcium, Potassium, B12|Dairy, Gluten|Eggs, Fish, Shellfish, Soy, Peanuts, Tree Nuts|Post-Cardio / Conditioning|Rich in casein & whey; excellent gut-friendly probiotics.|Greek yogurt, Granola, Honey, Mixed berries, Chia seeds
MEAL-02|Paneer (Cottage Cheese) & Vegetable Stir-Fry|Vegetarian|420|18|30|24|Calcium, Phosphorus, B12|Dairy|Eggs, Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Hypertrophy / Resistance|Slow-digesting casein protein ideal for tissue remodeling.|Paneer, Bell peppers, Broccoli, Olive oil, Cumin, Black pepper
MEAL-03|Egg White & Spinach Omelet with Whole Toast|Vegetarian|320|28|28|6|Choline, Iron, Calcium|Eggs, Gluten|Dairy, Fish, Shellfish, Soy, Peanuts, Tree Nuts|Fat Loss / Hypertrophy|Ultra-lean complete protein with low calorie density.|Egg whites, Baby spinach, Whole wheat toast, Salt, Pepper, Olive oil spray
MEAL-04|Whey Protein Shake with Oats & Almond Butter|Vegetarian|450|40|35|14|Calcium, Magnesium, B-Complex|Dairy, Tree Nuts|Eggs, Fish, Shellfish, Gluten, Soy, Peanuts|Hypertrophy / Resistance|Industry standard post-workout rapid amino acid infusion.|Whey protein isolate, Rolled oats, Almond butter, Milk or water, Banana
MEAL-05|Ricotta & Blueberry Stuffed Protein Pancakes|Vegetarian|490|56|26|16|Calcium, Antioxidants|Dairy, Eggs, Gluten|Fish, Shellfish, Soy, Peanuts, Tree Nuts|Leg Day / Refeed|Decadent refuel meal, great for high volume sessions.|Whole wheat pancake mix, Ricotta cheese, Blueberries, Whey protein, Eggs, Maple syrup
MEAL-06|Paneer Tikka with Quinoa Pilaf|Vegetarian|530|42|28|28|Calcium, Phosphorus, Iron|Dairy|Eggs, Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Heavy Strength / Powerlifting|Dense energy meal supporting muscle mass growth.|Paneer, Quinoa, Yogurt marinade, Tikka spices, Bell peppers, Onion
MEAL-07|Whole Eggs Scrambled with Cheese & Avocado|Vegetarian|460|8|24|36|Choline, Vitamin D, B12|Dairy, Eggs|Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Strength / Low-Carb|Rich in healthy cholesterol for anabolic hormone synthesis.|Whole eggs, Cheddar cheese, Avocado, Butter, Salt, Pepper
MEAL-08|High-Protein Lentil & Halloumi Salad|Vegetarian|470|32|26|25|Calcium, Zinc, Iron|Dairy|Eggs, Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Hypertrophy / Resistance|Satisfying mix of slow carbs and savory dairy protein.|Brown lentils, Halloumi cheese, Arugula, Cherry tomatoes, Olive oil, Lemon
MEAL-09|Skyr Yogurt Bowl with Pumpkin Seeds & Mango|Vegetarian|340|36|31|5|Calcium, Potassium, Zinc|Dairy|Eggs, Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Post-Cardio / Conditioning|High protein density with fast fruit sugar for recovery.|Icelandic Skyr, Fresh mango, Pumpkin seeds, Honey
MEAL-10|Cottage Cheese & Pineapple Bowl|Vegetarian|290|30|24|4|Bromelain, Calcium, Potassium|Dairy|Eggs, Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|HIIT / Circuit Training|Bromelain enzyme aids protein digestion and cuts inflammation.|Low-fat cottage cheese, Fresh pineapple chunks, Walnuts, Mint leaves
MEAL-11|Egg & Whole Wheat Cheese Quesadilla|Vegetarian|480|38|26|22|Calcium, Vitamin A, B12|Dairy, Eggs, Gluten|Fish, Shellfish, Soy, Peanuts, Tree Nuts|Strength & Conditioning|Balanced macronutrient ratio for active repair.|Whole wheat tortilla, Scrambled eggs, Mozzarella cheese, Salsa, Coriander
MEAL-12|Vegetable & Egg White Fried Rice|Vegetarian|410|52|24|8|Selenium, Choline, B-Vitamins|Eggs, Soy|Dairy, Fish, Shellfish, Gluten, Peanuts, Tree Nuts|Post-Cardio / Conditioning|Clean starch meal for rapid glycogen restocking.|Jasmine rice, Egg whites, Peas, Carrots, Soy sauce, Sesame oil
MEAL-13|Greek Yogurt Waffles with Berry Compote|Vegetarian|420|52|22|11|Calcium, Vitamin C|Dairy, Eggs, Gluten|Fish, Shellfish, Soy, Peanuts, Tree Nuts|Leg Day / Refeed|Great tasting post-workout meal for weekend training.|Oat flour, Greek yogurt, Egg whites, Mixed berry compote, Maple syrup
MEAL-14|Mozzarella, Tomato & Basil Omelet|Vegetarian|390|6|25|29|Calcium, Vitamin A, Lycopene|Dairy, Eggs|Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Fat Loss / Hypertrophy|Ketogenic-friendly lean muscle building option.|Eggs, Fresh mozzarella, Ripe tomatoes, Fresh basil, Olive oil
MEAL-15|Whey Isolate Shake with Rice Cream|Vegetarian|310|45|28|2|Calcium, Sodium|Dairy|Eggs, Fish, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|HIIT / Circuit Training|Ultra-fast digestion formula post intense glycolytic work.|Cream of rice, Whey protein isolate, Water, Cinnamon

[NON-VEGETARIAN]
MEAL-01|Grilled Chicken Breast with Sweet Potato & Broccoli|Non-Vegetarian|450|42|45|8|Potassium, Vitamin A, B6|None|Top 9 Common Allergens (Allergen-Free)|Hypertrophy / Resistance|The classic bodybuilding staple: lean protein + clean carbs.|Chicken breast, Sweet potato, Broccoli florets, Olive oil, Paprika, Garlic
MEAL-02|Pan-Seared Salmon with Quinoa & Asparagus|Non-Vegetarian|520|35|38|22|Omega-3, Selenium, Vitamin D|Fish|Dairy, Eggs, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Strength & Conditioning|Omega-3 fatty acids reduce joint inflammation post-lifting.|Salmon fillet, Quinoa, Asparagus, Lemon juice, Olive oil, Dill
MEAL-03|Lean Ground Beef Bowl with Jasmine Rice|Non-Vegetarian|580|55|42|18|Iron, Zinc, Vitamin B12|None|Top 9 Common Allergens (Allergen-Free)|Heavy Strength / Powerlifting|Heme iron and creatine rich for maximum strength recovery.|Lean ground beef (90/10), Jasmine rice, Garlic, Onion, Salt, Parsley
MEAL-04|Turkey Breast Wrap with Whole Wheat Tortilla|Non-Vegetarian|390|36|32|10|B-Vitamins, Selenium, Potassium|Gluten|Dairy, Eggs, Fish, Shellfish, Soy, Peanuts, Tree Nuts|Fat Loss / Hypertrophy|Lean protein wrap for quick post-workout convenience.|Sliced turkey breast, Whole wheat tortilla, Lettuce, Tomato, Mustard
MEAL-05|Tuna Salad with Olive Oil & Whole Grain Crackers|Non-Vegetarian|360|28|34|12|Omega-3, Selenium, Niacin|Fish, Gluten|Dairy, Eggs, Shellfish, Soy, Peanuts, Tree Nuts|Fat Loss / Hypertrophy|High protein, low effort meal for active muscle recovery.|Canned skipjack tuna (in water), Extra virgin olive oil, Whole grain crackers, Celery, Lemon
MEAL-06|Egg & Turkey Bacon Breakfast Muffin|Non-Vegetarian|380|30|28|16|Choline, B12, Sodium|Eggs, Gluten|Dairy, Fish, Shellfish, Soy, Peanuts, Tree Nuts|Strength & Conditioning|Convenient post-morning workout protein and sodium boost.|Whole wheat English muffin, Whole egg, Turkey bacon, Spinach
MEAL-07|Grilled Shrimp Tacos with Corn Tortillas|Non-Vegetarian|410|44|32|10|Astaxanthin, Selenium, Zinc|Shellfish|Dairy, Eggs, Fish, Gluten, Soy, Peanuts, Tree Nuts|Post-Cardio / Conditioning|Ultra-lean seafood protein with fast-digesting corn carbs.|Shrimp, Corn tortillas, Cabbage slaw, Lime juice, Cilantro, Avocado
MEAL-08|Steak & Sweet Potato Mash|Non-Vegetarian|620|48|44|26|Heme Iron, Creatine, Zinc|None|Top 9 Common Allergens (Allergen-Free)|Heavy Strength / Powerlifting|High calorie density + natural creatine for heavy lifters.|Sirloin steak, Sweet potato, Rosemary, Garlic, Olive oil
MEAL-09|Cod Fillet with Brown Rice & Green Beans|Non-Vegetarian|370|40|36|5|Iodine, Vitamin B12|Fish|Dairy, Eggs, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Fat Loss / Hypertrophy|Extremely low-fat white fish for strict contest prep.|Cod fillet, Brown rice, Green beans, Lemon, Olive oil spray
MEAL-10|Chicken Rice Noodle Soup (Pho Style)|Non-Vegetarian|430|52|32|9|Sodium, Potassium, Collagen|None|Top 9 Common Allergens (Allergen-Free)|HIIT / Circuit Training|Electrolyte replenishment and collagen for joint health.|Chicken breast slices, Rice noodles, Bone broth, Ginger, Star anise, Bean sprouts, Basil
MEAL-11|Tilapia Fillet with Roasted Potatoes|Non-Vegetarian|380|42|34|7|Selenium, Phosphorus|Fish|Dairy, Eggs, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Post-Cardio / Conditioning|Clean, easily digestible protein-carb combination.|Tilapia fillet, Russet potatoes, Rosemary, Olive oil, Lemon
MEAL-12|Bison Patty with Roasted White Rice|Non-Vegetarian|560|45|42|20|Iron, Zinc, B-Complex|None|Top 9 Common Allergens (Allergen-Free)|Heavy Strength / Powerlifting|Leaner than beef, highly nutrient-dense red meat source.|Ground bison patty, White basmati rice, Asparagus, Sea salt, Black pepper
MEAL-13|Chicken & White Rice Recovery Bowl|Non-Vegetarian|480|58|40|6|B6, Niacin, Phosphorus|None|Top 9 Common Allergens (Allergen-Free)|HIIT / Circuit Training|Fast-acting glycemic index meal for immediate glycogen store.|Grilled chicken breast, White rice, Steamed zucchini, Teriyaki or aminos
MEAL-14|Seared Tuna Steak with Wild Rice|Non-Vegetarian|460|38|42|12|Omega-3, Selenium, B12|Fish|Dairy, Eggs, Shellfish, Gluten, Soy, Peanuts, Tree Nuts|Hypertrophy / Resistance|Premium lean protein with complex grain matrix.|Yellowfin tuna steak, Wild rice blend, Steamed bok choy, Sesame oil, Tamari
MEAL-15|Turkey Meatballs with Whole Wheat Spaghetti|Non-Vegetarian|540|65|36|14|Iron, Zinc, B-Vitamins|Gluten, Eggs|Dairy, Fish, Shellfish, Soy, Peanuts, Tree Nuts|Leg Day / Refeed|Carbo-loading meal perfect after grueling leg workouts.|Lean ground turkey meatballs, Whole wheat spaghetti, Marinara sauce, Basil, Garlic

[JAIN]
MEAL-01|Jain Yellow Lentil Soup (Dal) with Quinoa|Jain Vegan|390|54|22|9|Folate, Iron, Magnesium|None|Top 9 Allergens, Meat, Dairy, Eggs, Root Veggies|Strength & Conditioning|Clean sattvic lentil soup seasoned with cumin and coriander.|Yellow moong dal, Quinoa, Cumin seeds, Coriander leaves, Tomato, Turmeric, Ghee or oil
MEAL-02|Jain Raw Banana & Chickpea Patty Wrap|Jain Vegan|450|58|20|14|Potassium, Vitamin B6, Iron|Gluten|Dairy, Eggs, Meat, Root Veggies, Soy, Peanuts|Leg Day / Refeed|Raw banana provides resistant starch without root veggies.|Boiled raw banana, Chickpeas, Whole wheat roti, Mint coriander chutney (no garlic), Cumin
MEAL-03|Jain Black-Eyed Peas (Lobiya) Curry & Rice|Jain Vegan|480|66|22|14|Iron, Potassium, Folate|None|Top 9 Allergens, Meat, Dairy, Eggs, Root Veggies|Heavy Strength / Powerlifting|Sustained fiber and protein release supporting long-term energy.|Black-eyed peas (lobiya), Basmati rice, Tomato purée, Cumin, Hing (asafoetida), Coriander
MEAL-04|Jain Tofu & Capsicum Stir-Fry with Sesame|Jain Vegan|360|22|26|18|Calcium, Vitamin C, Iron|Soy, Sesame|Meat, Dairy, Eggs, Root Veggies, Gluten, Peanuts|Fat Loss / Hypertrophy|Low carb, high protein plant stir-fry without onion or garlic.|Firm tofu, Green & yellow capsicum, White sesame seeds, Mustard oil, Rock salt
MEAL-05|Jain Amaranth (Rajgira) Porridge with Almond Milk|Jain Vegan|350|48|16|10|Calcium, Magnesium, Manganese|Tree Nuts|Meat, Dairy, Eggs, Root Veggies, Gluten, Soy, Peanuts|Light Mobility / Rest Day|Nutrient-dense ancient grain breakfast ideal for light recovery.|Rajgira (amaranth) grain, Almond milk, Jaggery, Cardamom, Sliced almonds
MEAL-06|Jain Paneer Bhurji with Whole Wheat Paratha|Jain Vegetarian|460|38|26|22|Calcium, Phosphorus, B12|Dairy, Gluten|Meat, Eggs, Root Veggies, Soy, Peanuts, Tree Nuts|Hypertrophy / Resistance|Zero root vegetables (no onion/garlic); rich casein protein.|Fresh paneer, Tomatoes, Green capsicum, Cumin, Whole wheat paratha, Rock salt
MEAL-07|Jain Moong Dal Chilla with Paneer Stuffing|Jain Vegetarian|380|42|24|12|Iron, Potassium, Calcium|Dairy|Meat, Eggs, Root Veggies, Gluten, Soy, Peanuts|Post-Cardio / Conditioning|Easy on stomach, high protein lentil crepe with paneer.|Yellow moong dal batter, Grated paneer, Green chilli, Coriander, Rock salt
MEAL-08|Jain Buckwheat (Kuttu) & Cottage Cheese Khichdi|Jain Vegetarian|410|50|22|14|Magnesium, Zinc, Calcium|Dairy|Meat, Eggs, Root Veggies, Gluten, Soy, Peanuts|Endurance / HIIT|Sattvic recovery meal utilizing complex pseudo-grains and fresh paneer.|Kuttu (buckwheat groats), Paneer cubes, Green chillies, Ghee, Cumin seeds
MEAL-09|Jain Raw Banana & Tomato Rice Bowl with Curd|Jain Vegetarian|440|62|18|12|Calcium, Potassium, Probiotics|Dairy|Meat, Eggs, Root Veggies, Gluten, Soy, Peanuts|HIIT / Circuit Training|Cooling post-workout meal supporting gut health and muscle restocking.|Basmati rice, Raw banana sabzi, Fresh homemade curd, Cumin tadka, Rock salt
MEAL-10|Jain Cottage Cheese & Cucumber Salad|Jain Vegetarian|320|12|24|20|Calcium, Vitamin C, Phosphorus|Dairy|Meat, Eggs, Root Veggies, Gluten, Soy, Peanuts|Fat Loss / Hypertrophy|Hydrating, low carb high protein sattvic salad.|Fresh paneer cubes, Seedless diced cucumber, Lemon juice, Rock salt, Roasted cumin powder
MEAL-11|Jain-Style Steamed Chicken Breast with Rice & Capsicum|Jain Non-Veg|440|48|42|8|B6, Niacin, Potassium|None|Top 9 Allergens, Root Veggies, Onion, Garlic, Dairy|Hypertrophy / Resistance|Lean chicken cooked sattvic-style with cumin, coriander, and peppers.|Skinless chicken breast, Steamed white rice, Green bell pepper, Cumin powder, Rock salt
MEAL-12|Jain-Style Pan-Seared Fish Fillet with Steamed Rice|Jain Non-Veg|410|42|38|10|Omega-3, Selenium, Iodine|Fish|Root Veggies, Onion, Garlic, Dairy, Gluten, Soy, Nuts|Strength & Conditioning|Clean fish protein without root veggies or pungent aromatics.|White fish fillet (Surmai or Pomfret), Steamed rice, Tomato compote, Lemon, Cumin
MEAL-13|Jain-Style Poached Turkey Breast & Zucchini Mash|Jain Non-Veg|390|28|40|12|B-Vitamins, Potassium, Zinc|None|Top 9 Allergens, Root Veggies, Onion, Garlic, Dairy|Fat Loss / Hypertrophy|Ultra-clean lean turkey protein with zero root vegetables.|Turkey breast, Zucchini, Olive oil, Coriander, Rock salt, Black pepper
MEAL-14|Jain-Style Egg White Scramble with Tomatoes & Herbs|Jain Non-Veg|310|14|28|12|Choline, Selenium, Vitamin C|Eggs|Meat, Root Veggies, Onion, Garlic, Dairy, Gluten, Soy|Post-Cardio / Conditioning|Light, easily digestible protein scramble adhering to no-root rule.|Egg whites, Ripe tomatoes, Green chillies, Fresh coriander, Ghee
MEAL-15|Jain-Style Grilled Lamb Chops with Steamed Rice|Jain Non-Veg|580|42|40|24|Iron, Zinc, B12|None|Top 9 Allergens, Root Veggies, Onion, Garlic, Dairy|Heavy Strength / Powerlifting|Dense red meat power meal seasoned purely with rock salt and cumin.|Trimmed lamb chops, Basmati rice, Cumin seeds, Coriander powder, Rock salt

[ALLERGEN-FREE]
MEAL-01|Top 9 Allergen-Free Quinoa & Black Bean Power Bowl|Allergen-Free Vegan|450|62|18|14|Iron, Potassium, Fiber|None|Top 9 Common Allergens (Gluten, Dairy, Soy, Nuts, etc.)|Leg Day / High Volume|100% free of all top 9 allergens; clean plant-based muscle refuel.|Quinoa, Black beans, Sweet corn, Tomato salsa, Avocado, Coriander
MEAL-02|Hypoallergenic Chickpea & Sweet Potato Stew|Allergen-Free Vegan|420|64|16|11|Potassium, Vitamin A, Iron|None|Top 9 Common Allergens|Post-Cardio / Conditioning|Gut-friendly complex carbs and fiber without soy, gluten, or nuts.|Chickpeas, Sweet potatoes, Vegetable broth, Olive oil, Turmeric, Cumin
MEAL-03|Allergen-Free Buckwheat Porridge with Berries|Allergen-Free Vegan|360|52|16|10|Magnesium, Antioxidants, Fiber|None|Top 9 Common Allergens|Endurance / HIIT|Gluten-free pseudograin breakfast rich in plant minerals.|Buckwheat groats, Water, Fresh blueberries, Strawberries, Flaxseed meal, Maple syrup
MEAL-04|Top 9 Free Rice & Yellow Split Pea Dahl|Allergen-Free Vegan|430|65|20|9|Folate, Iron, Zinc|None|Top 9 Common Allergens|Strength & Conditioning|Easy to digest protein-carb matrix for sensitive stomachs.|Yellow split peas, Jasmine rice, Cumin, Turmeric, Tomato, Olive oil
MEAL-05|Allergen-Free Hemp & Pumpkin Seed Smoothie Bowl|Allergen-Free Vegan|340|38|22|12|Zinc, Magnesium, Omega-3|None|Top 9 Common Allergens|Light Mobility / Rest Day|Nut-free, soy-free protein bowl rich in seed minerals.|Hemp seeds, Pumpkin seeds, Banana, Water, Cinnamon, Chia seeds
MEAL-06|Allergen-Free Cottage Cheese & Pineapple Bowl|Allergen-Free Veg|310|30|26|6|Calcium, Bromelain, Potassium|Dairy|Gluten, Soy, Eggs, Fish, Shellfish, Peanuts, Tree Nuts, Sesame|HIIT / Circuit Training|Gluten-free, nut-free, soy-free recovery bowl.|Lactose-free or pure cottage cheese, Fresh pineapple, Honey, Mint
MEAL-07|Hypoallergenic Egg White & Spinach Omelet with Rice Cakes|Allergen-Free Veg|290|22|26|4|Choline, Iron, Calcium|Eggs|Gluten, Dairy, Soy, Fish, Shellfish, Peanuts, Tree Nuts, Sesame|Fat Loss / Hypertrophy|Lean protein meal avoiding gluten, dairy, and soy.|Egg whites, Baby spinach, Plain puffed rice cakes, Olive oil spray, Salt
MEAL-08|Top 8 Free Rice Protein & Berry Smoothie|Allergen-Free Veg|320|42|28|4|Calcium, Antioxidants, Potassium|None|Top 9 Common Allergens|Post-Cardio / Conditioning|Hypoallergenic plant/dairy-free protein recovery drink.|Brown rice protein powder, Mixed berries, Water, Banana, Chia seeds
MEAL-09|Allergen-Safe Cottage Cheese & Pumpkin Seed Bowl|Allergen-Free Veg|380|24|28|18|Calcium, Zinc, Magnesium|Dairy|Gluten, Soy, Eggs, Fish, Shellfish, Peanuts, Tree Nuts, Sesame|Hypertrophy / Resistance|High protein dairy snack free of nuts, soy, and gluten.|Pure cottage cheese, Roasted pumpkin seeds, Honey, Cinnamon
MEAL-10|Gluten/Soy/Nut-Free Whey Isolate Shake with Banana|Allergen-Free Veg|310|38|28|2|Calcium, Potassium, Sodium|Dairy|Gluten, Soy, Eggs, Fish, Shellfish, Peanuts, Tree Nuts, Sesame|HIIT / Circuit Training|Ultra-pure whey isolate for allergy-prone athletes.|Cross-flow microfiltered whey isolate, Ripe banana, Water, Cinnamon
MEAL-11|Top 9 Allergen-Free Grilled Chicken & Sweet Potato Mash|Allergen-Free Non-Veg|440|45|42|10|Potassium, Vitamin A, B6|None|Top 9 Common Allergens|Hypertrophy / Resistance|100% free of Gluten, Dairy, Soy, Nuts, Eggs, Fish, Shellfish, Sesame, Peanuts.|Skinless chicken breast, Sweet potato, Olive oil, Salt, Pepper, Rosemary
MEAL-12|Top 8 Allergen-Free Ground Turkey & Pumpkin Bowl|Allergen-Free Non-Veg|430|38|36|14|Zinc, Iron, Vitamin A|None|Top 9 Common Allergens|Strength & Conditioning|Clean, gut-friendly lean turkey meal for sensitive digestive systems.|Ground turkey breast, Roasted pumpkin cubes, Brown rice, Olive oil, Thyme
MEAL-13|Allergen-Safe Beef Patty with White Rice & Carrots|Allergen-Free Non-Veg|520|48|38|18|Heme Iron, Creatine, Zinc|None|Top 9 Common Allergens|Heavy Strength / Powerlifting|Simple, non-reactive ingredient profile for peak energy and recovery.|100% pure lean beef patty, White basmati rice, Steamed carrots, Sea salt
MEAL-14|Allergen-Free Duck Breast Bowl with Roasted Beetroot|Allergen-Free Non-Veg|510|42|34|22|Iron, Nitrates, Selenium|None|Top 9 Common Allergens|Heavy Strength / Powerlifting|Dietary nitrates enhance vasodilation with zero common allergens.|Skinless duck breast, Roasted beetroot cubes, Quinoa, Olive oil, Salt
MEAL-15|Top 9 Free Pork Tenderloin with Applesauce & Rice|Allergen-Free Non-Veg|480|50|36|12|Thiamine (B1), Potassium, Zinc|None|Top 9 Common Allergens|Leg Day / Refeed|Thiamine-rich lean pork optimizing carbohydrate absorption.|Lean pork tenderloin, Unsweetened applesauce, Jasmine rice, Green beans, Salt
"""

strategies_data = [
    {
        "workout_type": "Heavy Strength / Powerlifting",
        "primary_goal": "ATP-CP recovery, Central Nervous System repair, peak glycogen reloading",
        "optimal_macro_ratio": "50% Carbs : 35% Protein : 15% Fat",
        "carb_pct": 50,
        "protein_pct": 35,
        "fat_pct": 15,
        "key_nutrients": "High fast/moderate carbs, heme/dense protein, Sodium, Creatine, Iron",
        "recommended_meals": ["Steak & Sweet Potato", "Chickpea Curry", "Jain Lobiya Curry", "Allergen-Free Lamb Chops"]
    },
    {
        "workout_type": "Hypertrophy / Muscle Building",
        "primary_goal": "Maximize Muscle Protein Synthesis (MPS), cell swelling, sarcoplasmic refuel",
        "optimal_macro_ratio": "45% Carbs : 40% Protein : 15% Fat",
        "carb_pct": 45,
        "protein_pct": 40,
        "fat_pct": 15,
        "key_nutrients": "Leucine-rich protein (25g+), moderate starch, Magnesium, Zinc",
        "recommended_meals": ["Chicken Breast & Sweet Potato", "Seitan Stir-fry", "Jain Paneer Bhurji", "Allergen-Free Chicken Mash"]
    },
    {
        "workout_type": "Leg Day / High Volume Refeed",
        "primary_goal": "Massive muscle tissue micro-trauma repair, deep glycogen depletion refuel",
        "optimal_macro_ratio": "60% Carbs : 30% Protein : 10% Fat",
        "carb_pct": 60,
        "protein_pct": 30,
        "fat_pct": 10,
        "key_nutrients": "High glycemic carbs, potassium, ultra-lean protein to speed gastric emptying",
        "recommended_meals": ["Lentil Quinoa Bowl", "Jain Banana Wrap", "Pork Tenderloin", "Buckwheat Pancakes"]
    },
    {
        "workout_type": "HIIT / Circuit Training",
        "primary_goal": "Rapid lactate clearance, quick glycogen restocking, electrolyte balance",
        "optimal_macro_ratio": "55% Carbs : 35% Protein : 10% Fat",
        "carb_pct": 55,
        "protein_pct": 35,
        "fat_pct": 10,
        "key_nutrients": "Fast-digesting simple carbs, whey/soy isolate, Sodium, Potassium",
        "recommended_meals": ["Pho Chicken Soup", "Edamame Bowl", "Jain Banana Tomato Rice", "Allergen-Free Rice Bowl"]
    },
    {
        "workout_type": "Endurance / Long Distance Cardio",
        "primary_goal": "Aerobic glycogen restoration, rehydration, anti-inflammatory support",
        "optimal_macro_ratio": "65% Carbs : 20% Protein : 15% Fat",
        "carb_pct": 65,
        "protein_pct": 20,
        "fat_pct": 15,
        "key_nutrients": "High complex carbs, Omega-3s, Magnesium, Antioxidants, High Sodium",
        "recommended_meals": ["Oatmeal with Soy Protein", "Greek Yogurt Parfait", "Jain Buckwheat Khichdi", "Allergen-Free Buckwheat"]
    },
    {
        "workout_type": "Fat Loss / Cutting Phase",
        "primary_goal": "Preserve lean muscle mass, maximize satiety, minimize caloric intake",
        "optimal_macro_ratio": "20% Carbs : 60% Protein : 20% Fat",
        "carb_pct": 20,
        "protein_pct": 60,
        "fat_pct": 20,
        "key_nutrients": "Lean protein isolates, high fiber veggies, low GI carbs, Chromium",
        "recommended_meals": ["Egg White Omelet", "Cod Fillet", "Jain Tofu Capsicum Stir-Fry", "Allergen-Free Cod Fillet"]
    },
    {
        "workout_type": "Light Mobility / Rest Day",
        "primary_goal": "Tissue repair, systemic anti-inflammation, hormone regulation",
        "optimal_macro_ratio": "30% Carbs : 35% Protein : 35% Fat",
        "carb_pct": 30,
        "protein_pct": 35,
        "fat_pct": 35,
        "key_nutrients": "Healthy monounsaturated fats, collagen, gut-friendly fiber, Zinc",
        "recommended_meals": ["Eggs with Avocado", "Cottage Cheese & Pineapple", "Jain Amaranth Porridge", "Pumpkin Turkey Bowl"]
    }
]

supplements_data = [
    {
        "category": "Supplements",
        "name": "Whey Protein Isolate",
        "active_nutrients": "BCAAs, Leucine, EAA",
        "fitness_benefits": "Fast-acting muscle protein synthesis, accelerates tissue repair, highly bioavailable.",
        "optimal_timing": "Within 30-45 mins post-workout",
        "recommended_dosage": "25 - 30g per scoop"
    },
    {
        "category": "Supplements",
        "name": "Creatine Monohydrate",
        "active_nutrients": "Creatine Phosphate",
        "fitness_benefits": "Increases phosphocreatine stores, boosts power output, peak strength, and cell hydration.",
        "optimal_timing": "Daily post-workout or morning",
        "recommended_dosage": "3 - 5g daily"
    },
    {
        "category": "Supplements",
        "name": "Branched-Chain Amino Acids (BCAAs)",
        "active_nutrients": "Leucine, Isoleucine, Valine",
        "fitness_benefits": "Reduces muscle breakdown during prolonged fasts/cardio, mitigates DOMS.",
        "optimal_timing": "Intra-workout or pre-cardio",
        "recommended_dosage": "5 - 10g during training"
    },
    {
        "category": "Supplements",
        "name": "Beta-Alanine",
        "active_nutrients": "Carnosine Precursor",
        "fitness_benefits": "Buffers lactic acid build-up, delays neuromuscular fatigue during glycolytic sets.",
        "optimal_timing": "Pre-workout (20 mins prior)",
        "recommended_dosage": "3.2 - 5g daily"
    },
    {
        "category": "Supplements",
        "name": "Pre-Workout (Caffeine + Citrulline)",
        "active_nutrients": "Caffeine, L-Citrulline Malate",
        "fitness_benefits": "Enhances vasodilation (muscle pump), mental focus, and fatigue resistance.",
        "optimal_timing": "20 - 30 mins before lifting",
        "recommended_dosage": "200-300mg Caffeine / 6-8g Citrulline"
    },
    {
        "category": "Supplements",
        "name": "Omega-3 Fish / Algal Oil",
        "active_nutrients": "EPA & DHA Fatty Acids",
        "fitness_benefits": "Reduces joint inflammation, improves insulin sensitivity, supports cardiac health.",
        "optimal_timing": "With meals (Breakfast/Dinner)",
        "recommended_dosage": "1000 - 2000mg combined EPA/DHA"
    },
    {
        "category": "Supplements",
        "name": "Electrolyte Powder / Salt Tabs",
        "active_nutrients": "Sodium, Potassium, Magnesium",
        "fitness_benefits": "Prevents muscle cramping, maintains plasma volume during high sweat workouts.",
        "optimal_timing": "Intra-workout / Post-sweat",
        "recommended_dosage": "500mg Sodium + 200mg Potassium"
    },
    {
        "category": "Supplements",
        "name": "Casein Protein",
        "active_nutrients": "Slow-release Micellar Casein",
        "fitness_benefits": "Provides sustained anti-catabolic amino acid drip over 6-8 hours during sleep.",
        "optimal_timing": "Before sleep or long fasts",
        "recommended_dosage": "30 - 40g before bed"
    },
    {
        "category": "Whole Foods",
        "name": "Bananas",
        "active_nutrients": "Potassium, Fructose, Glucose",
        "fitness_benefits": "Rapid glycogen restocking, prevents muscle spasms, easy on the stomach.",
        "optimal_timing": "Immediate pre or post-workout",
        "recommended_dosage": "1 - 2 medium bananas"
    },
    {
        "category": "Whole Foods",
        "name": "Sweet Potatoes",
        "active_nutrients": "Complex Carbs, Beta-Carotene",
        "fitness_benefits": "Sustained glucose release without insulin spikes; high potassium for pumps.",
        "optimal_timing": "Post-heavy lifting meal",
        "recommended_dosage": "150 - 250g cooked"
    },
    {
        "category": "Whole Foods",
        "name": "Eggs (Whole & Whites)",
        "active_nutrients": "Choline, Leucine, Albumen",
        "fitness_benefits": "Gold-standard protein bioavailability, choline supports mind-muscle connection.",
        "optimal_timing": "Breakfast or post-training",
        "recommended_dosage": "3-5 whites / 2 whole eggs"
    },
    {
        "category": "Whole Foods",
        "name": "Almonds & Walnuts",
        "active_nutrients": "Vitamin E, Magnesium, Healthy Fats",
        "fitness_benefits": "Anti-inflammatory, balances anabolic hormones, prolongs fullness on cuts.",
        "optimal_timing": "Snack / Rest day meal",
        "recommended_dosage": "30g handful"
    },
    {
        "category": "Whole Foods",
        "name": "Greek Yogurt",
        "active_nutrients": "Probiotics, Whey + Casein Blend",
        "fitness_benefits": "Supports gut microbiome for better protein absorption; dual protein speed.",
        "optimal_timing": "Snack or post-workout",
        "recommended_dosage": "150 - 200g"
    },
    {
        "category": "Whole Foods",
        "name": "Oats",
        "active_nutrients": "Beta-Glucan, Complex Starch",
        "fitness_benefits": "Low GI carbohydrate source, sustains energy for grueling volume training.",
        "optimal_timing": "Pre-workout (2 hours prior)",
        "recommended_dosage": "50 - 100g dry oats"
    },
    {
        "category": "Recovery Gear",
        "name": "Foam Roller / Lacrosse Ball",
        "active_nutrients": "Myofascial Release",
        "fitness_benefits": "Relieves muscle tightness, increases blood circulation, reduces DOMS intensity.",
        "optimal_timing": "Pre-workout warm-up / Post-session",
        "recommended_dosage": "10-15 mins target areas"
    },
    {
        "category": "Recovery Gear",
        "name": "Lifting Belt & Wrist Wraps",
        "active_nutrients": "Intra-Abdominal Pressure Support",
        "fitness_benefits": "Stabilizes lumbar spine during maximal heavy loads (Squat/Deadlift).",
        "optimal_timing": "Working sets above 80% 1RM",
        "recommended_dosage": "As needed on heavy sets"
    }
]

meals = []
current_group = ""

for line in meals_raw.strip().split("\n"):
    line = line.strip()
    if not line:
        continue
    if line.startswith("[") and line.endswith("]"):
        current_group = line[1:-1]
        continue
    parts = line.split("|")
    if len(parts) >= 12:
        mid, name, cat, cal, c, p, f, vit, alg_pres, alg_avoid, post_wk, benefits = parts[:12]
        ing = parts[12].split(", ") if len(parts) > 12 else []
        
        # Parse allergens present into a list
        if alg_pres == "None":
            allergens_list = []
        else:
            allergens_list = [a.strip() for a in alg_pres.split(",")]
            
        meal_obj = {
            "id": f"{current_group[:3].upper()}-{mid.split('-')[-1]}",
            "source_id": mid,
            "group": current_group,
            "name": name,
            "category": cat,
            "calories": int(cal),
            "carbs": int(c),
            "protein": int(p),
            "fat": int(f),
            "micronutrients": [v.strip() for v in vit.split(",")],
            "allergens_present": allergens_list,
            "allergens_avoided": alg_avoid,
            "recommended_post_workout": post_wk,
            "benefits": benefits,
            "ingredients": ing
        }
        meals.append(meal_obj)

os.makedirs("data", exist_ok=True)

with open("data/meals.json", "w", encoding="utf-8") as f:
    json.dump(meals, f, indent=2, ensure_ascii=False)

with open("data/strategies.json", "w", encoding="utf-8") as f:
    json.dump(strategies_data, f, indent=2, ensure_ascii=False)

with open("data/supplements.json", "w", encoding="utf-8") as f:
    json.dump(supplements_data, f, indent=2, ensure_ascii=False)

print(f"Successfully converted {len(meals)} meals, {len(strategies_data)} strategies, and {len(supplements_data)} supplements/gear items.")
