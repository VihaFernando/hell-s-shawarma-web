-- Six starter articles (from the blog design mockups), inserted as DRAFTS.
-- Run after migrations/0001_blog.sql. Review each one in /admin, add a cover
-- image, then press Publish (publishing also adds heading anchors + table of
-- contents automatically).
--
-- Safe to re-run: existing slugs are skipped.

insert into public.blog_posts
  (slug, title, excerpt, category_id, tags, focus_keyword, seo_title, seo_description, faqs, content)
values

-- 1 -------------------------------------------------------------------------
('what-makes-a-great-shawarma',
 'What Makes a Great Shawarma?',
 'It''s more than just meat in a wrap. Here''s a closer look at the history, preparation and key elements that make a shawarma truly great.',
 (select id from public.blog_categories where slug = 'food-culture'),
 array['shawarma', 'middle eastern food', 'colombo'],
 'great shawarma',
 'What Makes a Great Shawarma? The 5 Things That Matter',
 'What separates a great shawarma from an average wrap? The marinade, the spit, the bread, the sauce and the build. Here''s what to look for, from our Colombo kitchen.',
 '[{"question":"What is shawarma made of?","answer":"Shawarma is thinly sliced marinated meat, usually chicken or beef, slow-roasted on a vertical spit and served in flatbread or on a plate with sauces, pickles and salad."},{"question":"Is shawarma healthy?","answer":"It can be a balanced meal: grilled protein, fresh vegetables and bread. Sauces, cheese and fries add calories, so a shawarma plate with salad and hummus is the lighter way to enjoy it."}]'::jsonb,
$html$<p>Shawarma has a rich history that dates back to the Middle East, where thin slices of marinated meat are slow-cooked on a vertical spit. Over time, it has become one of the most loved street foods around the world, and here in Sri Lanka it holds a special place in the hearts (and late-night cravings) of many.</p>
<p>At Hell's Shawarma, we stay true to the traditional method while adding our own touch with carefully selected spices, fresh ingredients and a focus on authentic flavour. So what actually makes a great shawarma? These are the five things we obsess over.</p>
<h2>1. The Marinade</h2>
<p>It all starts with the marinade. A blend of Middle Eastern spices, garlic, acidity and a few of our own secrets gives the meat its bold, distinct flavour. Time matters as much as the recipe: the meat needs long enough in the marinade for the flavour to go all the way through, not just sit on the surface.</p>
<p>A great shawarma tastes seasoned in every bite. If the outside is tasty but the middle is bland, the marinade was rushed.</p>
<h2>2. The Vertical Spit</h2>
<p>The spit is what makes shawarma <em>shawarma</em>. Layers of marinated meat are stacked and roasted slowly as they turn, so the outside caramelises while the inside stays juicy. Thin slices are shaved off the outer layer as it crisps, which is why every portion gets those charred, flavour-packed edges.</p>
<div class="callout"><p>Tip: The best time to order is when you can see the cook shaving fresh slices straight off the spit. That crisp-edged meat is what you're after.</p></div>
<h2>3. Fresh, Soft Bread</h2>
<p>The wrap holds everything together, literally. Good shawarma bread is soft enough to fold without cracking, but sturdy enough to survive sauce and juices. A quick toast on the grill adds texture and keeps it from going soggy before the last bite.</p>
<h2>4. Sauces That Balance the Richness</h2>
<p>Garlic sauce (toum), tahini and a touch of chilli each play a role. Garlic brings punch, tahini adds a nutty creaminess, and heat cuts through the richness of the meat. The goal is balance: enough sauce in every bite, never so much that it drowns the meat.</p>
<h2>5. The Build</h2>
<p>Pickles for crunch and acidity, fresh vegetables for freshness, and meat spread evenly from end to end. A great shawarma is built so the first bite and the last bite taste equally good. It's a small detail that separates a good wrap from one you keep thinking about.</p>
<h2>Different Styles, Same Fundamentals</h2>
<p>Across the Middle East, shawarma changes from country to country: different spice blends, breads and sauces. That's why our menu includes Middle Eastern, Yemeni, Turkish and Palestinian styles of both <a href="/menu">chicken and beef shawarma</a>. The flavours differ, but the fundamentals above stay the same.</p>
<h2>Taste the Difference</h2>
<p>The best way to judge a shawarma is to eat one. Visit any of our <a href="/blog/our-locations-across-colombo">Hell's Shawarma branches across Colombo</a> and taste what all that care adds up to.</p>
<p class="cta-row"><a class="cta-button" href="/menu">View the menu</a></p>$html$),

-- 2 -------------------------------------------------------------------------
('inside-our-kitchen',
 'Inside Our Kitchen: Fresh, Daily, Always',
 'A look at how we prepare our meat fresh every day, from marination to the final slice.',
 (select id from public.blog_categories where slug = 'behind-the-scenes'),
 array['behind the scenes', 'kitchen', 'fresh food'],
 'shawarma kitchen',
 'Inside Our Shawarma Kitchen: Fresh, Daily, Always',
 'Go behind the counter at Hell''s Shawarma: how we prep, marinate, grill and build every shawarma fresh each day in our Colombo kitchens.',
 '[]'::jsonb,
$html$<p>Every shawarma that leaves our counter starts hours earlier, long before the first customer walks in. Here's a look behind the scenes at how a day in a Hell's Shawarma kitchen comes together.</p>
<h2>Prep Starts Early</h2>
<p>Before service, the team is already at work: trimming and slicing meat, mixing marinades, chopping vegetables and preparing sauces. Doing this fresh, every day, is the single biggest reason our food tastes the way it does.</p>
<h2>Marination: Where the Flavour Is Built</h2>
<p>Chicken and beef each get their own marinade, built around Middle Eastern spices and garlic. The meat rests in it long enough for the flavour to soak right through. It's the slowest step in the process, and the one we never rush.</p>
<h2>Stacking the Spit</h2>
<p>Marinated meat is layered onto the vertical spit by hand. How it's stacked affects how evenly it cooks, so it's a job done with care. Once it starts turning in front of the heat, the outside slowly caramelises while the inside stays tender.</p>
<h2>Sauces and Sides, Made In-House</h2>
<p>Our signature sauces, including our garlic toum, are house-made. Alongside them sits our <a href="/blog/hummus-a-timeless-middle-eastern-classic">hummus</a>, a favourite whether as a dip or the base of a hummus plate.</p>
<h2>Built to Order</h2>
<p>When you order, your shawarma is built right then: fresh slices off the spit, bread warmed on the grill, sauces, pickles and vegetables added, then wrapped and toasted.</p>
<div class="callout"><p>All of our meat is 100% halal.</p></div>
<h2>Why It Matters</h2>
<p>Fresh prep every day takes more time and effort than shortcuts. But it's the difference between a wrap and a <a href="/blog/what-makes-a-great-shawarma">great shawarma</a>, and it's why people keep coming back.</p>
<p class="cta-row"><a class="cta-button" href="/#contact">Find a branch near you</a></p>$html$),

-- 3 -------------------------------------------------------------------------
('hummus-a-timeless-middle-eastern-classic',
 'Hummus: A Timeless Middle Eastern Classic',
 'Discover what makes hummus such an iconic part of Middle Eastern food, and of our menu.',
 (select id from public.blog_categories where slug = 'food-culture'),
 array['hummus', 'middle eastern food', 'vegetarian'],
 'hummus',
 'Hummus: The Middle Eastern Classic Explained | Hell''s Shawarma',
 'What is hummus, where does it come from and how is it best eaten? A short guide to the Middle Eastern classic, plus how to enjoy it at Hell''s Shawarma in Colombo.',
 '[{"question":"Is hummus vegetarian?","answer":"Yes. Classic hummus is made from chickpeas, tahini, lemon juice, garlic and olive oil, so it is vegetarian and usually vegan too."},{"question":"What do you eat hummus with?","answer":"Warm pita bread is traditional. It is also great with falafel, grilled meat such as shawarma, or fresh vegetables."}]'::jsonb,
$html$<p>Few dishes are as simple, or as loved, as hummus. Smooth, creamy and full of flavour, it has been a staple across the Middle East for generations and is now enjoyed all over the world.</p>
<h2>What Is Hummus?</h2>
<p>At its heart, hummus is a blend of just a handful of ingredients:</p>
<ul>
<li><strong>Chickpeas</strong>, cooked until soft</li>
<li><strong>Tahini</strong>, a paste made from sesame seeds</li>
<li><strong>Lemon juice</strong> for brightness</li>
<li><strong>Garlic</strong> for depth</li>
<li><strong>Olive oil</strong> to finish</li>
</ul>
<p>The magic is in the balance. Too much tahini and it turns heavy; too little lemon and it falls flat. Great hummus is silky, nutty, a little tangy and rich without being greasy.</p>
<h2>A Dish With Deep Roots</h2>
<p>Hummus is eaten across Lebanon, Syria, Palestine, Jordan and beyond, and each place has its own way of making and serving it. It's a sharing dish, usually scooped up with warm bread and served alongside grilled meats, falafel and salads.</p>
<h2>How We Serve It</h2>
<p>At Hell's Shawarma, hummus is more than a side. Our <a href="/menu">hummus plates</a> come topped with shawarma chicken, shawarma beef, or fiery falafels for a vegetarian option, served with pita. You can also add a hummus dip to any order.</p>
<div class="callout"><p>Vegetarian? The hummus plate with falafels and our falafel wrap are both meat-free.</p></div>
<h2>Why Hummus and Shawarma Work So Well Together</h2>
<p>Shawarma is rich, smoky and savoury. Hummus is cool, creamy and bright. Together, each makes the other taste better, which is why a hummus plate is one of the most satisfying ways to <a href="/blog/what-makes-a-great-shawarma">enjoy shawarma</a>.</p>
<p class="cta-row"><a class="cta-button" href="/menu">See our hummus plates</a></p>$html$),

-- 4 -------------------------------------------------------------------------
('our-locations-across-colombo',
 'Our Locations Across Colombo',
 'From Dehiwala to Kollupitiya and beyond, find out what makes each Hell''s Shawarma branch unique.',
 (select id from public.blog_categories where slug = 'our-locations'),
 array['colombo', 'dehiwala', 'kollupitiya', 'locations'],
 'shawarma in Colombo',
 'Shawarma in Colombo: All Hell''s Shawarma Locations & Hours',
 'Looking for shawarma in Colombo? Find every Hell''s Shawarma branch: Dehiwala, Kollupitiya (Marine Drive), Bamba Food Square and Pink Beach, with opening hours.',
 '[{"question":"Where can I find Hell''s Shawarma in Colombo?","answer":"We have four branches: Fusion Food Court in Dehiwala, Hey Marine on Marine Drive in Colombo 3 (Kollupitiya), Bamba Food Square in Colombo 4, and Pink Beach on Marine Drive in Colombo 4."},{"question":"What time does Hell''s Shawarma close?","answer":"Most branches are open daily from 2:30 PM to 1 AM. The Kollupitiya branch opens at 5 PM, closes at 12:30 AM Tuesday to Thursday and 1 AM Friday to Sunday, and is closed on Mondays."},{"question":"Does Hell''s Shawarma deliver?","answer":"Yes, you can order Hell''s Shawarma for delivery through Uber Eats."}]'::jsonb,
$html$<p>Craving shawarma in Colombo? Hell's Shawarma now has four branches across the city, each serving the same flame-grilled shawarmas, hummus plates and snack packs, with a vibe of its own. Here's where to find us and when we're open.</p>
<h2>Dehiwala: Fusion Food Court</h2>
<p>Our Dehiwala branch at <strong>Fusion Food Court</strong> is a go-to for south Colombo. A relaxed food-court setting makes it easy to come with friends and share a few snack packs.</p>
<p><strong>Hours:</strong> Daily, 2:30 PM – 1 AM</p>
<h2>Kollupitiya: Hey Marine, Marine Drive</h2>
<p>Find us at <strong>Hey Marine on Marine Drive, Colombo 3</strong>. A seaside spot that's perfect for an evening bite.</p>
<p><strong>Hours:</strong> Friday – Sunday, 5 PM – 1 AM · Tuesday – Thursday, 5 PM – 12:30 AM · Closed Mondays</p>
<h2>Bamba Food Square, Colombo 4</h2>
<p>Our branch at <strong>Bamba Food Square</strong> puts Hell's Shawarma in the middle of one of Colombo 4's busiest food spots.</p>
<p><strong>Hours:</strong> Daily, 2:30 PM – 1 AM</p>
<h2>Pink Beach, Marine Drive, Colombo 4</h2>
<p>At <strong>Pink Beach on Marine Drive</strong>, you can enjoy your shawarma with the sea breeze.</p>
<p><strong>Hours:</strong> Daily, 2:30 PM – 1 AM</p>
<h2>Late-Night Shawarma in Colombo</h2>
<p>Most of our branches stay open until 1 AM, making Hell's Shawarma one of the easiest places in Colombo to grab proper food late at night.</p>
<div class="callout"><p>Can't make it in? Order Hell's Shawarma for delivery on Uber Eats, or call us on 072 320 5285.</p></div>
<h2>Same Menu, Every Branch</h2>
<p>Whichever branch you visit, you'll find the full <a href="/menu">Hell's Shawarma menu</a>: chicken and beef shawarma in multiple regional styles, shawarma and hummus plates, falafel and loaded snack packs. Not sure what to order? Read our guide to <a href="/blog/chicken-vs-beef-shawarma">chicken vs beef shawarma</a>.</p>
<p class="cta-row"><a class="cta-button" href="/#contact">Get directions</a></p>$html$),

-- 5 -------------------------------------------------------------------------
('the-spices-that-bring-it-all-together',
 'The Spices That Bring It All Together',
 'A closer look at the spices and flavours that define our shawarmas.',
 (select id from public.blog_categories where slug = 'food-culture'),
 array['spices', 'shawarma spices', 'middle eastern food'],
 'shawarma spices',
 'Shawarma Spices: The Flavours Behind Every Wrap',
 'Cumin, coriander, paprika, cardamom and more: a guide to the classic shawarma spices and what each one adds to the flavour.',
 '[]'::jsonb,
$html$<p>Ask anyone what makes shawarma taste like shawarma and the answer usually comes back to one thing: the spices. Warm, smoky and aromatic, the right blend turns simple grilled meat into something unforgettable.</p>
<h2>The Classic Shawarma Spices</h2>
<p>Every kitchen has its own blend, but these spices show up again and again across Middle Eastern shawarma recipes:</p>
<ul>
<li><strong>Cumin</strong>: earthy and warm, the backbone of most blends.</li>
<li><strong>Coriander</strong>: citrusy and bright, it lifts the heavier spices.</li>
<li><strong>Paprika</strong>: colour and gentle smokiness.</li>
<li><strong>Turmeric</strong>: golden colour and a subtle bitterness.</li>
<li><strong>Cardamom and cinnamon</strong>: a hint of warmth and sweetness.</li>
<li><strong>Black pepper and chilli</strong>: heat that builds slowly.</li>
<li><strong>Garlic</strong>: not a dried spice, but impossible to leave out.</li>
</ul>
<h2>Chicken vs Beef: Different Blends</h2>
<p>Chicken and beef don't take spices the same way. Chicken suits brighter, more aromatic blends with plenty of garlic and citrus. Beef stands up to deeper, earthier and warmer spices. That's why the two shawarmas on our menu taste distinct, not just like the same recipe with a different meat. (More on that in our <a href="/blog/chicken-vs-beef-shawarma">chicken vs beef guide</a>.)</p>
<h2>Regional Twists</h2>
<p>Travel across the Middle East and the blend changes. Some styles lean smoky, others herby, others hot. Our menu features Middle Eastern, Yemeni, Turkish and Palestinian-style shawarmas so you can taste the difference for yourself.</p>
<h2>Where Sri Lanka Comes In</h2>
<p>Sri Lanka knows its spices. Cinnamon, cardamom and pepper are part of everyday cooking here, which might be why shawarma has found such a loyal following on the island. For heat lovers, our chilli shawarmas bring an extra kick.</p>
<div class="callout"><p>Like it hot? Look for the flame icons on our menu. The more flames, the spicier it gets.</p></div>
<p class="cta-row"><a class="cta-button" href="/menu">Explore the menu</a></p>$html$),

-- 6 -------------------------------------------------------------------------
('chicken-vs-beef-shawarma',
 'Chicken vs Beef Shawarma: Which One Is for You?',
 'A quick guide to help you choose your perfect wrap.',
 (select id from public.blog_categories where slug = 'tips-guides'),
 array['chicken shawarma', 'beef shawarma', 'guide'],
 'chicken vs beef shawarma',
 'Chicken vs Beef Shawarma: Which Should You Order?',
 'Chicken or beef shawarma? Compare flavour, texture and spice so you can pick your perfect wrap, plus our favourite ways to order each at Hell''s Shawarma.',
 '[{"question":"Which is more popular, chicken or beef shawarma?","answer":"Chicken shawarma is the most widely ordered style around the world thanks to its lighter flavour, but beef has a loyal following among people who prefer a richer, meatier wrap."},{"question":"Is the beef shawarma at Hell''s Shawarma halal?","answer":"Yes. Hell''s Shawarma serves 100% halal meat."}]'::jsonb,
$html$<p>It's the question we hear most at the counter: chicken or beef? Both are flame-grilled on the spit and both are packed with flavour, but they're different experiences. Here's a quick guide to help you choose.</p>
<h2>Chicken Shawarma: Light, Juicy and Aromatic</h2>
<p>Chicken shawarma is the classic for a reason. The meat stays juicy, takes on the marinade beautifully and pairs perfectly with garlic sauce. It's lighter and brighter in flavour, which makes it a great first choice if you're new to shawarma.</p>
<p><strong>Choose chicken if:</strong> you like garlicky, aromatic flavours and a lighter wrap.</p>
<h2>Beef Shawarma: Rich, Bold and Meaty</h2>
<p>Beef shawarma is deeper and richer. Warm, earthy spices and those crisp edges from the spit give it a bolder, more savoury bite. It pairs well with tahini and a bit of heat.</p>
<p><strong>Choose beef if:</strong> you want something hearty with a stronger, meatier flavour.</p>
<h2>Side-by-Side</h2>
<table>
<thead><tr><th></th><th>Chicken</th><th>Beef</th></tr></thead>
<tbody>
<tr><td>Flavour</td><td>Bright, garlicky, aromatic</td><td>Rich, earthy, savoury</td></tr>
<tr><td>Texture</td><td>Juicy and tender</td><td>Hearty with crisp edges</td></tr>
<tr><td>Best sauce</td><td>Garlic sauce</td><td>Tahini and chilli</td></tr>
<tr><td>Great for</td><td>First-timers, lighter meals</td><td>Big appetites, meat lovers</td></tr>
</tbody>
</table>
<h2>Can't Decide? Get Both</h2>
<p>Our <strong>Hell's Combo Snack Pack</strong> comes loaded with both chicken and beef, so you don't have to choose. Shawarma plates are another great way to try more of each.</p>
<h2>Try a Regional Style</h2>
<p>Whichever meat you pick, try one of our regional styles: Middle Eastern, Yemeni, Turkish or Palestinian, or the chilli and cheesy versions. Read about <a href="/blog/the-spices-that-bring-it-all-together">the spices behind each one</a>.</p>
<div class="callout"><p>All our meat is 100% halal.</p></div>
<p class="cta-row"><a class="cta-button" href="/menu">Choose your shawarma</a></p>$html$)

on conflict (slug) do nothing;
