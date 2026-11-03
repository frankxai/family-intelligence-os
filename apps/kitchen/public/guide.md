# Kitchen Notes — your cooking companion

Open https://starlight-kitchen.vercel.app/start

## Start your private notebook

1. Open the one-time invitation Frank shares with you, choose your display name, and save the notebook key in a password manager. The key is shown once. Do not put invitations or notebook keys into ChatGPT.
2. Tap **New recipe**. Start with the dish name and your rough notes. Ingredients and method can wait. Add a JPEG, PNG or WebP photo; the app makes a resized JPEG without location metadata. Keep the original on your phone. HEIC must first be exported as JPEG.
3. Use **Cooking journal** after a meal: date, dish, what worked, what you changed, and what to try next.
4. Use **Getting started → Copy ChatGPT instructions**. Paste those instructions into a new chat in your own ChatGPT account. Add your notes or photo. Ask for a recipe draft in your preferred language.
5. Copy the resulting recipe JSON into **Import from ChatGPT**. Review it, then save. Upload the dish photo separately in the recipe form. A chat cannot automatically access or update your private notebook.
6. Open a recipe → **Publishing studio**. Copy blog/Tumblr text, download a Tumblr draft payload, prepare a YouTube description, or print a recipe card to PDF. These exports do not post to social accounts.
7. To publish to your own public shelf, review the ingredients, method and every photo, confirm your rights, and enter your notebook key. Original kitchen notes, private notes and nutrition mappings are excluded. Later private edits leave the public copy unchanged until you publish again. Remove the public copy whenever you choose; third-party saved copies cannot be recalled.

## Copy only this section into ChatGPT

You are my careful cooking editor and kitchen journal companion. I use Kitchen Notes at https://starlight-kitchen.vercel.app. Read https://starlight-kitchen.vercel.app/guide.md when browsing is available; these instructions also stand alone.

When I send notes, a dish photo, a label or an idea: preserve my voice and distinguish what I said from suggestions. Do not infer hidden ingredients, exact quantities, allergens, food safety or nutrition from a dish photo. Ask only for details needed to make the recipe usable. My notes remain the source of truth. Write in the language I use. Keep the tone personal, useful and unpretentious.

Return (1) a polished recipe draft, (2) a dated cooking-journal note, (3) optional blog/Tumblr text or a four-frame photo story when requested, and (4) one valid JSON recipe object in a code block for import into Kitchen Notes. Use this exact shape:

```json
{
  "title": "Dish name",
  "description": "A short introduction",
  "source_note": "My original notes, verbatim",
  "source_url": "",
  "servings": null,
  "minutes": null,
  "ingredients": [
    {
      "name": "Ingredient",
      "amount": "quantity only when known",
      "grams": null,
      "food_id": null
    }
  ],
  "steps": ["Confirmed step"],
  "tags": [],
  "notes": "Uncertainties and optional suggestions, clearly labelled",
  "status": "draft",
  "language": "en"
}
```

Use null for unknown numbers. Language may be en, de, nl or vi. Do not invent missing source notes or imply you cooked or tasted anything. If a recipe comes from someone else, retain attribution and link, and help me write my own adaptation. Nutrition requires weighed quantities plus a matching label or identifiable source; show uncertainty and missing coverage. Keep personal diet information out of publication drafts. Never claim to save, upload, schedule or publish unless a connected tool actually succeeds. This conversation does not automatically have access to my private notebook: I copy the recipe JSON into the site's import form and upload photos there myself. Never ask me to paste my notebook key or invitation into chat. Proactive suggestions must be requested and grounded in notes I share.

## Nutrition

Food library entries store values per 100 g plus their source and raw/cooked/as-sold state. Match weighed ingredients from a recipe to those records in the Nutrition screen. Missing matches and unknown nutrient values stay visible. Estimates are not laboratory measurements. FoodData Central is a useful reference: https://fdc.nal.usda.gov/. Its API is not connected to this pilot; records are entered by the cook.

## Ownership and current limits

- Separate, private notebooks with secure browser sessions; a notebook key grants access. Keep it in a password manager. There is no email recovery yet.
- The hosting owner can administer the database and storage. This is a cooking pilot, not an end-to-end encrypted family or medical vault.
- Notebook JSON export includes recipes, versions, food records, journal entries, publication snapshots and photo references. Download the JPEGs separately in settings. Automated restoration and offsite backup are not yet configured.
- Pilot caps: 500 recipes, 500 food records and 200 photos per notebook. Journal displays the latest 1,000 entries; full export includes all entries. Photos are capped at 5 MB after conversion.
- The Cooking companion uses Cloudflare Workers AI only when you submit text and confirm processing. Each notebook has a maximum of 10 requests per UTC day, with a shared global cap of 100. Drafts require your review before saving. No scheduled agents, private ChatGPT connector, automatic nutrition recognition or direct social posting are enabled. The built-in helper is text-only; use your own ChatGPT for photo interpretation.
- Public read-only MCP: https://starlight-kitchen.frankxai.workers.dev/mcp. It exposes only intentionally published recipes; it cannot access a private notebook or publish. Client compatibility beyond protocol smoke tests remains to be verified.
