jest.disableAutomock();

const jsonSchema = require('./json-schema');

describe('convertRedshiftDdlToSchema', () => {

    describe('When convert column type', () => {
        it("converts 'character' to 'string'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'character'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['string', 'null']
                    })
                })
            }));
        });

        it("converts 'character varying' to 'string'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'character varying'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['string', 'null']
                    })
                })
            }));
        });

        it("converts 'boolean' to 'boolean'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'boolean'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['boolean', 'null']
                    })
                })
            }));
        });

        it("converts 'smallint' to 'integer'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'smallint'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['integer', 'null']
                    })
                })
            }));
        });

        it("converts 'integer' to 'integer'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'integer'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['integer', 'null']
                    })
                })
            }));
        });

        it("converts 'bigint' to 'integer'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'bigint'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['integer', 'null']
                    })
                })
            }));
        });

        it("converts 'numeric' to 'number'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'numeric'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['number', 'null']
                    })
                })
            }));
        });

        it("converts 'real' to 'number'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'real'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['number', 'null']
                    })
                })
            }));
        });

        it("converts 'double precision' to 'number'", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'double precision'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['number', 'null']
                    })
                })
            }));
        });

        it("converts 'timestamp without time zone' to 'string' with 'date-time' format", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'timestamp without time zone'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['string', 'null'],
                        format: 'date-time'
                    })
                })
            }));
        });

        it("converts 'timestamp with time zone' to 'string' with 'date-time' format", () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'timestamp with time zone'}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: ['string', 'null'],
                        format: 'date-time'
                    })
                })
            }));
        });
    });

    describe('When column is not null', () => {
        it('adds column to required property', () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'character varying', is_nullable: false}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        type: 'string'
                    })
                }),
                required: ['mock_column']
            }));
        });
    });

    describe('When column has length', () => {
        it('adds maxLength', () => {
            expect(jsonSchema.convertRedshiftDdlToSchema([{column_name: 'mock_column', data_type: 'character varying', character_maximum_length: 255}])).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        maxLength: 255
                    })
                })
            }));
        });
    });

    describe('When column has default value', () => {
        it("adds 'default string' to 'string' column type", () => {
            const ddl = [{
                column_name: 'mock_column',
                data_type: 'character varying',
                column_default: "'ABC'::character varying"
            }];

            expect(jsonSchema.convertRedshiftDdlToSchema(ddl)).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        default: 'ABC'
                    })
                })
            }));
        });

        it("adds 'default boolean' to 'boolean' column type", () => {
            const ddl = [{
                column_name: 'mock_column',
                data_type: 'boolean',
                column_default: "true"
            }];

            expect(jsonSchema.convertRedshiftDdlToSchema(ddl)).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        default: true
                    })
                })
            }));
        });

        it("adds 'default integer' to 'integer' column type", () => {
            const ddl = [{
                column_name: 'mock_column',
                data_type: 'integer',
                column_default: "10"
            }];

            expect(jsonSchema.convertRedshiftDdlToSchema(ddl)).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        default: 10
                    })
                })
            }));
        });

        it("adds 'default number' to 'numeric' column type", () => {
            const ddl = [{
                column_name: 'mock_column',
                data_type: 'numeric',
                column_default: "10.5"
            }];

            expect(jsonSchema.convertRedshiftDdlToSchema(ddl)).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        default: 10.5
                    })
                })
            }));
        });

        it("adds 'default string' to 'date-time' column type", () => {
            const ddl = [{
                column_name: 'mock_column',
                data_type: 'timestamp with time zone',
                column_default: "'2017-10-11 11:11:11+00'::timestamp with time zone"
            }];

            expect(jsonSchema.convertRedshiftDdlToSchema(ddl)).toEqual(expect.objectContaining({
                properties: expect.objectContaining({
                    mock_column: expect.objectContaining({
                        default: '2017-10-11 11:11:11+00'
                    })
                })
            }));
        });
    });
});

describe('convertSchemaPropertiesToColumn', () => {

    it("converts 'string' type to 'varchar' with length", () => {
        const columnName = 'text_column';
        const value = {
            type: ['string', 'null'],
            maxLength: 50
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual('text_column varchar(50)');
    });

    it("converts 'integer' type to 'integer'", () => {
        const columnName = 'int_column';
        const value = {
            type: ['integer', 'null']
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual('int_column integer');
    });

    it("converts 'number' type to 'float'", () => {
        const columnName = 'number_column';
        const value = {
            type: ['number', 'null']
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual('number_column float');
    });

    it("converts 'boolean' type to 'boolean'", () => {
        const columnName = 'bool_column';
        const value = {
            type: ['boolean', 'null']
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual('bool_column boolean');
    });

    it("converts 'string' type with 'date-time' format to 'timestamp'", () => {
        const columnName = 'date_column';
        const value = {
            type: ['string', 'null'],
            format: 'date-time'
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual('date_column timestamp');
    });

    it("adds default as 'string' to 'string' column type", () => {
        const columnName = 'text_column';
        const value = {
            type: ['string', 'null'],
            maxLength: 50,
            default: 'ABC'
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual("text_column varchar(50) default 'ABC'");
    });

    it("adds default as 'integer' to 'integer' column type", () => {
        const columnName = 'int_column';
        const value = {
            type: ['integer', 'null'],
            default: 100
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual("int_column integer default 100");
    });

    it("adds default as 'number' to 'float' column type", () => {
        const columnName = 'float_column';
        const value = {
            type: ['number', 'null'],
            default: 100.5
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual("float_column float default 100.5");
    });

    it("adds default as 'boolean' to 'boolean' column type", () => {
        const columnName = 'bool_column';
        const value = {
            type: ['boolean', 'null'],
            default: true
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual("bool_column boolean default true");
    });

    it("adds not null to column type", () => {
        const columnName = 'text_column';
        const value = {
            type: 'string',
            maxLength: 50
        };
        expect(jsonSchema.convertSchemaPropertiesToColumn(columnName, value)).toEqual('text_column varchar(50) not null');
    });

});

describe('convertSchemaToRedshiftDdl', () => {
    const schema = {
        type: 'object',
        properties: {
            id: {type: 'integer', default: 10},
            desc: {type: ['string', 'null'], maxLength: 500, default: 'ABC'},
            is_active: {type: ['boolean', 'null'], default: false},
            created_at: {type: 'string', format: 'date-time'}
        },
        required: ['id']
    };

    const expectedDDL = [
        'id integer default 10 not null',
        'desc varchar(500) default \'ABC\'',
        'is_active boolean default false',
        'created_at timestamp not null'
    ];

    it('generates Redshift columns DDL', () => {
        expect(jsonSchema.convertSchemaToRedshiftDdl(schema)).toEqual(expectedDDL);
    });
});
