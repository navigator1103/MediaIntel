# Media Sufficiency Data Import Guide

This guide explains how to use the CSV template for importing media sufficiency data into the Golden Rules application.

## CSV Template Structure

The CSV template contains the following fields:

| Field | Description | Example | Required |
|-------|-------------|---------|----------|
| Year | The year of the campaign | 2025 | Yes |
| Sub Region | Geographic sub-region | North America | Yes |
| Country | Country name | United States | Yes |
| Cluster | Optional cluster grouping | APAC Core | No |
| Category | Product category | Deo | Yes |
| Range | Product range within category | Black & White | Yes |
| Campaign | Campaign name | Summer Glow | Yes |
| BU | Business unit | Personal Care | No |
| Media | Media type | TV, Digital, OOH, etc. | Yes |
| Media Subtype | Specific media channel | Social Media, Search, Open TV | Yes |
| PM Type | Paid media type | Display, Video, etc. | No |
| Start Date | Campaign start date (YYYY-MM-DD) | 2025-01-01 | Yes |
| End Date | Campaign end date (YYYY-MM-DD) | 2025-03-31 | Yes |
| Budget | Total campaign budget | 500000 | Yes |
| Q1 Budget | Q1 budget allocation | 125000 | No |
| Q2 Budget | Q2 budget allocation | 125000 | No |
| Q3 Budget | Q3 budget allocation | 125000 | No |
| Q4 Budget | Q4 budget allocation | 125000 | No |
| Target Reach | Target audience reach | 5000000 | Yes* |
| Current Reach | Actual audience reach | 4200000 | Yes* |
| TRPs | Target Rating Points | 250 | No |
| Reach 1+ | Reach at 1+ frequency | 65.4 | No |
| Reach 3+ | Reach at 3+ frequency | 42.1 | No |

*Required for charts to display properly

## Sample Data

Here's an example of how a complete row might look:

```
2025,North America,United States,NA Core,Deo,Black & White,Summer Glow,Personal Care,TV,Open TV,Standard,2025-01-01,2025-03-31,500000,500000,0,0,0,5000000,4200000,250,65.4,42.1
```

## Import Instructions

1. Fill out the CSV template with your media sufficiency data
2. Ensure all required fields are completed
3. Save the file with a .csv extension
4. Upload through the Media Sufficiency admin interface

## Data Validation

The system will validate your data for:
- Required fields
- Data format correctness
- Consistency of relationships (e.g., Range belongs to Category)
- Matching with existing master data

## Dashboard Visualization

After importing, your data will populate:
- Combined Reach charts and tables
- TV Reach charts and tables
- Digital Reach charts and tables
- Other media type performance metrics

## Tips for Successful Import

- Use consistent naming for Sub Regions, Countries, Categories, etc.
- Ensure date formats are YYYY-MM-DD
- Use numbers without currency symbols or commas for budget fields
- For reach percentages, use decimal numbers (e.g., 65.4, not 65.4%)
- Each media item for a campaign should be on a separate row

## Troubleshooting

If your import fails, check for:
- Missing required fields
- Inconsistent naming across related fields
- Invalid date formats
- Non-numeric values in numeric fields
