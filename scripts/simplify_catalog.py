import json
import re

MEALS_PATH = 'data/meals.json'

def simplify_ingredient(name):
    s = name.strip()
    
    mapping = {
        "100% pure lean beef patty": "Beef patty",
        "Lean ground beef (90/10)": "Ground beef",
        "Lean ground turkey meatballs": "Turkey meatballs",
        "Ground turkey breast": "Ground turkey",
        "Skinless chicken breast": "Chicken breast",
        "Grilled chicken breast": "Chicken breast",
        "Chicken breast slices": "Chicken breast",
        "Skinless duck breast": "Duck breast",
        "Lean pork tenderloin": "Pork tenderloin",
        "Trimmed lamb chops": "Lamb chops",
        "White fish fillet (Surmai or Pomfret)": "White fish fillet",
        "Yellowfin tuna steak": "Tuna steak",
        "Ground bison patty": "Bison patty",
        "Salmon fillet": "Salmon",
        "Cod fillet": "Cod",
        "Tilapia fillet": "Tilapia",
        "Canned skipjack tuna (in water)": "Canned tuna",
        "Cross-flow microfiltered whey isolate": "Whey protein",
        "Whey protein isolate": "Whey protein",
        "Soy protein isolate": "Soy protein",
        "Brown rice protein powder": "Rice protein",
        "Rice protein powder": "Rice protein",
        "Pea protein powder": "Pea protein",
        "Plant protein powder": "Plant protein",
        "Hemp protein powder": "Hemp protein",
        "Whole egg": "Eggs",
        "Whole eggs": "Eggs",
        "Scrambled eggs": "Eggs",
        "Baby spinach": "Spinach",
        "Seedless diced cucumber": "Cucumber",
        "Broccoli florets": "Broccoli",
        "Fresh blueberries": "Blueberries",
        "Fresh mango": "Mango",
        "Fresh pineapple": "Pineapple",
        "Fresh pineapple chunks": "Pineapple",
        "Ripe banana": "Banana",
        "Ripe tomatoes": "Tomatoes",
        "Tomato": "Tomatoes",
        "Tomato compote": "Tomato sauce",
        "Tomato purée": "Tomato purée",
        "Tomato pur\u00e9e": "Tomato purée",
        "Tomato pure": "Tomato purée",
        "Tomato salsa": "Salsa",
        "Steamed carrots": "Carrots",
        "Steamed zucchini": "Zucchini",
        "Steamed bok choy": "Bok choy",
        "Green bell pepper": "Bell peppers",
        "Green capsicum": "Bell peppers",
        "Green & yellow capsicum": "Bell peppers",
        "Bell pepper": "Bell peppers",
        "Green chilli": "Green chillies",
        "Green chillies": "Green chillies",
        "Fresh paneer": "Paneer",
        "Fresh paneer cubes": "Paneer",
        "Grated paneer": "Paneer",
        "Paneer cubes": "Paneer",
        "Pure cottage cheese": "Cottage cheese",
        "Low-fat cottage cheese": "Cottage cheese",
        "Lactose-free or pure cottage cheese": "Cottage cheese",
        "Fresh mozzarella": "Mozzarella cheese",
        "Icelandic Skyr": "Greek yogurt",
        "Fresh homemade curd": "Curd",
        "Plain puffed rice cakes": "Rice cakes",
        "Whole wheat flour (roti)": "Whole wheat flour",
        "Whole wheat bread": "Whole wheat bread",
        "Whole wheat toast": "Whole wheat bread",
        "Whole wheat English muffin": "English muffin",
        "Whole wheat pancake mix": "Pancake mix",
        "Steamed white rice": "White rice",
        "Steamed rice": "White rice",
        "White basmati rice": "White rice",
        "Jasmine rice": "White rice",
        "Basmati rice": "White rice",
        "Wild rice blend": "Wild rice",
        "Mixed berry compote": "Mixed berries",
        "Roasted beetroot cubes": "Beetroot",
        "Roasted pumpkin cubes": "Pumpkin",
        "Roasted pumpkin seeds": "Pumpkin seeds",
        "Shelled edamame": "Edamame",
        "Firm tofu": "Tofu",
        "Seitan strips": "Seitan",
        "Flaxseed meal": "Flaxseeds",
        "Sliced almonds": "Almonds",
        "Sliced turkey breast": "Turkey breast",
        "Rolled oats": "Oats",
        "Russet potatoes": "Potatoes",
        "Sweet potatoes": "Sweet potato",
        "Kuttu (buckwheat groats)": "Buckwheat",
        "Buckwheat groats": "Buckwheat",
        "Rajgira (amaranth) grain": "Amaranth",
        "Black-eyed peas (lobiya)": "Black-eyed peas",
        "Boiled raw banana": "Raw banana",
        "Raw banana sabzi": "Raw banana",
        "Yellow moong dal batter": "Moong dal batter",
        "Unsweetened applesauce": "Applesauce",
        "Extra virgin olive oil": "Olive oil",
        "Olive oil spray": "Olive oil",
        "Ghee or oil": "Ghee",
        "Coriander leaves": "Coriander",
        "Fresh coriander": "Coriander",
        "Fresh basil": "Basil",
        "Mint leaves": "Mint",
        "Mint coriander chutney (no garlic)": "Mint chutney",
        "White sesame seeds": "Sesame seeds",
        "Cumin": "Cumin seeds",
        "Cumin tadka": "Cumin seeds",
        "Roasted cumin powder": "Cumin powder",
        "Sea salt": "Salt",
        "Rock salt": "Salt",
        "Pepper": "Black pepper",
        "Teriyaki or aminos": "Teriyaki sauce",
        "Tikka spices": "Curry powder",
        "Curry spices": "Curry powder",
        "Water or oat milk": "Oat milk",
        "Milk or water": "Milk",
        "Almond milk (or oat)": "Almond milk",
        "Halloumi cheese": "Grilled cheese (Halloumi)",
        "Yellow split peas": "Yellow split peas",
    }
    
    return mapping.get(s, s)

def simplify_meal_name(name):
    s = name.strip()
    s = re.sub(r'\bTop (9|8) (Allergen-Free|Free)\s*', '', s, flags=re.I)
    s = re.sub(r'\b(Hypoallergenic|Allergen-Free|Allergen-Safe|Gluten/Soy/Nut-Free)\s*', '', s, flags=re.I)
    s = re.sub(r'\bJain-Style\s*', '', s, flags=re.I)
    s = s.replace('Vegan Chili Sin Carne with Wild Rice', 'Vegan Bean Chili with Rice')
    s = s.replace('Parfait with', 'with')
    s = s.replace('Berry Compote', 'Mixed Berries')
    s = s.replace('Dahl', 'Dal')
    s = s.replace('(Pho Style)', '')
    s = s.replace('(Cottage Cheese)', '')
    s = s.replace('Soy Protein Isolate', 'Soy Protein')
    s = s.replace('Skyr Yogurt Bowl', 'Yogurt Bowl')
    s = s.replace('High-Protein Lentil & Halloumi Salad', 'Lentil & Grilled Cheese Salad')
    s = s.replace('Whey Isolate Shake with Rice Cream', 'Whey Protein Shake with Rice Cream')
    s = s.replace('Rice & Yellow Split Pea Dal', 'Yellow Lentil Dal with Rice')
    s = s.replace('Rice & Yellow Split Pea Dahl', 'Yellow Lentil Dal with Rice')
    s = s.replace('Hemp & Pumpkin Seed Smoothie Bowl', 'Berry & Seed Smoothie Bowl')
    s = s.replace('Bison Patty with Roasted White Rice', 'Bison Patty with White Rice')
    s = s.replace('Egg White & Spinach Omelet with Whole Toast', 'Egg White & Spinach Omelet with Toast')
    s = s.replace('Duck Breast Bowl with Roasted Beetroot', 'Duck Breast with Beetroot & Quinoa')
    s = s.replace('Capsicum', 'Bell Peppers')
    s = s.replace('Whey Isolate Shake with Banana', 'Whey Protein Shake with Banana')
    s = s.replace('Cottage Cheese & Pineapple Bowl', 'Cottage Cheese with Pineapple')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# Clean friendly descriptions for all 75 meals
CLEAN_BENEFITS = {
    "MEAL-01": "High-protein scrambled tofu with spinach and whole wheat toast to start your day strong.",
    "MEAL-02": "Warm oatmeal with soy protein, chia seeds, and sweet berries for steady energy.",
    "MEAL-03": "Hearty lentils and quinoa with a nutty tahini dressing to fuel muscle recovery.",
    "MEAL-04": "Comforting chickpea and sweet potato curry served with brown rice to recharge your body.",
    "MEAL-05": "Refreshing smoothie bowl packed with edamame, pea protein, and fresh fruits.",
    "MEAL-06": "Savory high-protein stir-fry with crunchy broccoli and toasted cashews.",
    "MEAL-07": "Hearty black beans, avocado, and rice for lasting workout fuel.",
    "MEAL-08": "Wholesome tempeh with quinoa and kale, gentle on digestion and full of nutrients.",
    "MEAL-09": "Creamy peanut butter and banana oatmeal to refuel right after your workout.",
    "MEAL-10": "Warm red lentil dal served with freshly made whole wheat roti.",
    "MEAL-11": "Fluffy buckwheat pancakes with plant protein and pure syrup.",
    "MEAL-12": "Rich and hearty vegan bean chili served with wholesome rice.",
    "MEAL-13": "Crispy seasoned tofu with tender roasted asparagus, light and high in protein.",
    "MEAL-14": "Crispy spiced chickpeas wrapped with fresh avocado and greens.",
    "MEAL-15": "Cool chia seed pudding with almond milk, rich in healthy fats and protein.",
    "MEAL-16": "Creamy Greek yogurt with golden honey and crunchy granola.",
    "MEAL-17": "Fresh paneer and colorful veggies stir-fried for a satisfying high-protein meal.",
    "MEAL-18": "Light and fluffy egg white omelet with fresh spinach and toasted bread.",
    "MEAL-19": "Classic protein shake blended with oats and creamy almond butter.",
    "MEAL-20": "Soft ricotta pancakes loaded with juicy blueberries and protein.",
    "MEAL-21": "Tender spiced paneer tikka served with a light quinoa pilaf.",
    "MEAL-22": "Creamy scrambled eggs paired with melted cheese and fresh avocado.",
    "MEAL-23": "Satisfying salad with warm lentils, grilled cheese, and crisp greens.",
    "MEAL-24": "Cool yogurt bowl topped with crunchy pumpkin seeds and sweet mango.",
    "MEAL-25": "Fresh cottage cheese with sweet juicy pineapple, easy to digest and soothing.",
    "MEAL-26": "Warm toasted quesadilla filled with eggs and melted cheese.",
    "MEAL-27": "Quick vegetable fried rice with egg whites for an easy post-workout meal.",
    "MEAL-28": "Golden waffles topped with creamy Greek yogurt and sweet mixed berries.",
    "MEAL-29": "Savory Italian-style omelet with melted mozzarella, ripe tomatoes, and fresh basil.",
    "MEAL-30": "Smooth whey protein shake paired with light cream of rice to refuel fast.",
    "MEAL-31": "Classic favorite: tender grilled chicken breast with sweet potato and steamed broccoli.",
    "MEAL-32": "Crispy pan-seared salmon with quinoa and roasted asparagus, full of healthy omega-3s.",
    "MEAL-33": "Savory lean ground beef over fluffy jasmine rice to rebuild strength.",
    "MEAL-34": "Lean roasted turkey breast wrap with crisp greens, quick and convenient.",
    "MEAL-35": "Light tuna salad with olive oil dressing and whole grain crackers.",
    "MEAL-36": "Warm English muffin filled with fluffy egg and lean turkey bacon.",
    "MEAL-37": "Flavorful grilled shrimp tacos served in soft corn tortillas.",
    "MEAL-38": "Juicy steak served with smooth sweet potato mash for lasting energy.",
    "MEAL-39": "Flaky white cod fillet with wholesome brown rice and tender green beans.",
    "MEAL-40": "Comforting warm noodle soup with shredded chicken breast and fresh herbs.",
    "MEAL-41": "Light pan-cooked tilapia with golden roasted potatoes and veggies.",
    "MEAL-42": "Lean bison patty served with fluffy white rice for pure protein and iron.",
    "MEAL-43": "Simple and clean chicken breast with white rice, the ultimate recovery meal.",
    "MEAL-44": "Seared tuna steak served with hearty wild rice and greens.",
    "MEAL-45": "Tender turkey meatballs served over warm whole wheat spaghetti.",
    "MEAL-46": "Light yellow lentil soup seasoned with cumin and coriander, served with quinoa.",
    "MEAL-47": "Crispy spiced banana patty wrap made without onion or garlic.",
    "MEAL-48": "Rich black-eyed peas curry served with steamed rice, high in fiber and protein.",
    "MEAL-49": "High-protein tofu and bell peppers stir-fry made without onion or garlic.",
    "MEAL-50": "Warm amaranth porridge cooked in almond milk for a gentle morning recharge.",
    "MEAL-51": "Fresh paneer scramble cooked with mild spices and served with warm paratha.",
    "MEAL-52": "Golden crispy moong dal chilla stuffed with fresh spiced paneer.",
    "MEAL-53": "Wholesome buckwheat khichdi cooked with fresh paneer and ghee.",
    "MEAL-54": "Cooling curd and rice bowl with raw banana and tomato, soothing on the stomach.",
    "MEAL-55": "Crisp cucumber and fresh paneer salad seasoned with lemon and cumin.",
    "MEAL-56": "Tender steamed chicken breast with white rice and colorful bell peppers.",
    "MEAL-57": "Clean pan-seared fish fillet served with fluffy steamed white rice.",
    "MEAL-58": "Poached lean turkey breast paired with smooth zucchini mash.",
    "MEAL-59": "Light egg white scramble with fresh juicy tomatoes and herbs.",
    "MEAL-60": "Juicy grilled lamb chops seasoned with salt and cumin, served with rice.",
    "MEAL-61": "Simple plant-based bowl with quinoa, black beans, and avocado.",
    "MEAL-62": "Warm and soothing chickpea and sweet potato stew, easy on the stomach.",
    "MEAL-63": "Warm gluten-free buckwheat porridge topped with sweet berries.",
    "MEAL-64": "Comforting yellow dal and rice that is light and gentle on the stomach.",
    "MEAL-65": "Refreshing smoothie bowl loaded with pumpkin seeds, hemp, and berries.",
    "MEAL-66": "Simple cottage cheese bowl with sweet fresh pineapple slices.",
    "MEAL-67": "Light egg white and spinach omelet served with crunchy rice cakes.",
    "MEAL-68": "Sweet berry smoothie blended with clean rice protein and banana.",
    "MEAL-69": "High-protein cottage cheese topped with crunchy pumpkin seeds and honey.",
    "MEAL-70": "Smooth whey protein shake blended with fresh banana and cinnamon.",
    "MEAL-71": "Tender grilled chicken breast served with smooth sweet potato mash.",
    "MEAL-72": "Gentle ground turkey and roasted pumpkin bowl, great for easy digestion.",
    "MEAL-73": "Wholesome beef patty with fluffy white rice and tender carrots.",
    "MEAL-74": "Pan-seared duck breast with sweet roasted beetroot and quinoa.",
    "MEAL-75": "Lean tender pork served with sweet applesauce, green beans, and rice."
}

def main():
    with open(MEALS_PATH, 'r', encoding='utf-8') as f:
        meals = json.load(f)
        
    for m in meals:
        m['name'] = simplify_meal_name(m['name'])
        
        src_id = m.get('source_id')
        if src_id in CLEAN_BENEFITS:
            m['benefits'] = CLEAN_BENEFITS[src_id]
            
        new_ings = []
        for ing in m.get('ingredients', []):
            simplified = simplify_ingredient(ing)
            if simplified not in new_ings:
                new_ings.append(simplified)
        m['ingredients'] = new_ings
        
    with open(MEALS_PATH, 'w', encoding='utf-8') as f:
        json.dump(meals, f, indent=2, ensure_ascii=False)
        
    print("Catalog updated successfully!")

if __name__ == '__main__':
    main()
