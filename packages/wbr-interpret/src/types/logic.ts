export const unaryOperators = ['$not'] as const;
export const naryOperators = ['$and', '$or'] as const;

export const operators = [...unaryOperators, ...naryOperators] as const;
export const meta = ['$before', '$after'] as const;
