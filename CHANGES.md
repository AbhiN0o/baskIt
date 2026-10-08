# What changed in this pass

## Fixed: ghost buttons and fake data
| Where | Problem | Fix |
|---|---|---|
| Seller dashboard | Every number and both charts were hardcoded; backend stats were global and unauthenticated | New `GET /api/stats/seller` (seller-only) computes revenue, orders, units, followers, 7-day revenue, categories, best sellers, order pipeline, low stock from the seller's own orders. Honest empty states when there is no data yet. Month-over-month % only shows when there is history. |
| Seller Corner (products) | Showed **every** seller's products; "Weekly sales" chart and revenue were fake | Products now filtered by seller on the server; fake chart removed; real revenue/followers shown |
| Seller public page | 100% fake ("Amara Williams, Cape Town"), required login | Real page from `GET /api/seller/:id` with the artisan's real products, working Follow and Share |
| Dashboard quick links | Pointed at `/admin/orders` and `/seller/profile`, which don't exist | All links are real routes; one shared `SellerNav` across seller pages |
| Orders page | Any seller saw/edited/deleted **every** order; `/admin` hardcoded one email and crashed for logged-out visitors | `GET /api/orders/seller` returns only orders containing your products (trimmed to your line items); status updates and deletes are permission-checked; cancelling restores stock |
| Hearts (marketplace, product page) | Local state only, lost on refresh | Real server-backed favourites + a "Saved" tab in the buyer profile |
| Cart | Promo codes, shipping tiers, 8% tax, "$" prices and a prize wheel changed the displayed total but never reached the order; "save for later" just deleted the item | Removed the fake pricing; total = what the server charges, in ₹; "save for later" moves the item to Saved |
| Product page | "Free Worldwide Shipping", "Authenticity Guaranteed", always-on "Eco-Friendly", fake experience/location, follow button always started as "not following" | Honest badges, real artisan location, link to artisan page, follow state from the account |
| Landing page | Header links did nothing; "12K+ sellers / 190+ countries" invented | Real links; numbers come from `GET /api/stats/public` |
| Signup | Date-of-birth field collected but never stored; profile showed an un-editable "Phone: Not provided" | Both removed |
| Misc | `/orders` and `/login` links to routes that didn't exist; dead `AddItem` page whose form never submitted; Share buttons with no handler; marketplace crashed on cart fetch for sellers/guests | Fixed / removed |

## Bugs found and fixed along the way
- Editing a product **deleted all its images** (client sent `keepImages`, server read `images`).
- Stock could not be set to 0 when editing (`if (quantity)`).
- Seller followers endpoint read the wrong URL param, so follower counts never loaded.
- React Query v5: mutations used `isLoading` (always undefined) and `invalidateQueries([..])` array form, so lists didn't refresh after create/edit/delete.
- Add-to-cart swallowed errors, so "Added to cart!" showed even when it failed.
- Product creation crashed when no tags were sent.
- Search used an unescaped user-supplied regex.

## New: region-aware marketplace
- State + City dropdowns (all 36 states/UTs, ~490 cities incl. craft hubs like Channapatna, Kondapalli, Pochampally, Sanganer, Bhuj) from one source of truth: `backend/src/lib/regions.js`, served at `GET /api/regions`.
- Required at buyer and seller signup; editable later (buyer profile, seller products page).
- Products carry the seller's region; marketplace filters by state/city, remembers your choice, defaults to your own city, offers "My area / My state / All India", and has friendly empty states.
- Product cards, product page and artisan page show where things are made.
- Landing page and marketplace copy reframed around local artisans.

## Routes
`/seller/dashboard` (analytics), `/seller/products`, `/seller/orders`. Old URLs (`/sellermarket`, `/admin`, email verify link) redirect.

## Existing data
Accounts created before this change have no region. Buyers just see "All India" until they set one. Sellers get a "Set region" prompt; saving it also updates all their existing products.

## Not changed (worth knowing)
- `/api/ai/*` endpoints are still public (they spend your Gemini quota); add auth or rate limiting before launch.

## Stock race condition (fixed)
- New `backend/src/lib/stock.js`: `reserveStock()` reduces stock with ONE atomic command ("reduce by N only if at least N is left"), so two buyers can never both get the last unit. Multi-item orders are all-or-nothing: if any line fails, earlier lines are put back.
- `createOrder` now reserves stock *before* saving the order and releases it if the save fails. A sold-out item returns HTTP 409 with a clear message.
- `POST /cart/checkout` previously never checked or reduced stock at all. It now uses the same helper and prices from live product prices.
- Product `quantity` has `min: 0` as a safety net.
- Order quantities must be whole numbers.
