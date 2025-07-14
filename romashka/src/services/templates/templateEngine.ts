import { 
  TemplateEngine as ITemplateEngine,
  ParsedTemplate,
  TemplateBlock,
  TemplateMetadata,
  TemplateValidation,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  OptimizedTemplate,
  TemplateImprovement,
  TemplateCondition
} from '../../types/responseTemplates';

export class TemplateEngine implements ITemplateEngine {
  private readonly VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;
  private readonly CONDITION_REGEX = /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs;
  private readonly ELSE_REGEX = /\{\{#else\}\}(.*?)$/s;
  private readonly MEDIA_REGEX = /\[media:([^\]]+)\]/g;
  private readonly LOOP_REGEX = /\{\{#each\s+([^}]+)\}\}(.*?)\{\{\/each\}\}/gs;

  parse(template: string): ParsedTemplate {
    const blocks: TemplateBlock[] = [];
    const variables: string[] = [];
    const conditions: TemplateCondition[] = [];
    const media: any[] = [];
    
    let position = 0;
    const originalTemplate = template;

    // Parse variables
    const variableMatches = template.matchAll(this.VARIABLE_REGEX);
    for (const match of variableMatches) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
      
      blocks.push({
        type: 'variable',
        content: variableName,
        position: { start: match.index!, end: match.index! + match[0].length },
        attributes: { name: variableName }
      });
    }

    // Parse conditions
    const conditionMatches = template.matchAll(this.CONDITION_REGEX);
    for (const match of conditionMatches) {
      const conditionExpr = match[1].trim();
      const conditionContent = match[2];
      
      const parsedCondition = this.parseCondition(conditionExpr);
      conditions.push(parsedCondition);
      
      blocks.push({
        type: 'condition',
        content: conditionContent,
        position: { start: match.index!, end: match.index! + match[0].length },
        attributes: { condition: parsedCondition }
      });
    }

    // Parse media attachments
    const mediaMatches = template.matchAll(this.MEDIA_REGEX);
    for (const match of mediaMatches) {
      const mediaId = match[1];
      media.push({ id: mediaId, type: 'unknown' });
      
      blocks.push({
        type: 'media',
        content: mediaId,
        position: { start: match.index!, end: match.index! + match[0].length },
        attributes: { mediaId }
      });
    }

    // Parse text blocks (everything else)
    const textContent = template
      .replace(this.VARIABLE_REGEX, '')
      .replace(this.CONDITION_REGEX, '')
      .replace(this.MEDIA_REGEX, '')
      .trim();

    if (textContent) {
      blocks.push({
        type: 'text',
        content: textContent,
        position: { start: 0, end: textContent.length },
        attributes: {}
      });
    }

    // Sort blocks by position
    blocks.sort((a, b) => a.position.start - b.position.start);

    const metadata: TemplateMetadata = {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      parsed_at: new Date().toISOString(),
      complexity_score: this.calculateComplexity(blocks),
      estimated_render_time: this.estimateRenderTime(blocks)
    };

    return {
      blocks,
      variables,
      conditions,
      media,
      metadata
    };
  }

  render(template: ParsedTemplate, variables: Record<string, any>): string {
    let result = '';
    
    for (const block of template.blocks) {
      switch (block.type) {
        case 'text':
          result += block.content;
          break;
          
        case 'variable':
          const variableName = block.attributes.name;
          const value = this.getVariableValue(variables, variableName);
          result += this.formatValue(value, variableName);
          break;
          
        case 'condition':
          const condition = block.attributes.condition;
          if (this.evaluateCondition(condition, variables)) {
            result += this.renderConditionContent(block.content, variables);
          }
          break;
          
        case 'media':
          result += this.renderMedia(block.attributes.mediaId, variables);
          break;
          
        case 'loop':
          result += this.renderLoop(block.content, block.attributes, variables);
          break;
      }
    }

    return result;
  }

  validate(template: string): TemplateValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // Basic syntax validation
      this.validateSyntax(template, errors, warnings);
      
      // Variable validation
      this.validateVariables(template, errors, warnings);
      
      // Condition validation
      this.validateConditions(template, errors, warnings);
      
      // Media validation
      this.validateMedia(template, errors, warnings);
      
      // Performance suggestions
      this.generatePerformanceSuggestions(template, suggestions);
      
      // Accessibility suggestions
      this.generateAccessibilitySuggestions(template, suggestions);
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };
    } catch (error) {
      errors.push({
        type: 'syntax',
        message: `Template validation failed: ${error}`,
        location: { line: 0, column: 0 },
        severity: 'error'
      });
      
      return {
        valid: false,
        errors,
        warnings,
        suggestions
      };
    }
  }

  optimize(template: string): OptimizedTemplate {
    const improvements: TemplateImprovement[] = [];
    let optimized = template;
    let performanceGain = 0;

    // Remove unnecessary whitespace
    const whitespaceOptimized = optimized.replace(/\s+/g, ' ').trim();
    if (whitespaceOptimized !== optimized) {
      improvements.push({
        type: 'structure',
        description: 'Removed unnecessary whitespace',
        impact: 5,
        applied: true
      });
      optimized = whitespaceOptimized;
      performanceGain += 5;
    }

    // Optimize variable usage
    const variableOptimized = this.optimizeVariables(optimized);
    if (variableOptimized !== optimized) {
      improvements.push({
        type: 'variables',
        description: 'Optimized variable usage',
        impact: 10,
        applied: true
      });
      optimized = variableOptimized;
      performanceGain += 10;
    }

    // Optimize conditions
    const conditionOptimized = this.optimizeConditions(optimized);
    if (conditionOptimized !== optimized) {
      improvements.push({
        type: 'conditions',
        description: 'Optimized conditional logic',
        impact: 15,
        applied: true
      });
      optimized = conditionOptimized;
      performanceGain += 15;
    }

    // Optimize media references
    const mediaOptimized = this.optimizeMedia(optimized);
    if (mediaOptimized !== optimized) {
      improvements.push({
        type: 'media',
        description: 'Optimized media references',
        impact: 8,
        applied: true
      });
      optimized = mediaOptimized;
      performanceGain += 8;
    }

    return {
      original: template,
      optimized,
      improvements,
      performance_gain: performanceGain
    };
  }

  private parseCondition(expression: string): TemplateCondition {
    // Simple condition parsing - can be extended for complex expressions
    const parts = expression.split(/\s+(==|!=|>|<|>=|<=|contains|not_contains)\s+/);
    
    if (parts.length >= 3) {
      return {
        id: crypto.randomUUID(),
        condition_type: 'if',
        field: parts[0].trim(),
        operator: parts[1] as any,
        value: parts[2].trim().replace(/['"]/g, ''),
        content: ''
      };
    }

    return {
      id: crypto.randomUUID(),
      condition_type: 'if',
      field: expression,
      operator: 'equals',
      value: true,
      content: ''
    };
  }

  private evaluateCondition(condition: TemplateCondition, variables: Record<string, any>): boolean {
    const fieldValue = this.getVariableValue(variables, condition.field);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue == expectedValue;
      case 'not_equals':
        return fieldValue != expectedValue;
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue);
      case 'contains':
        return String(fieldValue).includes(String(expectedValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(expectedValue));
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return fieldValue && fieldValue !== '';
      default:
        return false;
    }
  }

  private getVariableValue(variables: Record<string, any>, variableName: string): any {
    // Support nested variable access with dot notation
    const keys = variableName.split('.');
    let value = variables;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value;
  }

  private formatValue(value: any, variableName: string): string {
    if (value === null || value === undefined) {
      return `[${variableName}]`;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  private renderConditionContent(content: string, variables: Record<string, any>): string {
    // Recursively render content within conditions
    const parsed = this.parse(content);
    return this.render(parsed, variables);
  }

  private renderMedia(mediaId: string, variables: Record<string, any>): string {
    // Placeholder for media rendering
    return `[Media: ${mediaId}]`;
  }

  private renderLoop(content: string, attributes: any, variables: Record<string, any>): string {
    // Placeholder for loop rendering
    return content;
  }

  private calculateComplexity(blocks: TemplateBlock[]): number {
    let complexity = 0;
    
    for (const block of blocks) {
      switch (block.type) {
        case 'text':
          complexity += 1;
          break;
        case 'variable':
          complexity += 2;
          break;
        case 'condition':
          complexity += 5;
          break;
        case 'media':
          complexity += 3;
          break;
        case 'loop':
          complexity += 8;
          break;
      }
    }
    
    return complexity;
  }

  private estimateRenderTime(blocks: TemplateBlock[]): number {
    // Estimate render time in milliseconds
    const baseTime = 1; // Base processing time
    const variableTime = 0.5; // Time per variable
    const conditionTime = 2; // Time per condition
    const mediaTime = 1; // Time per media
    const loopTime = 5; // Time per loop
    
    let totalTime = baseTime;
    
    for (const block of blocks) {
      switch (block.type) {
        case 'variable':
          totalTime += variableTime;
          break;
        case 'condition':
          totalTime += conditionTime;
          break;
        case 'media':
          totalTime += mediaTime;
          break;
        case 'loop':
          totalTime += loopTime;
          break;
      }
    }
    
    return Math.round(totalTime);
  }

  private validateSyntax(template: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check for unclosed variables
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push({
        type: 'syntax',
        message: 'Unmatched braces in template',
        location: { line: 0, column: 0 },
        severity: 'error'
      });
    }

    // Check for malformed conditions
    const conditionStarts = (template.match(/\{\{#if/g) || []).length;
    const conditionEnds = (template.match(/\{\{\/if\}\}/g) || []).length;
    
    if (conditionStarts !== conditionEnds) {
      errors.push({
        type: 'syntax',
        message: 'Unclosed conditional statements',
        location: { line: 0, column: 0 },
        severity: 'error'
      });
    }
  }

  private validateVariables(template: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const variableMatches = template.matchAll(this.VARIABLE_REGEX);
    
    for (const match of variableMatches) {
      const variableName = match[1].trim();
      
      // Check for empty variable names
      if (!variableName) {
        errors.push({
          type: 'variable',
          message: 'Empty variable name',
          location: { line: 0, column: match.index! },
          severity: 'error'
        });
      }
      
      // Check for invalid variable names
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(variableName)) {
        errors.push({
          type: 'variable',
          message: `Invalid variable name: ${variableName}`,
          location: { line: 0, column: match.index! },
          severity: 'error'
        });
      }
    }
  }

  private validateConditions(template: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const conditionMatches = template.matchAll(this.CONDITION_REGEX);
    
    for (const match of conditionMatches) {
      const condition = match[1].trim();
      
      if (!condition) {
        errors.push({
          type: 'condition',
          message: 'Empty condition',
          location: { line: 0, column: match.index! },
          severity: 'error'
        });
      }
    }
  }

  private validateMedia(template: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const mediaMatches = template.matchAll(this.MEDIA_REGEX);
    
    for (const match of mediaMatches) {
      const mediaId = match[1];
      
      if (!mediaId) {
        errors.push({
          type: 'media',
          message: 'Empty media reference',
          location: { line: 0, column: match.index! },
          severity: 'error'
        });
      }
    }
  }

  private generatePerformanceSuggestions(template: string, suggestions: ValidationSuggestion[]): void {
    // Check for excessive nesting
    const nestingLevel = this.calculateNestingLevel(template);
    if (nestingLevel > 3) {
      suggestions.push({
        type: 'optimization',
        description: 'Consider reducing nesting levels for better performance',
        impact: 'medium',
        auto_fixable: false
      });
    }

    // Check for unused variables
    const variables = this.extractVariables(template);
    const usedVariables = this.extractUsedVariables(template);
    const unusedVariables = variables.filter(v => !usedVariables.includes(v));
    
    if (unusedVariables.length > 0) {
      suggestions.push({
        type: 'optimization',
        description: `Remove unused variables: ${unusedVariables.join(', ')}`,
        impact: 'low',
        auto_fixable: true
      });
    }
  }

  private generateAccessibilitySuggestions(template: string, suggestions: ValidationSuggestion[]): void {
    // Check for missing alt text on media
    const mediaMatches = template.matchAll(this.MEDIA_REGEX);
    for (const match of mediaMatches) {
      suggestions.push({
        type: 'enhancement',
        description: 'Consider adding alt text for media elements',
        impact: 'high',
        auto_fixable: false
      });
    }

    // Check for readability
    const wordCount = template.split(/\s+/).length;
    if (wordCount > 100) {
      suggestions.push({
        type: 'enhancement',
        description: 'Consider breaking long templates into smaller sections',
        impact: 'medium',
        auto_fixable: false
      });
    }
  }

  private calculateNestingLevel(template: string): number {
    let maxLevel = 0;
    let currentLevel = 0;
    
    const matches = template.matchAll(/\{\{#(if|each)/g);
    for (const match of matches) {
      currentLevel++;
      maxLevel = Math.max(maxLevel, currentLevel);
    }
    
    return maxLevel;
  }

  private extractVariables(template: string): string[] {
    const variables: string[] = [];
    const matches = template.matchAll(this.VARIABLE_REGEX);
    
    for (const match of matches) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }
    
    return variables;
  }

  private extractUsedVariables(template: string): string[] {
    // This would need to be more sophisticated in a real implementation
    return this.extractVariables(template);
  }

  private optimizeVariables(template: string): string {
    // Remove duplicate variable definitions
    const seen = new Set();
    return template.replace(this.VARIABLE_REGEX, (match, variableName) => {
      const trimmed = variableName.trim();
      if (seen.has(trimmed)) {
        return '';
      }
      seen.add(trimmed);
      return match;
    });
  }

  private optimizeConditions(template: string): string {
    // Simplify redundant conditions
    return template.replace(/\{\{#if\s+true\s*\}\}(.*?)\{\{\/if\}\}/gs, '$1');
  }

  private optimizeMedia(template: string): string {
    // Optimize media references
    return template.replace(this.MEDIA_REGEX, (match, mediaId) => {
      return `[media:${mediaId.trim()}]`;
    });
  }
}