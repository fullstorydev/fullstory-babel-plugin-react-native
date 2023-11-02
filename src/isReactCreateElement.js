import { visitors } from '@babel/traverse';

const SUPPORTED_DEFINITION_TYPES = [
  // potential stateless function component
  'ArrowFunctionExpression',
  /**
   * Adds support for libraries such as
   * [system-components]{@link https://jxnblk.com/styled-system/system-components} that use
   * CallExpressions to generate components.
   *
   * While react-docgen's built-in resolvers do not support resolving
   * CallExpressions definitions, third-party resolvers (such as
   * https://github.com/Jmeyering/react-docgen-annotation-resolver) could be
   * used to add these definitions.
   */
  'CallExpression',
  'ClassDeclaration',
  'ClassExpression',
  // potential stateless function component
  'FunctionDeclaration',
  // potential stateless function component
  'FunctionExpression',
  'ObjectExpression',
  // potential stateless function component
  // TODO ryanwang ObjectMethod causes TypeError in react-navigation
  // 'ObjectMethod',
  /**
   * Adds support for libraries such as
   * [styled components]{@link https://github.com/styled-components} that use
   * TaggedTemplateExpression's to generate components.
   *
   * While react-docgen's built-in resolvers do not support resolving
   * TaggedTemplateExpression definitions, third-party resolvers (such as
   * https://github.com/Jmeyering/react-docgen-annotation-resolver) could be
   * used to add these definitions.
   */
  'TaggedTemplateExpression',
  'VariableDeclaration',
];

function isSupportedDefinitionType(path) {
  return SUPPORTED_DEFINITION_TYPES.includes(path.node.type);
}

const reactModules = ['react', 'react/addons', 'react-native', 'proptypes', 'prop-types'];

function ignore(path) {
  path.skip();
}

const shallowIgnoreVisitors = {
  FunctionDeclaration: { enter: ignore },
  FunctionExpression: { enter: ignore },
  Class: { enter: ignore },
  IfStatement: { enter: ignore },
  WithStatement: { enter: ignore },
  SwitchStatement: { enter: ignore },
  CatchClause: { enter: ignore },
  Loop: { enter: ignore },
  ExportNamedDeclaration: { enter: ignore },
  ExportDefaultDeclaration: { enter: ignore },
  ConditionalExpression: { enter: ignore },
};

const explodedVisitors = visitors.explode({
  ...shallowIgnoreVisitors,

  AssignmentExpression: {
    enter: function (assignmentPath, state) {
      const node = state.idPath.node;
      const left = assignmentPath.get('left');

      // Skip anything that is not an assignment to a variable with the
      // passed name.
      // Ensure the LHS isn't the reference we're trying to resolve.
      if (
        !left.isIdentifier() ||
        left.node === node ||
        left.node.name !== node.name ||
        assignmentPath.node.operator !== '='
      ) {
        return assignmentPath.skip();
      }
      // Ensure the RHS doesn't contain the reference we're trying to resolve.
      const candidatePath = assignmentPath.get('right');

      if (
        candidatePath.node === node ||
        state.idPath.findParent(parent => parent.node === candidatePath.node)
      ) {
        return assignmentPath.skip();
      }

      state.resultPath = candidatePath;

      return assignmentPath.skip();
    },
  },
});

function getMemberExpressionRoot(memberExpressionPath) {
  let path = memberExpressionPath;

  while (path.isMemberExpression()) {
    path = path.get('object');
  }

  return path;
}

function findLastAssignedValue(path, idPath) {
  const state = { idPath };

  path.traverse(explodedVisitors, state);

  return state.resultPath ? resolveToValue(state.resultPath) : null;
}

function findScopePath(bindingIdentifiers) {
  if (bindingIdentifiers && bindingIdentifiers[0]) {
    const resolvedParentPath = bindingIdentifiers[0].parentPath;

    if (resolvedParentPath.isImportDefaultSpecifier() || resolvedParentPath.isImportSpecifier()) {
      let exportName;

      if (resolvedParentPath.isImportDefaultSpecifier()) {
        exportName = 'default';
      } else {
        const imported = resolvedParentPath.get('imported');

        if (imported.isStringLiteral()) {
          exportName = imported.node.value;
        } else if (imported.isIdentifier()) {
          exportName = imported.node.name;
        }
      }

      if (!exportName) {
        throw new Error('Could not detect export name');
      }
    }

    return resolveToValue(resolvedParentPath);
  }

  return null;
}

/**
 * Splits a MemberExpression or CallExpression into parts.
 * E.g. foo.bar.baz becomes ['foo', 'bar', 'baz']
 */
function toArray(path) {
  const parts = [path];
  let result = [];

  while (parts.length > 0) {
    path = parts.shift();
    if (path.isCallExpression()) {
      parts.push(path.get('callee'));
      continue;
    } else if (path.isMemberExpression()) {
      parts.push(path.get('object'));
      const property = path.get('property');

      if (path.node.computed) {
        const resolvedPath = resolveToValue(property);

        if (resolvedPath !== undefined) {
          result = result.concat(toArray(resolvedPath));
        } else {
          result.push('<computed>');
        }
      } else if (property.isIdentifier()) {
        result.push(property.node.name);
      } else if (property.isPrivateName()) {
        // new test
        result.push(`#${property.get('id').node.name}`);
      }
      continue;
    } else if (path.isIdentifier()) {
      result.push(path.node.name);
      continue;
    } else if (path.isTSAsExpression()) {
      const expression = path.get('expression');

      if (expression.isIdentifier()) {
        result.push(expression.node.name);
      }
      continue;
    } else if (path.isLiteral() && path.node.extra?.raw) {
      result.push(path.node.extra.raw);
      continue;
    } else if (path.isThisExpression()) {
      result.push('this');
      continue;
    } else if (path.isObjectExpression()) {
      const properties = path.get('properties').map(function (property) {
        if (property.isSpreadElement()) {
          return `...${toString(property.get('argument'))}`;
        } else if (property.isObjectProperty()) {
          return toString(property.get('key')) + ': ' + toString(property.get('value'));
        } else if (property.isObjectMethod()) {
          return toString(property.get('key')) + ': <function>';
        } else {
          throw new Error('Unrecognized object property type');
        }
      });

      result.push('{' + properties.join(', ') + '}');
      continue;
    } else if (path.isArrayExpression()) {
      result.push(
        '[' +
          path
            .get('elements')
            .map(function (el) {
              return toString(el);
            })
            .join(', ') +
          ']',
      );
      continue;
    }
  }

  return result.reverse();
}

/**
 * Creates a string representation of a member expression.
 */
function toString(path) {
  return toArray(path).join('.');
}

/**
 * Returns true if the expression is a function call of the form
 * `React.forwardRef(...)`.
 */
function isReactForwardRefCall(path) {
  return isReactBuiltinCall(path, 'forwardRef') && path.get('arguments').length === 1;
}

function resolveName(path) {
  if (path.isVariableDeclaration()) {
    const declarations = path.get('declarations');

    if (declarations.length > 1) {
      throw new TypeError(
        'Got unsupported VariableDeclaration. VariableDeclaration must only ' +
          'have a single VariableDeclarator. Got ' +
          declarations.length +
          ' declarations.',
      );
    }
    // VariableDeclarator always has at least one declaration, hence the non-null-assertion
    const id = declarations[0].get('id');

    if (id.isIdentifier()) {
      return id.node.name;
    }

    return;
  }

  if (path.isFunctionDeclaration()) {
    const id = path.get('id');

    if (id.isIdentifier()) {
      return id.node.name;
    }

    return;
  }

  if (
    path.isFunctionExpression() ||
    path.isArrowFunctionExpression() ||
    path.isTaggedTemplateExpression() ||
    path.isCallExpression() ||
    isReactForwardRefCall(path)
  ) {
    let currentPath = path;

    while (currentPath.parentPath) {
      if (currentPath.parentPath.isVariableDeclarator()) {
        const id = currentPath.parentPath.get('id');

        if (id.isIdentifier()) {
          return id.node.name;
        }

        return;
      }

      currentPath = currentPath.parentPath;
    }

    return;
  }

  throw new TypeError(
    'Attempted to resolveName for an unsupported path. resolveName does not accept ' +
      path.node.type +
      '".',
  );
}

function getMemberExpressionValuePath(variableDefinition, memberName) {
  const localName = resolveName(variableDefinition);

  if (!localName) {
    // likely an immediately exported and therefore nameless/anonymous node
    // passed in
    return null;
  }

  const state = {
    localName,
    memberName,
    result: null,
  };

  if (variableDefinition.hub.file.traverse) {
    variableDefinition.hub.file.traverse(explodedVisitors, state);
  }

  return state.result;
}

function getClassMemberValuePath(classDefinition, memberName) {
  const classMember = classDefinition
    .get('body')
    .get('body')
    .find(memberPath => {
      if (
        (memberPath.isClassMethod() && memberPath.node.kind !== 'set') ||
        memberPath.isClassProperty()
      ) {
        const key = memberPath.get('key');

        return (!memberPath.node.computed || key.isLiteral()) && getNameOrValue(key) === memberName;
      }

      return false;
    });

  if (classMember) {
    // For ClassProperty we return the value and for ClassMethod
    // we return itself
    return classMember.isClassMethod() ? classMember : classMember.get('value');
  }

  return null;
}

export const COMPUTED_PREFIX = '@computed#';

/**
 * In an ObjectExpression, the name of a property can either be an identifier
 * or a literal (or dynamic, but we don't support those). This function simply
 * returns the value of the literal or name of the identifier.
 */
function getPropertyName(propertyPath) {
  if (propertyPath.isObjectTypeSpreadProperty()) {
    const argument = propertyPath.get('argument');

    if (argument.isGenericTypeAnnotation()) {
      return getNameOrValue(argument.get('id'));
    }

    return null;
  } else if (propertyPath.has('computed')) {
    const key = propertyPath.get('key');

    // Try to resolve variables and member expressions
    if (key.isIdentifier() || key.isMemberExpression()) {
      const valuePath = resolveToValue(key);

      if (valuePath.isStringLiteral() || valuePath.isNumericLiteral()) {
        return `${valuePath.node.value}`;
      }
    }

    // generate name for identifier
    if (key.isIdentifier()) {
      return `${COMPUTED_PREFIX}${key.node.name}`;
    }

    if (key.isStringLiteral() || key.isNumericLiteral()) {
      return `${key.node.value}`;
    }

    return null;
  }

  return `${getNameOrValue(propertyPath.get('key'))}`;
}

/**
 * Given an ObjectExpression, this function returns the path of the value of
 * the property with name `propertyName`. if the property is an ObjectMethod we
 * return the ObjectMethod itself.
 */
function getPropertyValuePath(path, propertyName) {
  const property = path
    .get('properties')
    .find(
      propertyPath =>
        !propertyPath.isSpreadElement() && getPropertyName(propertyPath) === propertyName,
    );

  if (property) {
    return property.isObjectMethod() ? property : property.get('value');
  }

  return null;
}

/**
 * If node is an Identifier, it returns its name. If it is a literal, it returns
 * its value.
 */
function getNameOrValue(path) {
  if (path.isIdentifier()) {
    return path.node.name;
  } else if (path.isStringLiteral() || path.isNumericLiteral() || path.isBooleanLiteral()) {
    return path.node.value;
  } else if (path.isRegExpLiteral()) {
    return path.node.pattern;
  } else if (path.isNullLiteral()) {
    return null;
  }

  throw new TypeError(
    `Argument must be Identifier, Literal, QualifiedTypeIdentifier or TSQualifiedName. Received '${path.node.type}'`,
  );
}

/**
 * This is a helper method for handlers to make it easier to work either with
 * an ObjectExpression from `React.createClass` class or with a class
 * definition.
 *
 * Given a path and a name, this function will either return the path of the
 * property value if the path is an ObjectExpression, or the value of the
 * ClassProperty/MethodDefinition if it is a class definition (declaration or
 * expression).
 *
 * It also normalizes the names so that e.g. `defaultProps` and
 * `getDefaultProps` can be used interchangeably.
 */
function getMemberValuePath(componentDefinition, memberName) {
  let result;

  if (componentDefinition.isObjectExpression()) {
    result = getPropertyValuePath(componentDefinition, memberName);
    if (!result && memberName === 'defaultProps') {
      result = getPropertyValuePath(componentDefinition, 'getDefaultProps');
    }
  } else if (componentDefinition.isClassDeclaration() || componentDefinition.isClassExpression()) {
    result = getClassMemberValuePath(componentDefinition, memberName);
    if (!result && memberName === 'defaultProps') {
      result = getClassMemberValuePath(componentDefinition, 'getDefaultProps');
    }
  } else {
    result = getMemberExpressionValuePath(componentDefinition, memberName);
    if (!result && memberName === 'defaultProps') {
      result = getMemberExpressionValuePath(componentDefinition, 'getDefaultProps');
    }
  }

  const postprocessMethod = POSTPROCESS_MEMBERS.get(memberName);

  if (result && postprocessMethod) {
    result = postprocessMethod(result);
  }

  return result;
}

function resolveFunctionDefinitionToReturnValue(path) {
  const body = path.get('body');
  const state = {};

  body.traverse(explodedVisitors, state);

  return state.returnPath || null;
}

const postprocessPropTypes = path =>
  path.isFunction() ? resolveFunctionDefinitionToReturnValue(path) : path;

const POSTPROCESS_MEMBERS = new Map([['propTypes', postprocessPropTypes]]);

function resolveToValue(path) {
  if (path.isIdentifier()) {
    if (
      (path.parentPath.isClass() || path.parentPath.isFunction()) &&
      path.parentPath.get('id') === path
    ) {
      return path.parentPath;
    }

    const binding = path.scope.getBinding(path.node.name);
    let resolvedPath = null;

    if (binding) {
      // The variable may be assigned a different value after initialization.
      // We are first trying to find all assignments to the variable in the
      // block where it is defined (i.e. we are not traversing into statements)

      // TODO ryanwang causes infinite loop in demo
      // resolvedPath = findLastAssignedValue(binding.scope.path, path);
      if (!resolvedPath) {
        const bindingMap = binding.path.getOuterBindingIdentifierPaths(true);

        resolvedPath = findScopePath(bindingMap[path.node.name]);
      }
    }

    return resolvedPath || path;
  } else if (path.isVariableDeclarator()) {
    const init = path.get('init');

    if (init.hasNode()) {
      return resolveToValue(init);
    }
  } else if (path.isMemberExpression()) {
    const root = getMemberExpressionRoot(path);
    const resolved = resolveToValue(root);

    if (resolved.isObjectExpression()) {
      let propertyPath = resolved;

      for (const propertyName of toArray(path).slice(1)) {
        if (propertyPath && propertyPath.isObjectExpression()) {
          propertyPath = getPropertyValuePath(propertyPath, propertyName);
        }
        if (!propertyPath) {
          return path;
        }
        propertyPath = resolveToValue(propertyPath);
      }

      return propertyPath;
    } else if (isSupportedDefinitionType(resolved)) {
      const property = path.get('property');

      if (property.isIdentifier() || property.isStringLiteral()) {
        const memberPath = getMemberValuePath(
          resolved,
          property.isIdentifier() ? property.node.name : property.node.value,
        );

        if (memberPath) {
          return resolveToValue(memberPath);
        }
      }
    } else if (
      resolved.isImportSpecifier() ||
      resolved.isImportDefaultSpecifier() ||
      resolved.isImportNamespaceSpecifier()
    ) {
      const declaration = resolved.parentPath;

      // Handle references to namespace imports, e.g. import * as foo from 'bar'.
      // Try to find a specifier that matches the root of the member expression, and
      // find the export that matches the property name.
      for (const specifier of declaration.get('specifiers')) {
        const property = path.get('property');
        let propertyName;

        if (property.isIdentifier() || property.isStringLiteral()) {
          propertyName = getNameOrValue(property);
        }

        if (
          specifier.isImportNamespaceSpecifier() &&
          root.isIdentifier() &&
          propertyName &&
          specifier.node.local.name === root.node.name
        ) {
          let resolvedPath;
          if (path.hub.import) {
            resolvedPath = path.hub.import(declaration, propertyName);
          }

          if (resolvedPath) {
            return resolveToValue(resolvedPath);
          }
        }
      }
    }
  } else if (path.isTypeCastExpression() || path.isTSAsExpression() || path.isTSTypeAssertion()) {
    return resolveToValue(path.get('expression'));
  }

  return path;
}

function resolveToModule(path) {
  if (path.isVariableDeclarator()) {
    if (path.node.init) {
      return resolveToModule(path.get('init'));
    }
  } else if (path.isCallExpression()) {
    const callee = path.get('callee');

    if (callee.isIdentifier({ name: 'require' })) {
      return path.node.arguments[0].value;
    }

    return resolveToModule(callee);
  } else if (path.isIdentifier() || path.isJSXIdentifier()) {
    const valuePath = resolveToValue(path);

    if (valuePath !== path) {
      return resolveToModule(valuePath);
    }
    if (path.parentPath.isObjectProperty()) {
      return resolveToModule(path.parentPath);
    }
  } else if (path.isObjectProperty() || path.isObjectPattern()) {
    return resolveToModule(path.parentPath);
  } else if (path.parentPath?.isImportDeclaration()) {
    return path.parentPath.node.source.value;
  } else if (path.isMemberExpression()) {
    path = getMemberExpressionRoot(path);

    return resolveToModule(path);
  }

  return null;
}

function isReactModuleName(moduleName) {
  return reactModules.some(function (reactModuleName) {
    return reactModuleName === moduleName.toLowerCase();
  });
}

function isDestructuringAssignment(path, name) {
  if (!path.isObjectProperty()) {
    return false;
  }

  const id = path.get('key');

  return id.isIdentifier({ name }) && path.parentPath.isObjectPattern();
}

function isImportSpecifier(path, name) {
  return (
    path.isImportSpecifier() &&
    (path.get('imported').isIdentifier({ name }) ||
      path.get('imported').isStringLiteral({ value: name }))
  );
}

function isNamedMemberExpression(value, name) {
  if (!value.isMemberExpression()) {
    return false;
  }

  const property = value.get('property');

  return property.isIdentifier() && property.node.name === name;
}

function isReactBuiltinReference(path, name) {
  if (path.isMemberExpression() && path.get('property').isIdentifier({ name })) {
    const module = resolveToModule(path.get('object'));

    return Boolean(module && isReactModuleName(module));
  }

  // Typescript
  if (path.isTSQualifiedName() && path.get('right').isIdentifier({ name })) {
    const module = resolveToModule(path.get('left'));

    return Boolean(module && isReactModuleName(module));
  }

  // Flow
  if (path.isQualifiedTypeIdentifier() && path.get('id').isIdentifier({ name })) {
    const module = resolveToModule(path.get('qualification'));

    return Boolean(module && isReactModuleName(module));
  }

  const value = resolveToValue(path);

  if (value === path) {
    return false;
  }

  if (
    // const { x } = require('react')
    isDestructuringAssignment(value, name) ||
    // `require('react').createElement`
    isNamedMemberExpression(value, name) ||
    // `import { createElement } from 'react'`
    isImportSpecifier(value, name)
  ) {
    const module = resolveToModule(value);

    return Boolean(module && isReactModuleName(module));
  }

  return false;
}

function isReactBuiltinCall(path, name) {
  if (!path.isCallExpression()) {
    return false;
  }

  const callee = path.get('callee');

  return isReactBuiltinReference(callee, name);
}

export function isReactCreateElementCall(path) {
  return isReactBuiltinCall(path, 'createElement');
}
