"""
Build Recipe Steps for all 75 ZAP FIT meals.
Adds prep_time, cook_time, and numbered step-by-step instructions.
Also ensures Vegetarian meals have unique VGT-xx IDs.
"""
import json
import os

RECIPES = {
    # -------------------------------------------------------------
    # VEGAN MEALS (VEG-01 to VEG-15)
    # -------------------------------------------------------------
    "VEG-01": {
        "prep_time": "5 mins",
        "cook_time": "10 mins",
        "steps": [
            "Press firm tofu with a clean kitchen towel to remove excess moisture, then crumble into rustic bite-sized chunks.",
            "Heat 1 tbsp olive oil in a non-stick skillet over medium-high heat; add a pinch of turmeric, salt, and black pepper.",
            "Add the crumbled tofu to the skillet and sauté for 4-5 minutes until heated through and lightly golden.",
            "Add fresh baby spinach and stir gently for 2 minutes until wilted and vibrant green.",
            "Toast whole wheat bread until crisp, plate the hot tofu scramble alongside, and serve immediately."
        ]
    },
    "VEG-02": {
        "prep_time": "3 mins",
        "cook_time": "5 mins",
        "steps": [
            "Bring water or oat milk to a gentle simmer in a small saucepan over medium heat.",
            "Stir in rolled oats and reduce heat to low; cook for 4-5 minutes, stirring occasionally until thick and creamy.",
            "Remove saucepan from heat and allow to cool for 60 seconds (prevents protein powder from curdling).",
            "Whisk in soy protein isolate and chia seeds vigorously until completely smooth and velvety.",
            "Transfer to a recovery bowl, top with fresh mixed berries, and drizzle with a dash of maple syrup if desired."
        ]
    },
    "VEG-03": {
        "prep_time": "10 mins",
        "cook_time": "20 mins",
        "steps": [
            "Rinse quinoa and brown lentils thoroughly in cold water.",
            "Cook quinoa in 2x water for 15 minutes until fluffy; steam or boil lentils until tender but firm.",
            "Whisk tahini with warm water, fresh lemon juice, cumin, and sea salt in a small bowl to make a creamy dressing.",
            "Assemble bowl by layering warm quinoa, cooked lentils, and fresh greens or cucumber slices.",
            "Drizzle creamy tahini dressing generously over the top and garnish with toasted sesame seeds."
        ]
    },
    "VEG-04": {
        "prep_time": "10 mins",
        "cook_time": "25 mins",
        "steps": [
            "Peel and dice sweet potatoes into 1/2-inch cubes; rinse and drain canned chickpeas.",
            "Heat 1 tbsp oil in a pot, add curry powder and cumin, and sauté diced sweet potatoes for 3 minutes.",
            "Pour in light coconut milk or vegetable broth, bring to a simmer, cover and cook for 15 minutes until sweet potatoes are fork-tender.",
            "Stir in chickpeas and baby spinach, simmering uncovered for 5 minutes until the curry sauce thickens.",
            "Serve warm over steamed brown rice for balanced post-workout complex carbs and plant protein."
        ]
    },
    "VEG-05": {
        "prep_time": "5 mins",
        "cook_time": "0 mins",
        "steps": [
            "Thaw shelled edamame beans in warm water for 2 minutes and drain.",
            "Add edamame, frozen banana chunks, pea protein powder, and unsweetened almond milk into a high-speed blender.",
            "Blend on high for 60-90 seconds until thick, velvety, and completely smooth like soft-serve.",
            "Pour into a chilled bowl and smooth the surface with a spatula.",
            "Top with hemp seeds, sliced kiwi or berries, and enjoy cold within 30 minutes post-workout."
        ]
    },
    "VEG-06": {
        "prep_time": "10 mins",
        "cook_time": "12 mins",
        "steps": [
            "Slice seitan into thin bite-sized strips and cut broccoli into small florets.",
            "Heat sesame oil in a wok or large skillet over high heat; sear seitan strips for 4-5 minutes until browned and crispy at the edges.",
            "Toss in broccoli florets and a splash of water, flash-steaming for 3 minutes until tender-crisp.",
            "Stir in low-sodium tamari or soy sauce, grated ginger, and whole roasted cashews.",
            "Toss everything together for 1 minute until glazed, then transfer to a plate and serve hot."
        ]
    },
    "VEG-07": {
        "prep_time": "8 mins",
        "cook_time": "10 mins",
        "steps": [
            "Rinse and drain black beans; warm them in a small pan with ground cumin, paprika, and a pinch of salt.",
            "Warm pre-cooked brown rice or quinoa and scoop into a wide serving bowl.",
            "Dice ripe avocado and prepare fresh sweet corn, diced cherry tomatoes, and chopped cilantro.",
            "Arrange the black beans, avocado, corn, and tomatoes in separate sections over the grain base.",
            "Squeeze fresh lime juice over the avocado and beans, and drizzle with hot sauce or salsa."
        ]
    },
    "VEG-08": {
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "steps": [
            "Slice tempeh into thin triangles and steam for 5 minutes to remove natural bitterness.",
            "Toss steamed tempeh in tamari and olive oil, then pan-sear in a skillet for 4 minutes per side until deeply golden and crispy.",
            "Wash and chop curly kale, massaging with a drop of olive oil and lemon juice to soften leaves.",
            "Layer cooked quinoa into a bowl, arrange crispy tempeh and massaged kale on top.",
            "Finish with a spoonful of pumpkin seeds and a light Dijon-tahini vinaigrette."
        ]
    },
    "VEG-09": {
        "prep_time": "3 mins",
        "cook_time": "5 mins",
        "steps": [
            "Combine rolled oats and plant milk or water in a microwave-safe bowl or small pot on the stove.",
            "Cook for 3-4 minutes until oats are creamy and bubbling.",
            "Stir in 1 scoop of vegan plant protein powder and 2 tablespoons of natural peanut butter while hot.",
            "Slice 1 ripe banana into coins and fold half into the warm oatmeal.",
            "Top with remaining banana slices, a sprinkle of cinnamon, and a few crushed peanuts."
        ]
    },
    "VEG-10": {
        "prep_time": "10 mins",
        "cook_time": "20 mins",
        "steps": [
            "Rinse red lentils (masoor dal) thoroughly until water runs clear.",
            "Add lentils to a pot with water, turmeric, salt, and diced tomatoes; bring to a boil, then simmer covered for 15 minutes until soft and creamy.",
            "In a small tempering pan, heat 1 tsp oil with cumin seeds and mild spices until fragrant; pour over the simmering dal.",
            "Warm whole wheat rotis on a hot tawa or dry skillet for 30 seconds per side.",
            "Garnish dal with freshly chopped coriander and serve hot with soft rotis."
        ]
    },
    "VEG-11": {
        "prep_time": "5 mins",
        "cook_time": "10 mins",
        "steps": [
            "In a mixing bowl, whisk buckwheat flour, hemp protein powder, baking powder, and a pinch of cinnamon.",
            "Pour in almond milk and 1 tsp melted coconut oil, whisking gently until a smooth batter forms.",
            "Heat a non-stick griddle over medium heat and lightly grease with coconut oil.",
            "Pour 1/4 cup batter per pancake and cook for 2-3 minutes until bubbles appear on the surface.",
            "Flip and cook for another 2 minutes until golden; serve stacked with fresh blueberries and 100% pure maple syrup."
        ]
    },
    "VEG-12": {
        "prep_time": "10 mins",
        "cook_time": "25 mins",
        "steps": [
            "Rinse kidney beans and black beans; dice bell peppers and celery.",
            "Heat olive oil in a heavy pot, sauté peppers and celery with chili powder, cumin, and oregano for 4 minutes.",
            "Add crushed canned tomatoes, both beans, and vegetable stock; bring to a simmer.",
            "Reduce heat to low and simmer covered for 18-20 minutes, allowing flavors to meld and sauce to thicken.",
            "Ladle hot chili over a bed of steamed wild rice and top with chopped green onions."
        ]
    },
    "VEG-13": {
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "steps": [
            "Press extra-firm tofu firmly to drain liquid, then cube into 1-inch pieces.",
            "Toss tofu cubes in 1 tsp cornstarch, 1 tsp olive oil, garlic powder, and a pinch of sea salt.",
            "Trim woody ends off fresh asparagus spears and toss with light olive oil and lemon zest.",
            "Air fry tofu at 200°C (390°F) for 12 minutes, shaking basket halfway through until ultra-crisp.",
            "Add asparagus for the final 4 minutes of cooking; plate together with a squeeze of fresh lemon."
        ]
    },
    "VEG-14": {
        "prep_time": "8 mins",
        "cook_time": "12 mins",
        "steps": [
            "Toss drained chickpeas with smoked paprika, cumin, garlic powder, and olive oil.",
            "Roast in an air fryer or skillet for 10-12 minutes until crunchy and golden.",
            "Warm a whole wheat or gluten-free tortilla wrap on a dry skillet for 20 seconds.",
            "Spread mashed avocado over the center of the tortilla, top with crunchy roasted chickpeas, and shredded lettuce.",
            "Roll tightly, slice diagonally in half, and serve as an energy-dense recovery wrap."
        ]
    },
    "VEG-15": {
        "prep_time": "5 mins",
        "cook_time": "0 mins",
        "steps": [
            "In a mason jar or glass bowl, whisk chia seeds with unsweetened vanilla almond milk and plant protein powder.",
            "Whisk thoroughly for 2 minutes to ensure no clumps settle at the bottom.",
            "Refrigerate for at least 30 minutes (or prepare overnight) until it sets into a thick, luxurious pudding.",
            "Stir once more to check consistency; add an extra splash of almond milk if too thick.",
            "Top with fresh raspberries, sliced almonds, and a dusting of cinnamon before eating."
        ]
    },

    # -------------------------------------------------------------
    # VEGETARIAN MEALS (VGT-01 to VGT-15)
    # -------------------------------------------------------------
    "VGT-01": {
        "prep_time": "5 mins",
        "cook_time": "0 mins",
        "steps": [
            "Scoop thick, high-protein plain Greek yogurt into a glass parfait jar or wide bowl.",
            "Drizzle with 1 tablespoon of raw organic honey or maple syrup.",
            "Layer with crisp toasted oat granola for sustained carbohydrate release.",
            "Top with a generous handful of fresh blueberries and sliced strawberries.",
            "Sprinkle with chia seeds or crushed walnuts for essential recovery fatty acids."
        ]
    },
    "VGT-02": {
        "prep_time": "10 mins",
        "cook_time": "10 mins",
        "steps": [
            "Cut fresh low-fat paneer into 1/2-inch cubes; slice bell peppers, onions, and zucchini.",
            "Heat 1 tbsp olive oil in a non-stick pan over medium-high heat and sear paneer cubes for 3 minutes until golden brown on all sides.",
            "Remove paneer to a plate; toss vegetables into the same pan with minced garlic and oregano.",
            "Stir-fry veggies briskly for 4 minutes over high heat until tender-crisp.",
            "Return paneer cubes to the pan, toss with black pepper and soy sauce or lemon juice, and serve steaming hot."
        ]
    },
    "VGT-03": {
        "prep_time": "5 mins",
        "cook_time": "6 mins",
        "steps": [
            "Separate 4 egg whites (or pour 150ml liquid egg whites) into a bowl, whisking with a pinch of sea salt and pepper.",
            "Heat a non-stick pan with a quick spray of olive oil over medium heat.",
            "Add fresh baby spinach leaves and cook for 1 minute until wilted.",
            "Pour egg whites evenly over the spinach; cook gently until edges set, then fold in half.",
            "Toast two slices of 100% whole grain bread; slide omelet onto plate alongside toast."
        ]
    },
    "VGT-04": {
        "prep_time": "3 mins",
        "cook_time": "0 mins",
        "steps": [
            "Add 300ml cold milk (or water) and 1/2 cup quick rolled oats into a blender jar.",
            "Pulse oats with the liquid for 20 seconds to create a smooth oat milk base.",
            "Add 1 scoop of premium whey protein isolate (vanilla or chocolate) and 1 tbsp creamy almond butter.",
            "Add 3-4 ice cubes and blend on high for 45 seconds until thick and frothy.",
            "Pour into a shaker bottle and consume within 45 minutes of training for rapid amino acid delivery."
        ]
    },
    "VGT-05": {
        "prep_time": "8 mins",
        "cook_time": "10 mins",
        "steps": [
            "In a bowl, mix oat flour, 1 scoop vanilla whey protein, baking powder, and skim milk into a smooth batter.",
            "In a separate small bowl, fold fresh blueberries and a drop of vanilla extract into low-fat ricotta cheese.",
            "Pour 3-inch circles of batter onto a hot lightly greased griddle.",
            "Place a spoonful of ricotta-blueberry mixture in the center of each pancake, then cover with a thin layer of batter.",
            "Flip after 2-3 minutes when bubbles burst, cook 2 more minutes until golden, and serve warm."
        ]
    },
    "VGT-06": {
        "prep_time": "15 mins",
        "cook_time": "15 mins",
        "steps": [
            "Cube paneer and bell peppers; coat in a marinade of thick yogurt, garam masala, turmeric, Kashmiri chili, and lemon juice for 10 minutes.",
            "Cook quinoa with a pinch of turmeric and cumin seeds in water until fluffy to make the golden pilaf.",
            "Thread marinated paneer and peppers onto skewers or place on a baking tray / air fryer.",
            "Grill at 200°C (400°F) for 10-12 minutes until charred at the edges and aromatic.",
            "Slide paneer tikka onto the bed of hot quinoa pilaf and garnish with mint leaves and lemon wedges."
        ]
    },
    "VGT-07": {
        "prep_time": "4 mins",
        "cook_time": "5 mins",
        "steps": [
            "Crack 3 whole eggs into a bowl; beat with 1 tbsp milk, salt, and cracked black pepper.",
            "Melt 1 tsp butter or heat olive oil in a small pan over medium-low heat.",
            "Pour in eggs and let sit for 20 seconds; use a silicone spatula to gently sweep eggs from edges to center into soft curds.",
            "Take off heat while eggs are still soft and glossy; fold in 2 tbsp grated cheddar or feta cheese.",
            "Plate alongside sliced ripe avocado and a side of whole grain toast."
        ]
    },
    "VGT-08": {
        "prep_time": "10 mins",
        "cook_time": "8 mins",
        "steps": [
            "Slice halloumi cheese into 1/4-inch thick slabs and pat dry with paper towels.",
            "Sear halloumi in a dry non-stick skillet over medium-high heat for 2-3 minutes per side until deeply golden and crispy.",
            "In a large salad bowl, combine cooked brown or green lentils, mixed baby greens, and halved cherry tomatoes.",
            "Toss salad with extra virgin olive oil, lemon juice, and chopped fresh mint.",
            "Top with warm seared halloumi slices and freshly ground black pepper."
        ]
    },
    "VGT-09": {
        "prep_time": "4 mins",
        "cook_time": "0 mins",
        "steps": [
            "Spoon 200g of thick Icelandic Skyr yogurt into a wide recovery bowl.",
            "Peel and dice ripe sweet mango into juicy cubes.",
            "Arrange diced mango over half the yogurt bowl.",
            "Top the other half with raw pumpkin seeds and hemp hearts for zinc, magnesium, and healthy fats.",
            "Drizzle with a teaspoon of honey or passionfruit pulp and serve immediately."
        ]
    },
    "VGT-10": {
        "prep_time": "4 mins",
        "cook_time": "0 mins",
        "steps": [
            "Scoop low-fat cottage cheese (paneer curd) into a bowl.",
            "Cut fresh pineapple into bite-sized wedges (natural bromelain aids muscle inflammation recovery).",
            "Arrange juicy pineapple chunks on top of the creamy cottage cheese.",
            "Sprinkle with a dusting of cinnamon and toasted slivered almonds for crunch.",
            "Eat chilled for an ultra-fast, 30g slow-digesting casein protein recovery boost."
        ]
    },
    "VGT-11": {
        "prep_time": "5 mins",
        "cook_time": "6 mins",
        "steps": [
            "Whisk 2 eggs with a pinch of salt and scramble in a skillet until just set; remove to a plate.",
            "Place a large whole wheat tortilla flat in the skillet over medium heat.",
            "Scatter half the shredded cheese (cheddar/mozzarella) over one half of the tortilla, top with scrambled eggs and salsa, then add remaining cheese.",
            "Fold the tortilla in half over the filling and press gently with a spatula.",
            "Cook for 2-3 minutes per side until the tortilla is golden-crisp and cheese is fully melted; cut into wedges."
        ]
    },
    "VGT-12": {
        "prep_time": "10 mins",
        "cook_time": "10 mins",
        "steps": [
            "Use cold pre-cooked jasmine or brown rice (day-old rice fries best).",
            "Heat sesame oil in a wok over high heat; sauté diced carrots, peas, and green onions for 3 minutes.",
            "Push vegetables to the side of the wok; pour 150ml liquid egg whites into the empty side and scramble briskly.",
            "Add the cold rice, drizzle with low-sodium soy sauce, garlic powder, and a dash of white pepper.",
            "Toss vigorously over high heat for 3 minutes until steaming hot and evenly mixed."
        ]
    },
    "VGT-13": {
        "prep_time": "8 mins",
        "cook_time": "10 mins",
        "steps": [
            "Preheat waffle maker and lightly spray plates with avocado oil.",
            "In a bowl, mix oat flour, whey protein isolate, 1 egg, baking powder, and Greek yogurt until thick batter forms.",
            "Pour batter into hot waffle iron and cook for 4-5 minutes until steam stops and waffle is golden-crisp.",
            "In a small saucepan, warm mixed berries with 1 tsp maple syrup for 3 minutes until syrupy compote forms.",
            "Plate warm waffles, top with an extra dollop of Greek yogurt, and spoon warm berry compote over top."
        ]
    },
    "VGT-14": {
        "prep_time": "5 mins",
        "cook_time": "6 mins",
        "steps": [
            "Whisk 3 eggs with sea salt and cracked black pepper until frothy.",
            "Dice ripe Roma tomatoes and shred fresh low-moisture mozzarella; tear fresh basil leaves.",
            "Heat 1 tsp olive oil in a non-stick pan over medium heat, pour in eggs, and tilt pan to coat bottom evenly.",
            "When eggs are almost set, lay diced tomatoes, torn basil, and shredded mozzarella across half the omelet.",
            "Fold omelet in half, cover pan for 60 seconds to melt cheese, and slide onto plate."
        ]
    },
    "VGT-15": {
        "prep_time": "3 mins",
        "cook_time": "5 mins",
        "steps": [
            "Whisk 50g Cream of Rice cereal with 250ml boiling water in a bowl until thick and smooth (or microwave for 90 seconds).",
            "In a shaker cup, shake 1 scoop whey isolate with 100ml cold water until dissolved.",
            "Pour the smooth whey mixture into the warm rice cream, stirring thoroughly until creamy.",
            "Swirl in 1 teaspoon of almond butter or dark cocoa powder.",
            "Enjoy immediately as the ultimate rapid-digesting post-workout glycogen & muscle repair meal."
        ]
    },

    # -------------------------------------------------------------
    # NON-VEGETARIAN MEALS (NON-01 to NON-15)
    # -------------------------------------------------------------
    "NON-01": {
        "prep_time": "10 mins",
        "cook_time": "18 mins",
        "steps": [
            "Poke sweet potato with a fork and microwave for 6-8 minutes until soft, or roast at 200°C for 25 minutes.",
            "Season chicken breast with olive oil, smoked paprika, garlic powder, sea salt, and black pepper.",
            "Preheat a grill pan or cast iron skillet over medium-high heat; sear chicken for 6-7 minutes per side until internal temperature reaches 75°C (165°F).",
            "Steam fresh broccoli florets for 4-5 minutes until bright green and tender-crisp.",
            "Slice grilled chicken breast, halve the steamed sweet potato, and serve together on an athlete recovery plate."
        ]
    },
    "NON-02": {
        "prep_time": "8 mins",
        "cook_time": "12 mins",
        "steps": [
            "Pat fresh salmon fillet dry with paper towels; season skin and flesh generously with sea salt, pepper, and lemon pepper.",
            "Heat 1 tbsp olive oil in a stainless steel or cast-iron skillet over medium-high heat until shimmering.",
            "Place salmon skin-side down, press down lightly for 10 seconds, and sear for 5-6 minutes until skin is crackling-crisp.",
            "Flip salmon and add asparagus spears to the pan; cook for 3-4 minutes until salmon is tender and asparagus is charred.",
            "Serve seared salmon and asparagus over a bed of warm cooked quinoa with a squeeze of fresh lemon."
        ]
    },
    "NON-03": {
        "prep_time": "8 mins",
        "cook_time": "12 mins",
        "steps": [
            "Heat a skillet over medium-high heat; add 90%+ lean ground beef, breaking it up with a wooden spoon.",
            "Season beef with ground cumin, onion powder, garlic powder, soy sauce, and sea salt.",
            "Cook for 7-8 minutes until beef is nicely browned and juices run clear; drain any excess fat if desired.",
            "Scoop warm steamed jasmine white rice into a recovery bowl.",
            "Top rice with the seasoned ground beef, sliced cucumber, pickled ginger, and a sprinkle of green onions."
        ]
    },
    "NON-04": {
        "prep_time": "6 mins",
        "cook_time": "0 mins",
        "steps": [
            "Lay a large whole wheat tortilla flat on a clean cutting board.",
            "Spread 1 tablespoon of hummus or Greek yogurt dressing down the center third of the wrap.",
            "Layer 150g sliced lean roasted turkey breast evenly across the dressing.",
            "Top with crisp romaine lettuce leaves, thinly sliced tomatoes, and cucumber ribbons.",
            "Fold the sides in, roll up tightly from the bottom, and slice diagonally for an on-the-go recovery fuel wrap."
        ]
    },
    "NON-05": {
        "prep_time": "6 mins",
        "cook_time": "0 mins",
        "steps": [
            "Drain 1 can of solid albacore tuna packed in spring water and flake into a mixing bowl.",
            "Add 1 tbsp extra virgin olive oil, 1 tsp Dijon mustard, chopped celery for crunch, and fresh lemon juice.",
            "Season with sea salt, cracked black pepper, and chopped fresh dill or parsley; mix well.",
            "Spoon tuna salad onto a plate alongside crisp seeded whole grain crackers.",
            "Garnish with lemon wedges and sliced cherry tomatoes for an instant high-protein lunch."
        ]
    },
    "NON-06": {
        "prep_time": "8 mins",
        "cook_time": "15 mins",
        "steps": [
            "Preheat oven to 190°C (375°F) and grease 4 silicone muffin cups.",
            "Cook turkey bacon strips in a skillet until crisp, then chop into bite-sized bits.",
            "Whisk 3 eggs with 2 tbsp milk, sea salt, pepper, and finely chopped spinach.",
            "Distribute turkey bacon and spinach evenly among muffin cups, then pour whisked egg mixture to 3/4 full.",
            "Bake for 14-16 minutes until muffins are puffed, set, and golden; enjoy warm or store for meal prep."
        ]
    },
    "NON-07": {
        "prep_time": "10 mins",
        "cook_time": "6 mins",
        "steps": [
            "Peel and devein fresh shrimp; toss with chili powder, cumin, lime juice, olive oil, and sea salt.",
            "Heat a skillet over high heat; sear shrimp for 2 minutes per side until pink, plump, and slightly charred.",
            "Warm corn tortillas directly over a low flame or dry pan for 20 seconds each until pliable.",
            "Divide grilled shrimp across 3 warm corn tortillas.",
            "Top with shredded purple cabbage, diced avocado, chopped cilantro, and a drizzle of lime crema."
        ]
    },
    "NON-08": {
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "steps": [
            "Boil cubed sweet potatoes in salted water for 12 minutes until soft; drain and mash with a touch of butter, cinnamon, and salt.",
            "Take lean sirloin or flank steak out of fridge 15 minutes before cooking; season liberally with coarse salt and black pepper.",
            "Sear steak in a smoking hot cast-iron skillet with 1 tsp oil for 3-4 minutes per side (medium-rare to medium).",
            "Transfer steak to a cutting board and let rest for 5 minutes to lock in juices.",
            "Slice steak across the grain and plate alongside fluffy sweet potato mash and steamed greens."
        ]
    },
    "NON-09": {
        "prep_time": "8 mins",
        "cook_time": "12 mins",
        "steps": [
            "Pat cod fillets dry with paper towels; season with paprika, garlic powder, salt, and fresh black pepper.",
            "Heat 1 tbsp olive oil and 1 tsp butter in a non-stick skillet over medium heat.",
            "Add cod fillets and cook for 4-5 minutes on the first side without moving until a golden crust forms.",
            "Gently flip cod and toss fresh green beans into the pan; cook 3-4 minutes until cod flakes easily with a fork.",
            "Serve cod and sautéed green beans over steamed brown rice with fresh lemon slices."
        ]
    },
    "NON-10": {
        "prep_time": "12 mins",
        "cook_time": "15 mins",
        "steps": [
            "In a pot, bring chicken bone broth to a simmer with star anise, a cinnamon stick, sliced ginger, and fish sauce.",
            "Simmer broth gently for 10 minutes to infuse aromatics, then remove whole spices.",
            "Cook flat rice noodles in boiling water for 3-4 minutes according to package; rinse in cold water and drain into deep bowls.",
            "Add thinly sliced cooked chicken breast over the noodles, then ladle boiling broth directly over the chicken.",
            "Top with bean sprouts, fresh Thai basil, sliced red chilies, and a squeeze of fresh lime juice."
        ]
    },
    "NON-11": {
        "prep_time": "10 mins",
        "cook_time": "20 mins",
        "steps": [
            "Dice baby red potatoes into 3/4-inch pieces, toss with olive oil, rosemary, and salt, and roast at 200°C for 20 minutes.",
            "Season fresh tilapia fillets with lemon pepper seasoning, garlic powder, and a pinch of paprika.",
            "Heat a skillet with 1 tsp olive oil over medium-high heat; cook tilapia for 3 minutes per side until opaque and flaky.",
            "Plate golden roasted potatoes alongside the tender tilapia fillets.",
            "Garnish with chopped fresh parsley and lemon wedges."
        ]
    },
    "NON-12": {
        "prep_time": "8 mins",
        "cook_time": "10 mins",
        "steps": [
            "Shape lean ground bison into a 1/2-inch thick burger patty; season both sides with salt, pepper, and Worcestershire sauce.",
            "Heat a cast iron skillet over medium-high heat with a light film of avocado oil.",
            "Sear bison patty for 4 minutes on the first side, flip, and cook 3-4 minutes on the second side (avoid overcooking bison as it is very lean).",
            "Let patty rest for 3 minutes while scooping warm jasmine white rice into a bowl.",
            "Plate bison patty over the white rice with a side of steamed broccoli or roasted carrots."
        ]
    },
    "NON-13": {
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "steps": [
            "Dice chicken tenderloins or breast into bite-sized 1-inch cubes.",
            "Heat 1 tbsp olive oil in a skillet; sauté chicken with garlic powder, thyme, and sea salt for 6-8 minutes until cooked through.",
            "Cook easy-to-digest white jasmine rice until fluffy and tender.",
            "Spoon generous warm white rice into an athlete recovery bowl and top with the seasoned chicken breast cubes.",
            "Drizzle with a light teriyaki glaze or low-sodium tamari and sprinkle with toasted sesame seeds."
        ]
    },
    "NON-14": {
        "prep_time": "6 mins",
        "cook_time": "6 mins",
        "steps": [
            "Pat yellowfin or ahi tuna steak dry; brush with sesame oil and roll edges in mixed black and white sesame seeds.",
            "Heat a heavy cast iron skillet over high heat until smoking hot.",
            "Sear tuna for precisely 60-90 seconds per side, leaving the center cool and vibrant ruby-pink.",
            "Transfer tuna to a cutting board and slice into 1/4-inch thick sashimi-style ribbons.",
            "Serve over warm steamed wild rice with a side of wasabi and low-sodium tamari."
        ]
    },
    "NON-15": {
        "prep_time": "12 mins",
        "cook_time": "18 mins",
        "steps": [
            "In a bowl, combine lean ground turkey, Italian herb seasoning, 1 egg white, garlic powder, and breadcrumbs or almond flour.",
            "Roll into 12 evenly-sized meatballs.",
            "Brown meatballs in an oiled skillet over medium heat for 6 minutes until lightly browned all around.",
            "Pour in marinara pasta sauce, cover skillet, and simmer for 10-12 minutes until meatballs are cooked through.",
            "Boil whole wheat spaghetti until al dente; plate pasta, top with meatballs and warm marinara sauce, and garnish with fresh basil."
        ]
    },

    # -------------------------------------------------------------
    # JAIN MEALS (JAI-01 to JAI-15, strictly NO onion, garlic, or root veggies)
    # -------------------------------------------------------------
    "JAI-01": {
        "prep_time": "10 mins",
        "cook_time": "20 mins",
        "steps": [
            "Rinse split yellow moong dal until water runs crystal clear.",
            "Boil moong dal in a pot with water, turmeric powder, chopped tomatoes, and salt for 15 minutes until soft and creamy.",
            "Cook washed quinoa in 2x water for 12 minutes until tender and fluffy.",
            "In a small pan, prepare Jain tempering: heat ghee or oil, add cumin seeds, hing (asafoetida), and mild green chili until sizzling.",
            "Pour hot tempering into the dal, stir well, and serve steaming hot with fluffy quinoa."
        ]
    },
    "JAI-02": {
        "prep_time": "15 mins",
        "cook_time": "15 mins",
        "steps": [
            "Boil raw green bananas with peel on for 10 minutes until tender; peel and mash thoroughly.",
            "In a bowl, combine mashed raw banana, boiled chickpeas (coarsely crushed), cumin powder, amchur (dry mango powder), and rock salt.",
            "Shape mixture into flat burger patties and shallow-fry on a tawa with 1 tsp oil for 4 minutes per side until crisp.",
            "Warm a whole wheat paratha or tortilla on the tawa.",
            "Place the hot patty inside the wrap, add shredded cucumber and tomato slices, fold, and serve."
        ]
    },
    "JAI-03": {
        "prep_time": "10 mins",
        "cook_time": "25 mins",
        "steps": [
            "Rinse black-eyed peas (lobiya) and pressure cook or boil with water and salt for 15 minutes until tender.",
            "In a pot, heat oil and add cumin seeds, hing (asafoetida), and pureed fresh tomatoes.",
            "Add coriander powder, turmeric, and Kashmiri red chili powder; cook masala for 5 minutes until oil separates.",
            "Add cooked black-eyed peas along with their broth; simmer covered for 10 minutes to allow flavors to absorb.",
            "Serve hot with steamed white or brown rice and fresh coriander garnish."
        ]
    },
    "JAI-04": {
        "prep_time": "8 mins",
        "cook_time": "10 mins",
        "steps": [
            "Cut firm tofu and colorful capsicums (green, yellow, red bell peppers) into uniform bite-sized cubes.",
            "Heat sesame oil in a non-stick wok over medium-high heat; add cumin seeds and hing.",
            "Add tofu cubes and stir-fry for 4 minutes until exterior turns light golden.",
            "Toss in sliced capsicum cubes and stir-fry briskly for 3 minutes to keep them crisp and colorful.",
            "Season with rock salt, black pepper, and toasted white sesame seeds; serve immediately."
        ]
    },
    "JAI-05": {
        "prep_time": "5 mins",
        "cook_time": "15 mins",
        "steps": [
            "Rinse whole grain amaranth (rajgira) in a fine mesh sieve.",
            "Add amaranth to a small pot with 2 cups of unsweetened almond milk and a pinch of cardamom powder.",
            "Bring to a boil, then reduce heat to low and simmer covered for 15 minutes, stirring occasionally until creamy.",
            "Remove from heat and sweeten with pure jaggery syrup or date puree.",
            "Top with toasted almond flakes and chia seeds for a warm, energizing post-workout meal."
        ]
    },
    "JAI-06": {
        "prep_time": "8 mins",
        "cook_time": "10 mins",
        "steps": [
            "Crumble fresh paneer with your fingers into small uneven curds.",
            "Heat 1 tsp ghee in a skillet; splutter cumin seeds and a pinch of hing (asafoetida).",
            "Add finely chopped tomatoes and green chili; cook for 3 minutes until tomatoes soften into a puree.",
            "Add turmeric, salt, and crumbled paneer; toss over medium heat for 2-3 minutes (avoid overcooking paneer).",
            "Garnish with chopped fresh coriander and serve hot with fresh whole wheat parathas."
        ]
    },
    "JAI-07": {
        "prep_time": "10 mins",
        "cook_time": "10 mins",
        "steps": [
            "Blend soaked yellow moong dal with green chili, hing, and rock salt into a smooth pourable batter.",
            "Heat a flat non-stick tawa or skillet and grease lightly with oil.",
            "Pour a ladle of batter in the center and spread in circular motion to form a thin, crisp chilla (savory crepe).",
            "Cook for 2 minutes until underside is golden, flip and cook for 1 minute.",
            "Spread seasoned crumbled paneer and chopped tomatoes on one half, fold over, and serve crisp."
        ]
    },
    "JAI-08": {
        "prep_time": "8 mins",
        "cook_time": "15 mins",
        "steps": [
            "Rinse buckwheat groats (kuttu) thoroughly and drain.",
            "Heat 1 tsp ghee in a pressure cooker or pot; add cumin seeds and hing.",
            "Add chopped tomatoes and buckwheat groats, roasting for 2 minutes until fragrant.",
            "Add 2 cups of water and rock salt; cook covered for 10 minutes until buckwheat is soft and tender.",
            "Fold in fresh low-fat cottage cheese (paneer) cubes and chopped coriander right before serving."
        ]
    },
    "JAI-09": {
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "steps": [
            "Peel raw green banana and cube into bite-sized pieces; steam or boil for 8 minutes until fork-tender.",
            "Heat oil in a pan, add mustard seeds, curry leaves, and chopped tomatoes; sauté into a rich tangy gravy.",
            "Toss boiled raw banana cubes into the tomato gravy and simmer for 4 minutes.",
            "Layer warm cooked basmati rice into a recovery bowl, top with the tangy banana-tomato masala.",
            "Serve with a side of cool fresh homemade curd (yogurt) for gut health and protein balance."
        ]
    },
    "JAI-10": {
        "prep_time": "6 mins",
        "cook_time": "0 mins",
        "steps": [
            "Dice fresh, tender cottage cheese (paneer) and crisp English cucumber into small cubes.",
            "Halve juicy cherry tomatoes and chop fresh mint leaves.",
            "In a salad bowl, toss paneer, cucumber, and tomatoes together.",
            "Whisk lemon juice, roasted cumin powder, black pepper, and rock salt (sendha namak) into a light dressing.",
            "Pour dressing over salad, toss gently, and enjoy chilled as an ultra-refreshing recovery meal."
        ]
    },
    "JAI-11": {
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "steps": [
            "Season boneless chicken breast with ground cumin, coriander powder, black pepper, and rock salt (no onion/garlic).",
            "Place seasoned chicken breast and sliced bell capsicums in a steamer basket over boiling water.",
            "Cover and steam for 14-16 minutes until chicken is completely tender and juices run clear.",
            "Slice steamed chicken breast diagonally into medallions.",
            "Plate alongside steamed white jasmine rice and tender steamed capsicums with a drizzle of lemon-infused oil."
        ]
    },
    "JAI-12": {
        "prep_time": "8 mins",
        "cook_time": "10 mins",
        "steps": [
            "Pat fresh white fish fillet dry; rub with turmeric, lemon juice, roasted cumin powder, and sea salt.",
            "Heat 1 tbsp oil in a non-stick skillet over medium-high heat.",
            "Gently place fish fillet in pan and sear undisturbed for 4 minutes until golden on the bottom.",
            "Flip fillet and cook for another 3 minutes until flaky, tender, and moist throughout.",
            "Serve immediately over fluffy steamed rice with fresh lemon wedges."
        ]
    },
    "JAI-13": {
        "prep_time": "10 mins",
        "cook_time": "18 mins",
        "steps": [
            "In a shallow pan, bring salted water with fresh thyme sprigs and lemon slices to a bare simmer (about 80°C / 175°F).",
            "Submerge lean turkey breast fillets into the poaching liquid, cover pan, and poach gently for 15 minutes.",
            "Meanwhile, steam cubed fresh zucchini until tender; drain and mash with a fork, seasoning with salt and olive oil.",
            "Remove turkey breast and slice into tender cutlets.",
            "Serve tender poached turkey over warm zucchini mash for an ultra-lean, easy-to-digest recovery dinner."
        ]
    },
    "JAI-14": {
        "prep_time": "5 mins",
        "cook_time": "5 mins",
        "steps": [
            "Whisk 4 egg whites with rock salt, cracked black pepper, and dried oregano in a small bowl.",
            "Heat a non-stick skillet with a drop of olive oil over medium heat.",
            "Add finely diced ripe tomatoes and sauté for 1 minute until warmed through.",
            "Pour whisked egg whites into the pan; gently fold with a spatula from outer edge to center for 2 minutes until softly scrambled.",
            "Garnish with chopped fresh coriander or parsley and serve warm."
        ]
    },
    "JAI-15": {
        "prep_time": "10 mins",
        "cook_time": "12 mins",
        "steps": [
            "Trim lamb chops; rub with olive oil, crushed cumin seeds, dried rosemary, and rock salt.",
            "Preheat a cast-iron grill pan over high heat until smoking hot.",
            "Grill lamb chops for 4-5 minutes on the first side, flip, and grill for 3-4 minutes on the second side until browned.",
            "Transfer chops to a plate, tent loosely with foil, and rest for 4 minutes to redistribute juices.",
            "Serve succulent lamb chops alongside warm steamed rice and fresh mint sprigs."
        ]
    },

    # -------------------------------------------------------------
    # ALLERGEN-FREE MEALS (ALL-01 to ALL-15)
    # -------------------------------------------------------------
    "ALL-01": {
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "steps": [
            "Rinse certified gluten-free quinoa thoroughly under cold water; cook in 2x water for 12 minutes until fluffy.",
            "Rinse and drain canned black beans; warm gently in a pan with cumin, sea salt, and a splash of lime juice.",
            "Cube roasted sweet potato and avocado.",
            "Assemble bowl with quinoa base, warm black beans, sweet potato cubes, and avocado slices.",
            "Drizzle with cold-pressed olive oil and lime juice; sprinkle with pumpkin seeds for allergen-free crunch."
        ]
    },
    "ALL-02": {
        "prep_time": "10 mins",
        "cook_time": "20 mins",
        "steps": [
            "Peel and dice sweet potatoes into 1/2-inch cubes; rinse and drain chickpeas.",
            "Heat olive oil in a soup pot, add diced sweet potatoes and ground turmeric, cumin, and salt.",
            "Pour in vegetable broth, cover, and simmer for 12 minutes until sweet potatoes are soft.",
            "Add chickpeas and fresh baby spinach leaves; simmer for another 5 minutes until spinach wilts into the stew.",
            "Ladle into a bowl and serve warm with a squeeze of fresh lemon."
        ]
    },
    "ALL-03": {
        "prep_time": "5 mins",
        "cook_time": "10 mins",
        "steps": [
            "Rinse buckwheat groats in cold water.",
            "Combine buckwheat groats with water or unsweetened coconut milk in a small saucepan.",
            "Bring to a boil, then reduce heat to low and simmer for 10 minutes until soft and porridge consistency.",
            "Stir in 1 tablespoon of pure maple syrup and a pinch of cinnamon.",
            "Top with fresh wild blueberries and blackberries for potent recovery antioxidants."
        ]
    },
    "ALL-04": {
        "prep_time": "8 mins",
        "cook_time": "20 mins",
        "steps": [
            "Rinse yellow split peas thoroughly.",
            "In a pot, bring yellow split peas, water, turmeric, and sea salt to a boil; simmer covered for 18 minutes until tender and creamy.",
            "Steam long-grain white or brown rice in a separate pot until light and fluffy.",
            "Heat 1 tsp olive oil with whole cumin seeds until fragrant; pour over the simmering yellow split dahl.",
            "Ladle warm dahl over the steamed rice and garnish with fresh cilantro."
        ]
    },
    "ALL-05": {
        "prep_time": "5 mins",
        "cook_time": "0 mins",
        "steps": [
            "Place frozen bananas, hemp seed protein powder, and pure coconut water into a blender.",
            "Blend on high speed for 60 seconds until thick, silky, and frost-like.",
            "Pour into a chilled serving bowl.",
            "Top with raw pumpkin seeds, toasted coconut flakes, and fresh raspberries.",
            "Enjoy cold immediately for pure hypoallergenic hydration and amino acids."
        ]
    },
    "ALL-06": {
        "prep_time": "4 mins",
        "cook_time": "0 mins",
        "steps": [
            "Spoon allergen-screened plain cottage cheese into a bowl.",
            "Dice fresh sweet pineapple into bite-sized chunks.",
            "Arrange juicy pineapple chunks over the cottage cheese.",
            "Sprinkle with ground flaxseed for omega-3 anti-inflammatory benefits.",
            "Serve cold as a quick, refreshing, 28g protein snack."
        ]
    },
    "ALL-07": {
        "prep_time": "5 mins",
        "cook_time": "6 mins",
        "steps": [
            "Separate 4 egg whites into a clean bowl; whisk with a pinch of sea salt and pepper.",
            "Lightly spray a non-stick skillet with olive oil over medium heat.",
            "Add fresh baby spinach and stir for 60 seconds until just wilted.",
            "Pour egg whites over the spinach; let cook undisturbed for 3 minutes until set, then fold in half.",
            "Slide onto plate alongside crisp whole brown rice cakes."
        ]
    },
    "ALL-08": {
        "prep_time": "3 mins",
        "cook_time": "0 mins",
        "steps": [
            "Add 300ml cold water or coconut water to a blender jar.",
            "Add 1 scoop certified hypoallergenic brown rice protein powder and 1 cup frozen mixed berries.",
            "Add 1 tablespoon of chia seeds and 3 ice cubes.",
            "Blend on high speed for 45-60 seconds until smooth, purple, and creamy.",
            "Drink within 30 minutes post-workout for fast glycogen and muscle recovery."
        ]
    },
    "ALL-09": {
        "prep_time": "3 mins",
        "cook_time": "0 mins",
        "steps": [
            "Scoop low-fat cottage cheese into a bowl.",
            "Toast raw pumpkin seeds in a dry pan for 2 minutes until lightly puffed.",
            "Scatter toasted pumpkin seeds and sunflower seeds over the cottage cheese.",
            "Drizzle with 1 teaspoon of raw organic honey.",
            "Eat immediately for a crunch-filled, slow-release recovery bowl."
        ]
    },
    "ALL-10": {
        "prep_time": "2 mins",
        "cook_time": "0 mins",
        "steps": [
            "Add 250ml cold water and 1 ripe peeled banana into a blender.",
            "Add 1 scoop ultra-filtered whey protein isolate (certified gluten-free, soy-free, nut-free).",
            "Add a couple of ice cubes and blend for 30 seconds until frothy and smooth.",
            "Pour into a glass or shaker cup.",
            "Consume immediately after heavy resistance training for rapid muscle protein synthesis."
        ]
    },
    "ALL-11": {
        "prep_time": "10 mins",
        "cook_time": "18 mins",
        "steps": [
            "Steam or bake sweet potato until completely fork-tender; mash with a fork using 1 tsp olive oil and sea salt.",
            "Season skinless chicken breast with oregano, sea salt, black pepper, and olive oil.",
            "Grill chicken in a ridged grill pan over medium-high heat for 6-7 minutes per side until cooked through.",
            "Rest chicken for 3 minutes to keep meat moist, then slice into strips.",
            "Plate grilled chicken alongside warm sweet potato mash and steamed green beans."
        ]
    },
    "ALL-12": {
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "steps": [
            "Brown lean ground turkey in a skillet over medium heat with sea salt, thyme, and sage for 8 minutes until cooked through.",
            "Steam or roast peeled pumpkin or butternut squash cubes until tender.",
            "Cook steamed white rice until fluffy.",
            "Assemble bowl by layering white rice, seasoned ground turkey, and sweet roasted pumpkin.",
            "Drizzle with cold-pressed olive oil and enjoy warm."
        ]
    },
    "ALL-13": {
        "prep_time": "8 mins",
        "cook_time": "10 mins",
        "steps": [
            "Form lean ground beef into a 1/2-inch thick patty; season with coarse sea salt and black pepper.",
            "Slice carrots into coins and steam for 6-7 minutes until tender.",
            "Sear beef patty in a skillet over medium-high heat for 4 minutes per side until nicely browned.",
            "Warm steamed white jasmine rice in a bowl.",
            "Plate beef patty over the rice with tender steamed carrots on the side."
        ]
    },
    "ALL-14": {
        "prep_time": "10 mins",
        "cook_time": "18 mins",
        "steps": [
            "Score the skin of lean duck breast in a diamond pattern; season with sea salt and cracked pepper.",
            "Place duck skin-side down in a cold skillet; turn heat to medium-low to render fat for 10-12 minutes.",
            "Flip duck breast and cook flesh side for 3-4 minutes; transfer to a board to rest for 5 minutes.",
            "Dice roasted beetroot and toss with olive oil and sea salt.",
            "Slice duck breast thinly and serve over steamed wild rice with roasted beetroot."
        ]
    },
    "ALL-15": {
        "prep_time": "10 mins",
        "cook_time": "18 mins",
        "steps": [
            "Season lean pork tenderloin medallion with sea salt, sage, and black pepper.",
            "Heat 1 tbsp olive oil in an oven-safe skillet; sear pork for 2 minutes per side until golden.",
            "Transfer skillet to a 190°C (375°F) oven and bake for 12 minutes until internal temperature hits 63°C (145°F); rest for 5 minutes.",
            "Warm unsweetened natural applesauce in a small pot.",
            "Slice tender pork medallions and plate alongside steamed white rice and a generous spoon of warm applesauce."
        ]
    }
}

def main():
    meals_path = 'data/meals.json'
    with open(meals_path, 'r', encoding='utf-8') as f:
        meals = json.load(f)

    print(f"Loaded {len(meals)} meals from {meals_path}")

    # Map vegetarian meals to VGT-01 .. VGT-15 for distinct unique IDs
    veg_counter = 1
    for m in meals:
        if m.get('group') == 'VEGETARIAN':
            m['id'] = f"VGT-{veg_counter:02d}"
            veg_counter += 1

    updated_count = 0
    for m in meals:
        mid = m['id']
        rec = RECIPES.get(mid)
        if rec:
            m['prep_time'] = rec['prep_time']
            m['cook_time'] = rec['cook_time']
            m['steps'] = rec['steps']
            updated_count += 1
        else:
            print(f"WARNING: No recipe found for meal {mid} ({m['name']})")

    with open(meals_path, 'w', encoding='utf-8') as f:
        json.dump(meals, f, indent=2, ensure_ascii=False)

    print(f"Successfully updated {updated_count}/75 meals with prep_time, cook_time, and steps!")

if __name__ == '__main__':
    main()
