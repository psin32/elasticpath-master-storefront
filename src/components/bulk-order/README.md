# Bulk Order PDF Upload Feature

## Overview

The Bulk Order component now supports uploading PDF files to automatically extract SKU and quantity pairs for bulk ordering.

## Features

- **PDF Upload**: Upload PDF files containing product SKUs and quantities
- **Multiple Format Support**: Supports various PDF formats including:
  - Comma-separated: `SKU001,10`
  - Space-separated: `SKU001 10`
  - Colon-separated: `SKU001: 10`
  - Tab-separated: `SKU001	10`
  - Complex patterns: `Product: ABC123 Qty: 5`
- **Error Handling**: Shows warnings for unparseable lines
- **Validation**: Validates extracted data for duplicates and invalid values
- **Integration**: Seamlessly integrates with existing CSV upload and manual entry

## Supported PDF Formats

### Simple Formats

```
SKU001,10
SKU002,20
PROD-ABC,15
```

### Complex Formats

```
Product: SKU001, Quantity: 10
Item SKU002 - 20 units
SKU003: 5 pcs
```

### Mixed Formats

The parser can handle mixed formats within the same PDF, automatically detecting the pattern used in each line.

## Usage

1. **Navigate to Bulk Order**: Go to `/bulk-order` page
2. **Upload PDF**: Click "Import PDF File" button
3. **Select File**: Choose a PDF file from your device
4. **Review Results**: Check the parsed items in the textarea
5. **Review Warnings**: Any parsing issues will be shown in yellow warning boxes
6. **Add to Cart**: Click "Add to Cart" to add the items

## Error Handling

- **File Type Validation**: Only PDF files are accepted
- **Parsing Warnings**: Shows warnings for lines that couldn't be parsed
- **Validation Errors**: Shows errors for duplicate SKUs or invalid quantities
- **Success Feedback**: Toast notifications for successful parsing

## Technical Details

### PDF Parser (`src/lib/pdf-parser.ts`)

- Uses `pdf-parse` library for PDF text extraction
- Multiple regex patterns for different formats
- Robust error handling and validation
- Returns structured data with items and errors

### Integration

- Seamlessly integrates with existing BulkOrder component
- Maintains backward compatibility with CSV upload
- Uses same validation and cart addition logic

## Example PDF Content

```
Bulk Order List
===============

SKU001,10
SKU002,20
PROD-ABC,15

Product Details:
- Item SKU003: 5 units
- Product: SKU004, Qty: 8

Additional Items:
SKU005	12
SKU006: 25
```

This would be parsed as:

- SKU001, 10
- SKU002, 20
- PROD-ABC, 15
- SKU003, 5
- SKU004, 8
- SKU005, 12
- SKU006, 25
