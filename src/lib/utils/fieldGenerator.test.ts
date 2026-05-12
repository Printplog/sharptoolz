import { describe, it, expect } from 'vitest';
import { generateValue } from './fieldGenerator';

describe('generateValue', () => {
  const allFields = {
    'Passenger_Name': 'John Doe',
    'Flight_Number': 'TK123',
    'Departure_City': 'Istanbul',
  };

  it('should handle simple static text', () => {
    expect(generateValue('Hello_World')).toBe('Hello World');
  });

  it('should handle dependency references', () => {
    expect(generateValue('(dep_Passenger_Name)', allFields)).toBe('John Doe');
  });

  it('should handle mixed static and dependency', () => {
    expect(generateValue('Name:_ (dep_Passenger_Name)', allFields)).toBe('Name:  John Doe');
  });

  it('should handle multiple dependencies', () => {
    expect(generateValue('(dep_Flight_Number):_ (dep_Departure_City)', allFields)).toBe('TK123:  Istanbul');
  });

  it('should handle underscores inside dependencies correctly', () => {
    // The DSL uses underscores for spaces, but they should be preserved inside (dep_...)
    expect(generateValue('Info:_ (dep_Passenger_Name)', allFields)).toBe('Info:  John Doe');
  });

  it('should handle newlines', () => {
    expect(generateValue('Line1\\nLine2')).toBe('Line1\nLine2');
  });

  it('should handle random numbers', () => {
    const val = generateValue('(rn[6])');
    expect(val).toMatch(/^\d{6}$/);
  });
});

describe('parseQRCodePattern (Regex Test)', () => {
  const decode = (pattern: string) => {
    return pattern.replace(/(\([^)]+\))|(_)/g, (_match, group1, _group2) => {
      if (group1) return group1;
      return ' ';
    });
  };

  it('should decode underscores outside parentheses', () => {
    expect(decode('Name:_John')).toBe('Name: John');
  });

  it('should NOT decode underscores inside parentheses', () => {
    expect(decode('(dep_Passenger_Name)')).toBe('(dep_Passenger_Name)');
  });

  it('should handle mixed content', () => {
    expect(decode('Name:_(dep_Passenger_Name)')).toBe('Name: (dep_Passenger_Name)');
  });
});
