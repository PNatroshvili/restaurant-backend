"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnakeNamingStrategy = void 0;
const typeorm_1 = require("typeorm");
class SnakeNamingStrategy extends typeorm_1.DefaultNamingStrategy {
    columnName(propertyName, customName, embeddedPrefixes) {
        return customName || propertyName.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
}
exports.SnakeNamingStrategy = SnakeNamingStrategy;
//# sourceMappingURL=snake-naming.strategy.js.map