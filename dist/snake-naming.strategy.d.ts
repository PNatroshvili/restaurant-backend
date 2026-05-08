import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
export declare class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
    columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string;
}
