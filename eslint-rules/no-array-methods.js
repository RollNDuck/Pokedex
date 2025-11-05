module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow ANY use of built-in Array methods" },
    schema: []
  },
  create(context) {
    const blocked = [
      "map", "filter", "reduce", "forEach", "some", "every",
      "find", "findIndex", "includes", "indexOf", "push", "pop",
      "shift", "unshift", "slice", "splice", "concat", "join",
      "flat", "flatMap", "sort", "reverse", "from", "isArray", "of"
    ];
    return {
      MemberExpression(node) {
        if (node.property && blocked.includes(node.property.name)) {
          context.report({
            node,
            message: `Use of Array method '${node.property.name}' is not allowed.`
          });
        }
      },
      CallExpression(node) {
        if (node.callee?.object?.name === "Array" && blocked.includes(node.callee.property?.name)) {
          context.report({
            node,
            message: `Use of Array.${node.callee.property.name}() is not allowed.`
          });
        }
      }
    };
  }
};
