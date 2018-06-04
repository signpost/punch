var LoadActiveTemplateHelper = require("../load_active_template_helper");

var fs = require('fs');

describe("loadActiveTemplateFromIndex", function() {
    var sample_config = {
        activeTemplatePath: '/spec/path/to/templates/',
        templateTagName: 'tagName'
    };

    it('reads, parses, and returns the active template', function() {
        LoadActiveTemplateHelper.setup(sample_config);

        expect(LoadActiveTemplateHelper.activeTemplatePath).toBe('/spec/path/to/templates/');
        expect(LoadActiveTemplateHelper.templateTagName).toBe('tagName');

        var expectedFileSyncs = [
            {
                path: __dirname + '/path/to/templates/index.json',
                return: '[{"isActive":true,"fullMarkupFile":"activeTemplate"}]'
            },
            {
                path: __dirname + '/path/to/templates/activeTemplate',
                return: 'template markup'
            }
        ];

        spyOn(fs, "readFileSync").andCallFake(function(pathToIndex, encoding) {
            var expected = expectedFileSyncs.shift();
            expect(pathToIndex).toBe(expected.path);
            expect(encoding).toBe('utf8');

            return expected.return;
        });

        var callback = jasmine.createSpy();

        LoadActiveTemplateHelper.get(null, null, null, callback);

        expect(callback).toHaveBeenCalledWith(
            null,
            {
                tag: {
                    tagName: 'template markup'
                },
                block: {}
            },
            {},
            {}
        );
    });
});
