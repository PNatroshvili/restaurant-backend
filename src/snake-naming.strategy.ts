import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return customName || propertyName.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}
