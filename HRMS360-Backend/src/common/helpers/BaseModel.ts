import { Op, Utils } from "sequelize";
import { HasMany, Model } from "sequelize-typescript";
const _ = require("lodash");

export * from "sequelize-typescript";

export class BaseModel<T = any> extends Model<T> {
  static _validateIncludedElements(options, tableNames) {
    if (!options.model) options.model = this;
    tableNames = tableNames || {};

    options.includeNames = [];
    options.includeMap = {};
    options.hasSingleAssociation = false;
    options.hasMultiAssociation = false;
    if (!options.parent) {
      options.topModel = options.model;
      options.topLimit = options.limit;
    }
    options.include = options.include.map((include) => {
      include = include.model._conformInclude(include);
      include = {
        ...include,
        model: include.model.schema(options.model._schema),
      };
      include.parent = options;
      include.topLimit = options.topLimit;
      this._validateIncludedElement.call(
        options.model,
        include,
        tableNames,
        options
      );
      if (include.duplicating === void 0) {
        include.duplicating = include.association.isMultiAssociation;
      }
      include.hasDuplicating = include.hasDuplicating || include.duplicating;
      include.hasRequired = include.hasRequired || include.required;
      options.hasDuplicating = options.hasDuplicating || include.hasDuplicating;
      options.hasRequired = options.hasRequired || include.required;
      options.hasWhere =
        options.hasWhere || include.hasWhere || !!include.where;
      return include;
    });
    for (const include of options.include) {
      include.hasParentWhere = options.hasParentWhere || !!options.where;
      include.hasParentRequired =
        options.hasParentRequired || !!options.required;
      if (
        include.subQuery !== false &&
        options.hasDuplicating &&
        options.topLimit
      ) {
        if (include.duplicating) {
          include.subQuery = include.subQuery || false;
          include.subQueryFilter = include.hasRequired;
        } else {
          include.subQuery = include.hasRequired;
          include.subQueryFilter = false;
        }
      } else {
        include.subQuery = include.subQuery || false;
        if (include.duplicating) {
          include.subQueryFilter = include.subQuery;
        } else {
          include.subQueryFilter = false;
          include.subQuery =
            include.subQuery ||
            (include.hasParentRequired &&
              include.hasRequired &&
              !include.separate);
        }
      }
      options.includeMap[include.as] = include;
      options.includeNames.push(include.as);
      if (
        options.topModel === options.model &&
        options.subQuery === void 0 &&
        options.topLimit
      ) {
        if (include.subQuery) {
          options.subQuery = include.subQuery;
        } else if (include.hasDuplicating) {
          options.subQuery = true;
        }
      }
      options.hasIncludeWhere =
        options.hasIncludeWhere || include.hasIncludeWhere || !!include.where;
      options.hasIncludeRequired =
        options.hasIncludeRequired ||
        include.hasIncludeRequired ||
        !!include.required;
      if (
        include.association.isMultiAssociation ||
        include.hasMultiAssociation
      ) {
        options.hasMultiAssociation = true;
      }
      if (
        include.association.isSingleAssociation ||
        include.hasSingleAssociation
      ) {
        options.hasSingleAssociation = true;
      }
    }
    if (options.topModel === options.model && options.subQuery === void 0) {
      options.subQuery = false;
    }

    return options;
  }

  static _validateIncludedElement(include, tableNames, options) {
    tableNames[include.model.getTableName()] = true;
    if (include.attributes && !options.raw) {
      include.model._expandAttributes(include);
      include.originalAttributes =
        include.model._injectDependentVirtualAttributes(include.attributes);
      include = Utils.mapFinderOptions(include, include.model);
      if (include.attributes.length) {
        _.each(include.model.primaryKeys, (attr, key) => {
          if (
            !include.attributes.some((includeAttr) => {
              if (attr.field !== key) {
                return (
                  Array.isArray(includeAttr) &&
                  includeAttr[0] === attr.field &&
                  includeAttr[1] === key
                );
              }
              return includeAttr === key;
            })
          ) {
            include.attributes.unshift(key);
          }
        });
      }
    } else {
      include = Utils.mapFinderOptions(include, include.model);
    }
    if (include._pseudo) {
      if (!include.attributes) {
        include.attributes = Object.keys(include.model.tableAttributes);
      }
      return Utils.mapFinderOptions(include, include.model);
    }
    const association =
      include.association ||
      this["_getIncludedAssociation"](include.model, include.as);
    include.association = association;
    include.as = association.as;
    if (
      include.association.through &&
      Object(include.association.through.model) ===
        include.association.through.model
    ) {
      if (!include.include) include.include = [];
      let through = include.association.through;
      through.model = through.model.schema(options.model._schema);
      through.tableName = through.model.getTableName().toString();

      include.through = _.defaults(include.through || {}, {
        model: through.model,
        as: through.model.name,
        association: {
          isSingleAssociation: true,
        },
        _pseudo: true,
        parent: include,
      });

      if (through.scope) {
        include.through.where = include.through.where
          ? { [Op.and]: [include.through.where, through.scope] }
          : through.scope;
      }

      if (!through.attributes || !include.through.attributes) {
        through.attributes = Object.keys(through.model.getAttributes());
        include.through.attributes = Object.keys(through.model.getAttributes());
      }

      include.include.push(include.through);
      tableNames[through.tableName] = true;
    }
    let model;
    if (include.model.scoped === true) {
      model = include.model;
    } else {
      model =
        include.association.target.name === include.model.name
          ? include.association.target
          : include.association.source;
    }
    model._injectScope(include);
    if (!include.attributes) {
      include.attributes = Object.keys(include.model.tableAttributes);
    }
    include = Utils.mapFinderOptions(include, include.model);
    if (include.required === void 0) {
      include.required = !!include.where;
    }
    if (include.association.scope) {
      include.where = include.where
        ? { [Op.and]: [include.where, include.association.scope] }
        : include.association.scope;
    }
    if (include.limit && include.separate === void 0) {
      include.separate = true;
    }
    if (include.separate === true) {
      if (!(include.association instanceof HasMany)) {
        throw new Error("Only HasMany associations support include.separate");
      }
      include.duplicating = false;
      if (
        options.attributes &&
        options.attributes.length &&
        !_.flattenDepth(options.attributes, 2).includes(association.sourceKey)
      ) {
        options.attributes.push(association.sourceKey);
      }
      if (
        include.attributes &&
        include.attributes.length &&
        !_.flattenDepth(include.attributes, 2).includes(association.foreignKey)
      ) {
        include.attributes.push(association.foreignKey);
      }
    }
    if (Object.prototype.hasOwnProperty.call(include, "include")) {
      this._validateIncludedElements.call(include.model, include, tableNames);
    }
    return include;
  }
}
