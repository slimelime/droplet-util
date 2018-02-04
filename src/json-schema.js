/* eslint-disable max-statements-per-line */

const _ = require('lodash');

function convertRedshiftDdlToSchema(ddl) {
    return ddl.reduce((acc, column) => {
        const {column_name, data_type, is_nullable = true, character_maximum_length, column_default} = column;

        const schema = convertColumnType(data_type, column_default);
        if (character_maximum_length) schema['maxLength'] = character_maximum_length;
        if (is_nullable) schema['type'] = [schema['type'], 'null'];
        else acc['required'].push(column_name);

        acc.properties[column_name] = schema;
        return acc;
    }, {
        type: 'object',
        properties: {},
        required: []
    });
}

function convertSchemaToRedshiftDdl(schema) {
    const {properties} = schema;
    const keys = _.keys(properties);
    return keys.map(key => convertSchemaPropertiesToColumn(key, properties[key]));
}

function convertSchemaPropertiesToColumn(columnName, value) {
    const {type: types, format, maxLength, default: _default} = value; // Avoid "default" reserve word

    const type = Array.isArray(types) ? _.head(types.filter(_type => _type !== 'null')) : types;
    const isNull = Array.isArray(types) ? types.includes('null') : false;

    return `${columnName} ${convertColumnDdl(type, format, maxLength, _default)}${(!isNull) ? ' not null' : ''}`;
}

function convertColumnDdl(type, format = '', maxLength, _default) {
    let columnString = '';

    switch (type) {
    case 'string':
        columnString = (format === 'date-time') ? 'timestamp' : `varchar(${maxLength})`;
        if (_default !== undefined) columnString = `${columnString} default '${_default}'`;
        break;
    case 'integer':
        columnString = 'integer';
        if (_default !== undefined) columnString = `${columnString} default ${_default}`;
        break;
    case 'number':
        columnString = 'float';
        if (_default !== undefined) columnString = `${columnString} default ${_default}`;
        break;
    case 'boolean':
        columnString = 'boolean';
        if (_default !== undefined) columnString = `${columnString} default ${_default}`;
        break;
    default:
        columnString = '';
        break;
    }

    return columnString;
}

function convertColumnType(dataType, columnDefault) {
    const schemaProperty = {};

    switch (dataType) {
    case 'character':
    case 'character varying':
        schemaProperty['type'] = 'string';
        if (columnDefault) schemaProperty['default'] = unquote(stripCast(columnDefault));
        break;
    case 'boolean':
        schemaProperty['type'] = 'boolean';
        if (columnDefault) schemaProperty['default'] = (columnDefault === 'true');
        break;
    case 'smallint':
    case 'integer':
    case 'bigint':
        schemaProperty['type'] = 'integer';
        if (columnDefault) schemaProperty['default'] = Number(columnDefault);
        break;
    case 'numeric':
    case 'real':
    case 'double precision':
        schemaProperty['type'] = 'number';
        if (columnDefault) schemaProperty['default'] = Number(columnDefault);
        break;
    case 'timestamp without time zone':
    case 'timestamp with time zone':
        schemaProperty['type'] = 'string';
        schemaProperty['format'] = 'date-time';
        if (columnDefault) schemaProperty['default'] = unquote(stripCast(columnDefault));
        break;
    default:
        schemaProperty['type'] = 'null';
        break;
    }

    return schemaProperty;
}

function stripCast(val) {
    return val.match(/::[\w ]+$/) ? val.match(/^\(?(.*?)\)?::[\w ]+$/)[1] : val;
}

function unquote(value) {
    if (value[0] === "'") return value.slice(1, -1);
    else return value;
}

module.exports = {
    convertRedshiftDdlToSchema,
    convertSchemaToRedshiftDdl,
    convertSchemaPropertiesToColumn
};
