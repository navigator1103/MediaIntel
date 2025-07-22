interface ValidationRule {
  field: string;
  validate: (value: any, row: any, rowIndex: number) => ValidationIssue[];
}

interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: any;
}

export class TvDiminishingReturnsValidator {
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

  private initializeRules() {
    this.rules = [
      {
        field: 'TargetAudience',
        validate: (value, row, rowIndex) => this.validateTargetAudience(value, rowIndex)
      },
      {
        field: 'Gender',
        validate: (value, row, rowIndex) => this.validateGender(value, rowIndex)
      },
      {
        field: 'MinAge',
        validate: (value, row, rowIndex) => this.validateMinAge(value, row, rowIndex)
      },
      {
        field: 'MaxAge',
        validate: (value, row, rowIndex) => this.validateMaxAge(value, row, rowIndex)
      },
      {
        field: 'SaturationPoint',
        validate: (value, row, rowIndex) => this.validateSaturationPoint(value, rowIndex)
      },
      {
        field: 'TRP',
        validate: (value, row, rowIndex) => this.validateTRP(value, rowIndex)
      },
      {
        field: 'Reach',
        validate: (value, row, rowIndex) => this.validateReach(value, rowIndex)
      }
    ];
  }

  validate(data: any[]): { issues: ValidationIssue[], summary: any } {
    const allIssues: ValidationIssue[] = [];
    const processedRows = new Set<string>();

    data.forEach((row, rowIndex) => {
      // Validate each field
      this.rules.forEach(rule => {
        const fieldValue = row[rule.field];
        const issues = rule.validate(fieldValue, row, rowIndex);
        allIssues.push(...issues);
      });

      // Check for duplicate combinations
      const key = `${row.TargetAudience}-${row.TRP}`;
      if (processedRows.has(key)) {
        allIssues.push({
          rowIndex,
          columnName: 'TargetAudience + TRP',
          severity: 'critical',
          message: `Duplicate combination: ${row.TargetAudience} with ${row.TRP} TRPs already exists`,
          currentValue: key
        });
      }
      processedRows.add(key);
    });

    // Generate summary
    const summary = {
      total: allIssues.length,
      critical: allIssues.filter(i => i.severity === 'critical').length,
      warning: allIssues.filter(i => i.severity === 'warning').length,
      suggestion: allIssues.filter(i => i.severity === 'suggestion').length,
      uniqueRows: new Set(allIssues.map(i => i.rowIndex)).size
    };

    return { issues: allIssues, summary };
  }

  private validateTargetAudience(value: any, rowIndex: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!value || typeof value !== 'string') {
      issues.push({
        rowIndex,
        columnName: 'TargetAudience',
        severity: 'critical',
        message: 'Target Audience is required and must be text',
        currentValue: value
      });
      return issues;
    }

    const validAudiences = ['F 18-45', 'M 20-60', 'BG 18-45', 'F 25-54', 'M 18-49', 'BG 25-54'];
    if (!validAudiences.includes(value.trim())) {
      issues.push({
        rowIndex,
        columnName: 'TargetAudience',
        severity: 'warning',
        message: `Uncommon target audience format. Expected formats: ${validAudiences.join(', ')}`,
        currentValue: value
      });
    }

    return issues;
  }

  private validateGender(value: any, rowIndex: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!value || typeof value !== 'string') {
      issues.push({
        rowIndex,
        columnName: 'Gender',
        severity: 'critical',
        message: 'Gender is required',
        currentValue: value
      });
      return issues;
    }

    const validGenders = ['F', 'M', 'BG'];
    if (!validGenders.includes(value.trim())) {
      issues.push({
        rowIndex,
        columnName: 'Gender',
        severity: 'critical',
        message: 'Gender must be F (Female), M (Male), or BG (Both Genders)',
        currentValue: value
      });
    }

    return issues;
  }

  private validateMinAge(value: any, row: any, rowIndex: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (value === null || value === undefined || value === '') {
      issues.push({
        rowIndex,
        columnName: 'MinAge',
        severity: 'critical',
        message: 'Minimum Age is required',
        currentValue: value
      });
      return issues;
    }

    const numValue = typeof value === 'number' ? value : parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      issues.push({
        rowIndex,
        columnName: 'MinAge',
        severity: 'critical',
        message: 'Minimum Age must be a number between 0 and 100',
        currentValue: value
      });
    }

    // Check consistency with MaxAge
    const maxAge = typeof row.MaxAge === 'number' ? row.MaxAge : parseInt(row.MaxAge);
    if (!isNaN(maxAge) && !isNaN(numValue) && numValue >= maxAge) {
      issues.push({
        rowIndex,
        columnName: 'MinAge',
        severity: 'critical',
        message: 'Minimum Age must be less than Maximum Age',
        currentValue: value
      });
    }

    return issues;
  }

  private validateMaxAge(value: any, row: any, rowIndex: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (value === null || value === undefined || value === '') {
      issues.push({
        rowIndex,
        columnName: 'MaxAge',
        severity: 'critical',
        message: 'Maximum Age is required',
        currentValue: value
      });
      return issues;
    }

    const numValue = typeof value === 'number' ? value : parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      issues.push({
        rowIndex,
        columnName: 'MaxAge',
        severity: 'critical',
        message: 'Maximum Age must be a number between 0 and 100',
        currentValue: value
      });
    }

    return issues;
  }

  private validateSaturationPoint(value: any, rowIndex: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (value === null || value === undefined || value === '') {
      issues.push({
        rowIndex,
        columnName: 'SaturationPoint',
        severity: 'critical',
        message: 'Saturation Point is required',
        currentValue: value
      });
      return issues;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue) || numValue <= 0 || numValue > 1) {
      issues.push({
        rowIndex,
        columnName: 'SaturationPoint',
        severity: 'critical',
        message: 'Saturation Point must be a decimal between 0 and 1 (e.g., 0.7768)',
        currentValue: value
      });
    }

    // Common saturation points validation
    const commonPoints = [0.7768, 0.7534, 0.7624];
    if (!isNaN(numValue) && !commonPoints.some(point => Math.abs(point - numValue) < 0.001)) {
      issues.push({
        rowIndex,
        columnName: 'SaturationPoint',
        severity: 'suggestion',
        message: `Uncommon saturation point. Typical values: ${commonPoints.join(', ')}`,
        currentValue: value
      });
    }

    return issues;
  }

  private validateTRP(value: any, rowIndex: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (value === null || value === undefined || value === '') {
      issues.push({
        rowIndex,
        columnName: 'TRP',
        severity: 'critical',
        message: 'TRP is required',
        currentValue: value
      });
      return issues;
    }

    const numValue = typeof value === 'number' ? value : parseInt(value);
    if (isNaN(numValue) || numValue <= 0) {
      issues.push({
        rowIndex,
        columnName: 'TRP',
        severity: 'critical',
        message: 'TRP must be a positive number',
        currentValue: value
      });
    }

    if (!isNaN(numValue) && (numValue < 50 || numValue > 1000)) {
      issues.push({
        rowIndex,
        columnName: 'TRP',
        severity: 'warning',
        message: 'TRP value seems unusually low or high (typical range: 50-1000)',
        currentValue: value
      });
    }

    return issues;
  }

  private validateReach(value: any, rowIndex: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (value === null || value === undefined || value === '') {
      issues.push({
        rowIndex,
        columnName: 'Reach',
        severity: 'critical',
        message: 'Reach is required',
        currentValue: value
      });
      return issues;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue) || numValue <= 0 || numValue > 100) {
      issues.push({
        rowIndex,
        columnName: 'Reach',
        severity: 'critical',
        message: 'Reach must be a percentage between 0 and 100',
        currentValue: value
      });
    }

    return issues;
  }
}