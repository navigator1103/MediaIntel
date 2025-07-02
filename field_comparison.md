# Field Comparison: Media Sufficiency Template vs Game Plans Database

## Media Sufficiency Template Fields (CSV):
1. Last Update
2. Sub Region
3. Country
4. BU (Business Unit)
5. Category
6. Range
7. Campaign
8. Franchise NS
9. Campaign Socio-Demo Target
10. Total Country Population On Target
11. TV Copy Length
12. TV Target Size
13. WOA Open TV
14. WOA Paid TV
15. Total TRPs
16. TV R1+
17. TV R3+
18. TV Ideal Reach
19. CPP 2024
20. CPP 2025
21. Digital Target
22. Digital Target Size
23. WOA PM FF
24. WOA Influencers Amplification
25. Digital R1+
26. Digital R3+
27. Digital Ideal Reach
28. Planned Combined Reach
29. Combined Ideal Reach
30. Digital Reach Level Check
31. TV Reach Level Check
32. Combined Reach Level Check
33. Start Date
34. End Date
35. Media
36. Media Sub Type

## Game Plans Database Fields:
1. id
2. campaignId → Campaign (relation)
3. mediaSubTypeId → Media Sub Type (relation)
4. pmTypeId → PM Type (relation)
5. startDate → Start Date
6. endDate → End Date
7. totalBudget → Total Budget
8. q1Budget → Q1 Budget
9. q2Budget → Q2 Budget
10. q3Budget → Q3 Budget
11. q4Budget → Q4 Budget
12. trps → Total TRPs
13. reach1Plus → TV R1+ / Digital R1+
14. reach3Plus → TV R3+ / Digital R3+
15. totalWoa → WOA fields (combined)
16. weeksOffAir → Weeks Off Air
17. year → (derived from dates or Last Update)
18. countryId → Country (relation)
19. business_unit_id → BU
20. region_id → (derived from Country)
21. sub_region_id → Sub Region
22. category_id → Category (relation)
23. range_id → Range (relation)
24. last_update_id → Last Update (relation)
25. playbook_id → Playbook ID

## MATCHING FIELDS:
✅ **Direct Matches:**
- Start Date ↔ startDate
- End Date ↔ endDate
- Country ↔ countryId (relation)
- Category ↔ category_id (relation)
- Range ↔ range_id (relation)
- Campaign ↔ campaignId (relation)
- Media Sub Type ↔ mediaSubTypeId (relation)
- BU ↔ business_unit_id
- Sub Region ↔ sub_region_id
- Total TRPs ↔ trps

✅ **Conceptual Matches:**
- TV R1+ / Digital R1+ ↔ reach1Plus
- TV R3+ / Digital R3+ ↔ reach3Plus
- WOA fields (Open TV, Paid TV, PM FF, etc.) ↔ totalWoa
- Last Update ↔ last_update_id (relation)

## MISSING IN GAME PLANS:
❌ Fields only in Media Sufficiency template:
- Franchise NS
- Campaign Socio-Demo Target
- Total Country Population On Target
- TV Copy Length
- TV Target Size
- TV Ideal Reach
- CPP 2024
- CPP 2025
- Digital Target
- Digital Target Size
- Digital Ideal Reach
- Planned Combined Reach
- Combined Ideal Reach
- Digital Reach Level Check
- TV Reach Level Check
- Combined Reach Level Check

## MISSING IN MEDIA SUFFICIENCY:
❌ Fields only in Game Plans:
- totalBudget
- q1Budget, q2Budget, q3Budget, q4Budget
- weeksOffAir
- pmTypeId
- playbook_id
- year

## OVERLAP PERCENTAGE:
- **Direct + Conceptual Matches:** ~13 fields
- **Total Media Sufficiency Fields:** 36 fields
- **Total Game Plans Fields:** 25 fields
- **Overlap:** ~36% of Media Sufficiency fields match Game Plans