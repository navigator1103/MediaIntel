interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'relationship' | 'consistency' | 'uniqueness';
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
}

interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: any;
}

export class ShareOfVoiceValidator {
  private masterData: any;
  private businessUnit: string;
  private country: string;
  private rules: ValidationRule[] = [];

  constructor(masterData: any, businessUnit: string, country: string) {
    this.masterData = masterData;
    this.businessUnit = businessUnit;
    this.country = country;
    this.initializeRules();
  }

  private initializeRules(): void {
    // Required field rules
    this.rules.push(
      {
        field: 'Category',
        type: 'required',
        severity: 'critical',
        message: 'Category is required and cannot be empty'
      },
      {
        field: 'Company',
        type: 'required',
        severity: 'critical',
        message: 'Company is required and cannot be empty'
      }
    );

    // Category validation based on business unit
    this.rules.push({
      field: 'Category',
      type: 'relationship',
      severity: 'critical',
      message: `Category must be valid for ${this.businessUnit} business unit`
    });

    // Company validation
    this.rules.push({
      field: 'Company',
      type: 'relationship',
      severity: 'warning',
      message: 'Company should be "Nivea" or "Competitor 1-5" format'
    });

    // Numeric field validation
    this.rules.push(
      {
        field: 'Total TV Investment',
        type: 'format',
        severity: 'warning',
        message: 'Total TV Investment should be a valid number if provided'
      },
      {
        field: 'Total TV TRPs',
        type: 'format',
        severity: 'warning',
        message: 'Total TV TRPs should be a valid number if provided'
      }
    );

    // Uniqueness check
    this.rules.push({
      field: 'Category',
      type: 'uniqueness',
      severity: 'critical',
      message: 'Duplicate combination: same Category and Company combination already exists in this upload'
    });
  }

  public async validateRecord(record: any, rowIndex: number, allRecords: any[]): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    for (const rule of this.rules) {
      try {
        const ruleIssues = await this.applyRule(rule, record, rowIndex, allRecords);
        issues.push(...ruleIssues);
      } catch (error) {
        console.error(`Error applying rule ${rule.field}:${rule.type}:`, error);
        issues.push({
          rowIndex,
          columnName: rule.field,
          severity: 'critical',
          message: `Validation error: ${error.message}`,
          currentValue: record[rule.field]
        });
      }
    }

    return issues;
  }

  private async applyRule(rule: ValidationRule, record: any, rowIndex: number, allRecords: any[]): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const fieldValue = record[rule.field];

    switch (rule.type) {
      case 'required':
        if (!fieldValue || fieldValue.toString().trim() === '') {
          issues.push({
            rowIndex,
            columnName: rule.field,
            severity: rule.severity,
            message: rule.message,
            currentValue: fieldValue
          });
        }
        break;

      case 'format':
        if (fieldValue && fieldValue !== '') {
          if (rule.field.includes('Investment') || rule.field.includes('TRPs')) {
            const numericValue = this.parseNumber(fieldValue);
            if (numericValue === null && fieldValue.toString().trim() !== '') {
              issues.push({
                rowIndex,
                columnName: rule.field,
                severity: rule.severity,
                message: rule.message,
                currentValue: fieldValue
              });
            }
          }
        }
        break;

      case 'relationship':
        if (rule.field === 'Category') {
          const isValidCategory = this.isValidCategoryForBusinessUnit(fieldValue);
          if (!isValidCategory) {
            const validCategories = this.getValidCategoriesForBusinessUnit();
            issues.push({
              rowIndex,
              columnName: rule.field,
              severity: rule.severity,
              message: `${rule.message}. Valid categories: ${validCategories.join(', ')}`,
              currentValue: fieldValue
            });
          }
        } else if (rule.field === 'Company') {
          if (fieldValue && !this.isValidCompanyFormat(fieldValue)) {
            issues.push({
              rowIndex,
              columnName: rule.field,
              severity: rule.severity,
              message: rule.message,
              currentValue: fieldValue
            });
          }
        }
        break;

      case 'uniqueness':
        if (rule.field === 'Category') {
          const duplicates = this.findDuplicateCombinations(record, allRecords, rowIndex);
          if (duplicates.length > 0) {
            issues.push({
              rowIndex,
              columnName: 'Category',
              severity: rule.severity,
              message: `${rule.message}. Found duplicates at rows: ${duplicates.join(', ')}`,
              currentValue: `${record.Category} + ${record.Company}`
            });
          }
        }
        break;
    }

    return issues;
  }

  private isValidCategoryForBusinessUnit(category: string): boolean {
    if (!category) return false;
    
    const validCategories = this.getValidCategoriesForBusinessUnit();
    return validCategories.some(validCat => 
      validCat.toLowerCase() === category.toLowerCase()
    );
  }

  private getValidCategoriesForBusinessUnit(): string[] {
    if (this.businessUnit === 'Nivea') {
      return this.masterData.niveaCategories || ['Face Care', 'Hand Body', 'Face Cleansing', 'Sun', 'Men', 'Deo', 'Lip'];
    } else if (this.businessUnit === 'Derma') {
      return this.masterData.dermaCategories || ['Acne', 'Anti Pigment', 'Sun', 'Body Lotion', 'Aquaphor'];
    }
    return [];
  }

  private isValidCompanyFormat(company: string): boolean {
    if (!company) return false;
    
    const validPatterns = [
      /^Nivea$/i,
      /^Competitor\s+[1-5]$/i,
      /^Competitor[1-5]$/i
    ];
    
    return validPatterns.some(pattern => pattern.test(company.trim()));
  }

  private findDuplicateCombinations(currentRecord: any, allRecords: any[], currentIndex: number): number[] {
    const duplicateRows: number[] = [];
    const currentKey = `${currentRecord.Category}|${currentRecord.Company}`;
    
    allRecords.forEach((record, index) => {
      if (index !== currentIndex) {
        const recordKey = `${record.Category}|${record.Company}`;
        if (recordKey === currentKey) {
          duplicateRows.push(index + 1); // Convert to 1-based row numbers
        }
      }
    });
    
    return duplicateRows;
  }

  private parseNumber(value: any): number | null {
    if (value === undefined || value === null || value === '' || value === '-') return null;
    
    if (typeof value === 'number') return value;
    
    // Remove commas and parse
    const parsed = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  public async validateBatch(records: any[]): Promise<{
    issues: ValidationIssue[];
    summary: {
      total: number;
      critical: number;
      warning: number;
      suggestion: number;
      uniqueRows: number;
    };
  }> {
    const allIssues: ValidationIssue[] = [];
    
    // Validate each record
    for (let i = 0; i < records.length; i++) {
      const recordIssues = await this.validateRecord(records[i], i, records);
      allIssues.push(...recordIssues);
    }

    // Calculate summary
    const uniqueRows = new Set(allIssues.map(issue => issue.rowIndex)).size;
    const summary = {
      total: allIssues.length,
      critical: allIssues.filter(issue => issue.severity === 'critical').length,
      warning: allIssues.filter(issue => issue.severity === 'warning').length,
      suggestion: allIssues.filter(issue => issue.severity === 'suggestion').length,
      uniqueRows
    };

    return {
      issues: allIssues,
      summary
    };
  }
}